var express = require('express');
var database = require('./database');
var app = express();

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});

app.get('/transaction', function (req, res) {
	database.transaction.findAll().then(function (transactions) {
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

app.get('/bucket', function (req, res) {
	database.bucket.findAll().then(function (buckets) {
		res.json(buckets);
	});
});

app.listen(3000, function() {});
