var https = require('https');
var fs = require('fs');
var express = require('express');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var Big = require('big.js');
var moment = require('moment');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const csv = require('csv');

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var parser = require('./parser');
var database = require('./database');
const secrets = require('./secrets');

var app = express();

passport.serializeUser((user, done) => done(null, user) );
passport.deserializeUser((user, done) => done(null, user) );
passport.use(new GoogleStrategy({
		clientID: secrets.googleAPIClientId,
		clientSecret: secrets.googleAPIClientSecret,
		callbackURL: process.env.HOSTNAME + '/auth/google'
	},
	(token, refresh, profile, done) => done(null, { profile, token })
));

app.use(function(req, res, next) {
	var start = Date.now();
	res.on('finish', function() {
		var duration = Date.now() - start;
		console.log(req.url, duration);
	});
	next();
});

app.use(passport.initialize());
app.use(bodyParser.json({ type: ['application/json', 'application/json-patch+json'] }));
app.use(cookieParser());

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'], session: false }), (req, res, next) => {
	const xsrfToken = crypto.randomBytes(33).toString('base64');

	const email = req.user.profile.emails.filter(e => e.type === 'account')[0].value

	if(!secrets.whitelist.includes(email)) {
		return res.status(401)
			.set({ 'WWW-Authenticate': 'Bearer realm="Sludge tool"' })
			.sendFile(require.resolve('../app/401.html'));
	}

	const payload = { email, xsrfToken };
	const token = jwt.sign(payload, secrets.jwtSecret, { expiresIn: '24h' });

	res.cookie('xsrf-token', xsrfToken, {
		secure: process.env.COOKIE_SECURE === 'true',
		maxAge: 24 * 60 * 60 * 1000,
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
	})

	res.cookie('access-token',token, {
		httpOnly: true,
		secure: process.env.COOKIE_SECURE === 'true',
		maxAge: 24 * 60 * 60 * 1000,
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
	});

	res.redirect('/');
});

const authenticator = failure => {
	return express.Router().use((req, res, next) => {
		const token = (req.headers['Authorization'] || '').substring('Bearer '.length) || req.cookies['access-token'];

		jwt.verify(token, secrets.jwtSecret, (err, decoded) => {
			req.decoded = decoded;
			return err
				? failure(res)
				: next();
		});
	});
}

const xsrfCheck = failure => {
	return express.Router().use((req, res, next) => {
		return !req.decoded.xsrfToken || req.headers['x-xsrf-token'] !== req.decoded.xsrfToken
			? failure(res)
			: next();
	})
}

const authFail = res => res.status(403).send({ success: false, message: 'Token not provided or invalid.' });
app.use('/api', authenticator(authFail), xsrfCheck(authFail));

app.get('/api/transactions', function (req, res) {
	const offset = Number.parseInt(req.query.offset || '0');
	const limit = Number.parseInt(req.query.limit || '50');

	const query = { order: [['date', 'DESC'], ['ordinal', 'DESC'], 'account'], offset, limit };
	query.where = database.buildFilter({
		bucketId: req.query.bucketId ? JSON.parse(req.query.bucketId) : undefined,
		account: req.query.account,
		search: req.query.search
	});

	database.transaction.findAndCountAll(query).then(function (result) {
		res.json({
			offset,
			limit,
			total: result.count,
			transactions: result.rows
		});
	});
});

app.get('/api/transactions/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		res.json(transaction.dataValues);
	});
});

app.patch('/api/transactions/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		var newTransaction = Object.assign({}, transaction.dataValues);
		rfc6902.applyPatch(newTransaction, req.body);
		database.transaction.update(newTransaction, { where: { id: newTransaction.id } });
		res.json(newTransaction);
	});
});

