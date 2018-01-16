var https = require('https');
var fs = require('fs');
var express = require('express');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var Big = require('big.js');
var moment = require('Moment');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
		callbackURL: 'https://localhost:8443/auth/google'
	},
	(token, refresh, profile, done) => done(null, { profile, token })
));

app.use((req, res, next) => {
	console.log(req.url);
	next();
});

app.use(passport.initialize());
app.use(bodyParser.json({ type: ['application/json', 'application/json-patch+json'] }));
app.use(cookieParser());

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'], session: false }), (req, res, next) => {
	const xsrfToken = crypto.randomBytes(33).toString('base64');

	const payload = {
		email: req.user.profile.emails.filter(e => e.type === 'account')[0].value,
		xsrfToken
	};

	const token = jwt.sign(payload, secrets.jwtSecret, { expiresIn: '24h' });

	res.cookie('xsrf-token', xsrfToken, {
		secure: true,
		maxAge: 24 * 60 * 60 * 1000,
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
	})

	res.cookie('access-token',token, {
		httpOnly: true,
		secure: true,
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

app.get('/api/transaction', function (req, res) {
	database.transaction.findAll({ order: ['id'] }).then(function (transactions) {
		res.json(transactions);
	});
});

app.get('/api/transaction/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		res.json(transaction.dataValues);
	});
});

app.patch('/api/transaction/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		var newTransaction = Object.assign({}, transaction.dataValues);
		rfc6902.applyPatch(newTransaction, req.body);
		database.transaction.update(newTransaction, { where: { id: newTransaction.id } });
		res.json(newTransaction);
	});
});

app.patch('/api/bucket/:id', function (req, res) {
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

app.post('/api/statements/:filename', function (req, res) {
	req.setEncoding('utf8');

	var formats = parser.parse(req.params.filename, req);

	Promise.all(formats.map(format => format.parse())).then(results => {
		res.sendStatus(results.filter(r => r).length === 1 ? 200 : 400);
	})

	formats.forEach(format => format.pipe(database.transactions()));
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

	query['where'] = id !== undefined ? { id: id } : undefined;

	return database.bucket.findAll(query)
		.then(dbBuckets => dbBuckets.map(dbBucket => {
			let { zeroTransaction, transactions, ...bucket } = dbBucket.toJSON();
			let balance = transactions.reduce((balance, transaction) => balance.plus(transaction.amount), new Big(0)).toFixed(2);
			let zeroDate = zeroTransaction
				? zeroTransaction.date
				: moment(bucket.nextDate).subtract(bucket.periodDays,'days').subtract(bucket.periodMonths,'months');
			return Object.assign(bucket, { balance, zeroDate });
		}));
}

app.get('/api/bucket', function (req, res) {
	getBuckets()
		.then(buckets => res.json(buckets))
		.catch(e => console.log(e));
});

app.post('/api/bucket', function (req, res) {
	database.bucket.create(Object.assign({
			amount: 0,
			periodDays: 0,
			periodMonths: 1,
			nextDate: moment().add(1, 'month')
		}, req.body))
		.then(bucket => getBuckets(bucket.id))
		.then(buckets => res.json(buckets[0]))
});

app.use(authenticator(res => res.redirect('/auth/google')));
app.use(express.static('dist/'));

https.createServer({
	key: fs.readFileSync('./certs/server.key'),
	cert: fs.readFileSync('./certs/server.crt')
}, app).listen(8443);
