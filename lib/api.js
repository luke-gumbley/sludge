var express = require('express');
var database = require('./database');
var rfc6902 = require('rfc6902');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static('.'))

/* not needed now static files are also hosted via express
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	next();
});
*/

app.use(bodyParser.json());

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

app.patch('/transaction/:id', function (req, res) {
	database.transaction.findOne({
		where: { id: req.params.id }
	}).then(function (transaction) {
		var newTransaction = Object.assign({}, transaction.dataValues);
		rfc6902.applyPatch(newTransaction, req.body);
		res.json(newTransaction);
	});
});

app.get('/bucket', function (req, res) {
	database.bucket.findAll().then(function (buckets) {
		res.json(buckets);
	});
});

app.listen(8080, function() {});