app.patch('/api/buckets/:id', function (req, res) {
	database.bucket.findOne({
		where: { id: req.params.id }
	}).then(bucket => {
		var newBucket = Object.assign({}, bucket.dataValues);
		rfc6902.applyPatch(newBucket, req.body);
		return database.bucket.update(newBucket, { where: { id: newBucket.id } });
	}).then(() => getBuckets(req.params.id))
		.then(buckets => res.json(buckets[0]))
		.catch(e => console.log(e));
});

app.delete('/api/buckets/:id', function (req, res) {
	database.bucket.destroy({
		where: { id: req.params.id }
	})
		.then(() => res.sendStatus(200))
		.catch(e => {
			if(e instanceof Sequelize.ForeignKeyConstraintError) {
				res.sendStatus(409);
			}
		});
});

app.post('/api/transactions/import/:filename', function (req, res) {
	req.setEncoding('utf8');

	let formats = parser.parse(req.params.filename, req);

	let status = 500;

	Promise.all(formats.map(format => format.parse())).then(results => {
		status = results.filter(r => r).length === 1 ? 200 : 400
	})

	Promise.all(formats.map(format => {
		const { importer, promise } = database.importTransactions();
		format.pipe(importer);
		return promise;
	}))
		.then(() => database.applyRules()) // apply auto-categorisation rules
		.then(() => res.sendStatus(status));
});

function getBuckets(id) {
	const {or, eq, gt} = Sequelize.Op;

	let query = {
		include: [{
			model: database.transaction,
			as: 'zeroTransaction',
			attributes: ['date', 'ordinal']
		}, {
			model: database.transaction,
			as: 'transactions',
			required: false,
			where: { [or] : [
				{ date: { [gt]: Sequelize.col('zeroTransaction.date') } },
				{ date: { [eq]: Sequelize.col('zeroTransaction.date') }, ordinal: { [gt]: Sequelize.col('zeroTransaction.ordinal') } }
			]}
		}]
	};

	query['where'] = id !== undefined ? { id } : undefined;

	return database.bucket.findAll(query)
		.then(dbBuckets => dbBuckets.map(dbBucket => {
			const { zeroTransaction, transactions, ...bucket } = dbBucket.toJSON();
			const balance = transactions.reduce((balance, transaction) => balance.plus(transaction.amount), new Big(0)).toFixed(2);

			const nextDate = moment(bucket.nextDate);
			if(moment().isAfter(nextDate)) {
				const diff = moment().diff(nextDate, bucket.periodUnit, true);
				const periods = Math.ceil(diff / bucket.period);
				nextDate.add(bucket.period * periods, bucket.periodUnit);
			}

			const zeroDate = zeroTransaction
				? zeroTransaction.date
				: moment(bucket.nextDate).subtract(bucket.period,bucket.periodUnit);
			return Object.assign(bucket, { balance, zeroDate, nextDate });
		}));
}

app.get('/api/buckets', function (req, res) {
	getBuckets()
		.then(buckets => res.json(buckets))
		.catch(e => console.log(e));
});

app.post('/api/buckets', function (req, res) {
	database.bucket.create(Object.assign({
			amount: 0,
			period: 1,
			periodUnit: 'months',
			nextDate: moment().add(1, 'month')
		}, req.body))
		.then(bucket => getBuckets(bucket.id))
		.then(buckets => res.json(buckets[0]))
});

app.get('/api/buckets/export', function (req, res) {
	database.bucket.findAll().then(buckets => {
		res.set({ 'Content-Type': 'text/csv' });

		database.bucket.findAll().then(buckets => {
			csv.stringify(buckets, {
				header: true,
				columns: Object.keys(database.bucket.rawAttributes),
				formatters: { date: function(value) { return moment(value).toISOString(); } }
			}).pipe(res);
		});
	});
});

