var express = require('express');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var Big = require('big.js');

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

app.post('/statements/:filename', function (req, res) {
	req.setEncoding('utf8');

	parser.testFormat(req.params.filename)
		.then(filename => parser.parse(req.params.filename, req))
		.then(file => database.transaction.bulkCreate(file.rows))
		.then(() => res.sendStatus(200));
});

app.get('/bucket', function (req, res) {
	const {or, eq, gt} = Sequelize.Op;

	database.bucket.findAll({
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
	}).then(function (dbBuckets) {
		let buckets = dbBuckets.map(dbBucket => {
			let { zeroTransaction, transactions, ...bucket } = dbBucket.toJSON();
			let balance = transactions.reduce((balance, transaction) => balance.plus(transaction.amount), new Big(0)).toFixed(2);
			return Object.assign(bucket, { balance });
		});

		res.json(buckets);
	}).catch(e => console.log(e));
});

app.post('/bucket', function (req, res) {
	database.bucket.create(req.body).then(function(bucket) {
		res.json(bucket);
	});
});

app.listen(8080, function() {});
