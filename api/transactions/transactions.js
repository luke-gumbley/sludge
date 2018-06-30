const express = require('express');
const parser = require('../parser.js');
const database = require('../database.js');

const app = module.exports = express();

app.get('/', function (req, res) {
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

app.get('/:id', function (req, res) {
	database.transaction.findOne({
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	}).then(function (t) {
		const { barrelId, ...transaction} = t.dataValues;
		res.json(transaction);
	});
});

app.patch('/:id', function (req, res) {
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

app.post('/import/:filename', function (req, res) {
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