app.post('/api/buckets/import', function (req, res) {
	req.setEncoding('utf8');

	const csvParser = csv.parse({ columns: true }, (err, imported) => {
		database.bucket.findAll().then(existing => {

			const matchKey = key => (e => {
				const i = imported.filter(i => !i.existing).find(i => i[key] && e[key] == i[key]);
				if(i) i.existing = e;
				return !i;
			});

			existing.filter(matchKey('id')).filter(matchKey('name'));

			return Promise.all(imported.filter(i => i.existing).map(i => i.existing.update(i)))
				.then(() => database.bucket.bulkCreate(imported.filter(i => !i.existing)))
				// TODO: this is only necessary because ids are imported. Importing should not work this way.
				.then(() => database.bucket.max('id'))
				.then(seq => database.query(`ALTER SEQUENCE "bucket_id_seq" RESTART WITH ${seq + 1};`))
				.then(() => err ? Promise.resolve() : getBuckets())
				.then(buckets => {
					const updated = imported.filter(i => i.existing).length;
					console.log('import buckets', 'i' + (imported.length - updated), 'u' + updated);
					return res.status(err ? 400 : 200).json(err || buckets)
				});
		})
	});

	req.pipe(csvParser);
});

function getRules(id) {
	return database.rule.findAll(id !== undefined ? { where: { id } } : undefined)
		.then(dbRules => dbRules.map(dbRule => dbRule.toJSON()))
}

app.get('/api/rules', function (req, res) {
	return getRules()
		.then(rules => res.json(rules))
		.catch(e => console.log(e));
});

app.get('/api/rules/export', function (req, res) {
	database.rule.findAll().then(rules => {
		res.set({ 'Content-Type': 'text/csv' });

		database.rule.findAll().then(rules => {
			csv.stringify(rules, {
				header: true,
				columns: Object.keys(database.rule.rawAttributes),
				formatters: { date: function(value) { return moment(value).toISOString(); } }
			}).pipe(res);
		});
	});
});

app.post('/api/rules/apply', function (req, res) {
	database.applyRules()
		.then(results => res.json(results));
});

app.get('/api/rules/:id', function (req, res) {
	return getRules(req.params.id)
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.post('/api/rules/:id/apply', function (req, res) {
	database.applyRules(req.params.id)
		.then(results => res.json({ ruleId: req.params.id, transactions: results.reduce((n, t) => n + t) }));
});

app.post('/api/rules', function (req, res) {
	database.rule.create(Object.assign({
			account: null,
			search: null
		}, req.body))
		.then(rule => getRules(rule.id))
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.patch('/api/rules/:id', function (req, res) {
	database.rule.findOne({
		where: { id: req.params.id }
	}).then(rule => {
		var newRule = Object.assign({}, rule.dataValues);
		rfc6902.applyPatch(newRule, req.body);
		return database.rule.update(newRule, { where: { id: newRule.id } });
	}).then(() => getRules(req.params.id))
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.delete('/api/rules/:id', function (req, res) {
	database.rule.destroy({
		where: { id: req.params.id }
	}).then(() => res.sendStatus(200))
		.catch(e => console.log(e));
});

app.post('/api/rules/import', function (req, res) {
	req.setEncoding('utf8');

	const csvParser = csv.parse({ columns: true }, (err, imported) => {
		database.rule.destroy({ truncate: true })
			.then(() => database.rule.bulkCreate(imported))
			// TODO: this is only necessary because ids are imported. Importing should not work this way.
			.then(() => database.rule.max('id'))
			.then(seq => database.query(`ALTER SEQUENCE "rule_id_seq" RESTART WITH ${seq + 1};`))
			.then(() => err ? Promise.resolve() : getRules())
			.then(rules => {
				console.log('import rules', 'i' + imported.length);
				return res.status(err ? 400 : 200).json(err || rules)
			});
	});

	req.pipe(csvParser);
});

app.use(authenticator(res => res.redirect('/auth/google')));
app.use(express.static('dist/'));

(process.env.HTTPS === 'true'
	? https.createServer({
			key: fs.readFileSync('./certs/server.key'),
			cert: fs.readFileSync('./certs/server.crt')
		}, app)
	: app).listen(process.env.PORT || 8080)
