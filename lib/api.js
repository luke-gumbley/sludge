const https = require('https');
const fs = require('fs');
const express = require('express');
const rfc6902 = require('rfc6902');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const Big = require('big.js');
const moment = require('moment');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const csv = require('csv');

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const HttpsProxyAgent = require('https-proxy-agent');

const parser = require('./parser');
const database = require('./database');
const secrets = require('./secrets');

const app = express();

passport.serializeUser((user, done) => done(null, user) );
passport.deserializeUser((user, done) => done(null, user) );

const strategy = new GoogleStrategy({
		clientID: secrets.googleAPIClientId,
		clientSecret: secrets.googleAPIClientSecret,
		callbackURL: process.env.HOSTNAME + '/auth/google'
	},
	(token, refresh, profile, done) => done(null, { profile, token })
);

if (process.env['https_proxy']) {
	const httpsProxyAgent = new HttpsProxyAgent(process.env['https_proxy']);
	strategy._oauth2.setAgent(httpsProxyAgent);
}

passport.use(strategy);

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

	database.user.findOne({ where: { email }})
		.then(user => {
			if(!user) {
				return res.status(401)
					.set({ 'WWW-Authenticate': 'Bearer realm="Sludge tool"' })
					.sendFile(require.resolve('../app/401.html'));
			}

			const payload = { email, barrelId: user.barrelId, xsrfToken };
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

	const query = {
		order: [['date', 'DESC'], ['ordinal', 'DESC'], 'account'],
		offset,
		limit,
		attributes: { exclude: ['barrelId'] },
		where: database.buildFilter({
			barrelId: req.decoded.barrelId,
			bucketId: req.query.bucketId ? JSON.parse(req.query.bucketId) : undefined,
			account: req.query.account,
			search: req.query.search
		})
	};

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
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	}).then(function (t) {
		const { barrelId, ...transaction} = t.dataValues;
		res.json(transaction);
	});
});

app.patch('/api/transactions/:id', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	};
	database.transaction.findOne(query).then(function (transaction) {
		var newTransaction = Object.assign({}, transaction.dataValues);
		rfc6902.applyPatch(newTransaction, req.body);
		delete newTransaction.barrelId;
		delete newTransaction.id;
		database.transaction.update(newTransaction, query);
		res.json(Object.assign(newTransaction, { id: req.params.id }));
	});
});

app.patch('/api/buckets/:id', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	};
	database.bucket.findOne(query).then(bucket => {
		var newBucket = Object.assign({}, bucket.dataValues);
		rfc6902.applyPatch(newBucket, req.body);
		delete newBucket.barrelId;
		delete newBucket.id;
		return database.bucket.update(newBucket, query);
	}).then(() => getBuckets(req.decoded.barrelId, req.params.id))
		.then(buckets => res.json(buckets[0]))
		.catch(e => console.log(e));
});

app.delete('/api/buckets/:id', function (req, res) {
	database.bucket.destroy({
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
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
		const { importer, promise } = database.importTransactions(req.decoded.barrelId);
		format.pipe(importer);
		return promise;
	}))
		.then(() => database.applyRules(req.decoded.barrelId)) // apply auto-categorisation rules
		.then(() => res.sendStatus(status));
});

function getBuckets(barrelId, id) {
	const {or, eq, gt} = Sequelize.Op;

	let query = {
		where: id !== undefined ? { id, barrelId } : { barrelId },
		attributes: { exclude: ['barrelId'] },
		include: [{
			model: database.transaction,
			as: 'zeroTransaction',
			attributes: ['date', 'ordinal']
		}, {
			model: database.transaction,
			as: 'transactions',
			attributes: ['amount'],
			required: false,
			where: { [or] : [
				{ '$bucket.zeroTransactionId$': { [eq]: null } },
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

			const zeroDate = zeroTransaction
				? zeroTransaction.date
				: moment(bucket.date).subtract(bucket.period,bucket.periodUnit);
			return Object.assign(bucket, { balance, zeroDate });
		}));
}

app.get('/api/buckets', function (req, res) {
	getBuckets(req.decoded.barrelId)
		.then(buckets => res.json(buckets))
		.catch(e => console.log(e));
});

app.post('/api/buckets', function (req, res) {
	database.bucket.create(Object.assign({
			amount: 0,
			period: 0,
			periodUnit: 'months',
			date: moment().add(1, 'month')
		}, req.body, { barrelId: req.decoded.barrelId }))
		.then(bucket => getBuckets(req.decoded.barrelId, bucket.id))
		.then(buckets => res.json(buckets[0]))
});

app.get('/api/buckets/export', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId },
		attributes: { exclude: ['barrelId'] }
	};

	database.bucket.findAll(query).then(buckets => {
		res.set({ 'Content-Type': 'text/csv' });
		csv.stringify(buckets, {
			header: true,
			columns: Object.keys(database.bucket.rawAttributes),
			formatters: { date: function(value) { return moment(value).toISOString(); } }
		}).pipe(res);
	});
});

