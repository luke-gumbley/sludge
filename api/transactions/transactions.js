import express from 'express';
import rfc6902 from 'rfc6902';
import { importTransactions } from './import.js';
import parser from '../parser.js';
import database from '../database.js';

const app = express();
export default app;

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

app.post('/import/:filename', async function (req, res) {
	req.setEncoding('utf8');

	// commence parsing the supplied file
	let formats = parser.parse(req.params.filename, req);

	// format.parse returns a promise which is satisfied when the format has finished parsing the stream
	const parsed = Promise.all(formats.map(format => format.parse()));

	// connect all format parsers to an importer
	await Promise.all(formats.map(format => {
		const { importer, promise } = importTransactions(req.decoded.email, req.decoded.barrelId, format._name);
		format.pipe(importer);
		return promise;
	}));

	await database.applyRules(req.decoded.email, req.decoded.barrelId); // apply auto-categorisation rules

	const results = await parsed;

	res.status(results.filter(r => r.parsable).length === 1 ? 200 : 422);

	return res.send(results.filter(r => r.parsable || r.failure));
});
