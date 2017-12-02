var express = require('express');
var database = require('./database');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
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

app.get('/bucket', function (req, res) {
	database.bucket.findAll().then(function (buckets) {
		res.json(buckets);
	});
});

app.post('/bucket', function (req, res) {
	database.bucket.create(req.body).then(function(bucket) {
		res.json(bucket);
	});
});

app.listen(8080, function() {});