app.post('/api/buckets/import', function (req, res) {
	req.setEncoding('utf8');

	const csvParser = csv.parse({ columns: true }, (err, imported) => {
		imported.forEach(t => t.barrelId = req.decoded.barrelId);

		database.bucket.findAll({ where: { barrelId: req.decoded.barrelId }}).then(existing => {

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
				.then(() => err ? Promise.resolve() : getBuckets(req.decoded.barrelId))
				.then(buckets => {
					const updated = imported.filter(i => i.existing).length;
					console.log('import buckets', 'i' + (imported.length - updated), 'u' + updated);
					return res.status(err ? 400 : 200).json(err || buckets)
				});
		})
	});

	req.pipe(csvParser);
});

function getRules(barrelId, id) {
	const query = {
		where: id !== undefined ? { barrelId, id } : { barrelId },
		attributes: { exclude: ['barrelId'] }
	};
	return database.rule.findAll(query)
		.then(dbRules => dbRules.map(dbRule => dbRule.toJSON()))
}

app.get('/api/rules', function (req, res) {
	return getRules(req.decoded.barrelId)
		.then(rules => res.json(rules))
		.catch(e => console.log(e));
});

app.get('/api/rules/export', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId },
		attributes: { excluded: ['barrelId'] }
	};

	database.rule.findAll(query).then(rules => {
		res.set({ 'Content-Type': 'text/csv' });

		csv.stringify(rules, {
			header: true,
			columns: Object.keys(database.rule.rawAttributes),
			formatters: { date: function(value) { return moment(value).toISOString(); } }
		}).pipe(res);
	});
});

app.post('/api/rules/apply', function (req, res) {
	database.applyRules(req.decoded.barrelId)
		.then(results => res.json(results));
});

app.get('/api/rules/:id', function (req, res) {
	return getRules(req.decoded.barrelId, req.params.id)
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.post('/api/rules/:id/apply', function (req, res) {
	database.applyRules(req.decoded.barrelId, req.params.id)
		.then(results => res.json({ ruleId: req.params.id, transactions: results.reduce((n, t) => n + t) }));
});

app.post('/api/rules', function (req, res) {
	database.rule.create(Object.assign({
			account: null,
			search: null
		}, req.body, { barrelId: req.decoded.barrelId }))
		.then(rule => getRules(req.decoded.barrelId, rule.id))
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.patch('/api/rules/:id', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	};
	database.rule.findOne(query).then(rule => {
		var newRule = Object.assign({}, rule.dataValues);
		rfc6902.applyPatch(newRule, req.body);
		delete newRule.barrelId;
		delete newRule.id;
		return database.rule.update(newRule, query);
	}).then(() => getRules(req.params.id))
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.delete('/api/rules/:id', function (req, res) {
	database.rule.destroy({
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	}).then(() => res.sendStatus(200))
		.catch(e => console.log(e));
});

app.post('/api/rules/import', function (req, res) {
	req.setEncoding('utf8');

	const csvParser = csv.parse({ columns: true }, (err, imported) => {
		imported.forEach(rule => rule.barrelId = req.decoded.barrelId);

		database.rule.destroy({ where: { barrelId: req.decoded.barrelId } })
			.then(() => database.rule.bulkCreate(imported))
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
