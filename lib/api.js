var https = require('https');
var fs = require('fs');
var express = require('express');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var Big = require('big.js');
var moment = require('Moment');

var parser = require('./parser');
var database = require('./database');

var app = express();

app.use(express.static('.'));
app.use(bodyParser.json({ type: ['application/json', 'application/json-patch+json'] }));

app.get('/transaction', function (req, res) {
	database.transaction.findAll({ order: ['id'] }).then(function (transactions) {
		res.json(transactions);
	});
});

app.get('/transaction/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		res.json(transaction.dataValues);
	});
});

app.patch('/transaction/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		var newTransaction = Object.assign({}, transaction.dataValues);
		rfc6902.applyPatch(newTransaction, req.body);
		database.transaction.update(newTransaction, { where: { id: newTransaction.id } });
		res.json(newTransaction);
	});
});

app.patch('/bucket/:id', function (req, res) {
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

app.post('/statements/:filename', function (req, res) {
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

app.get('/bucket', function (req, res) {
	getBuckets()
		.then(buckets => res.json(buckets))
		.catch(e => console.log(e));
});

app.post('/bucket', function (req, res) {
	database.bucket.create(req.body)
		.then(bucket => getBuckets(bucket.id))
		.then(buckets => res.json(buckets[0]))
});

https.createServer({
	key: fs.readFileSync('./certs/server.key'),
	cert: fs.readFileSync('./certs/server.crt')
}, app).listen(8443);
