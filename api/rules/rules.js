const express = require('express');
const moment = require('moment');
const csv = require('csv');
const rfc6902 = require('rfc6902');

const database = require('../database.js');

const app = module.exports = express();

function getRules(barrelId, id) {
	const query = {
		where: id !== undefined ? { barrelId, id } : { barrelId },
		attributes: { exclude: ['barrelId'] },
		order: ['id']
	};

	return database.rule.findAll(query)
		.then(dbRules => dbRules.map(dbRule => dbRule.toJSON()))
}

app.get('/', function (req, res) {
	return getRules(req.decoded.barrelId)
		.then(rules => res.json(rules))
		.catch(e => console.log(e));
});

app.get('/export', function (req, res) {
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

app.post('/apply', function (req, res) {
	database.applyRules(req.decoded.barrelId)
		.then(results => res.json(results));
});

app.get('/:id', function (req, res) {
	return getRules(req.decoded.barrelId, req.params.id)
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.post('/:id/apply', function (req, res) {
	database.applyRules(req.decoded.barrelId, req.params.id)
		.then(results => res.json({ ruleId: req.params.id, transactions: results.reduce((n, t) => n + t) }));
});

app.post('/', function (req, res) {
	database.rule.create(Object.assign({
			account: null,
			search: null
		}, req.body, { barrelId: req.decoded.barrelId }))
		.then(rule => getRules(req.decoded.barrelId, rule.id))
		.then(rules => res.json(rules[0]))
		.catch(e => console.log(e));
});

app.patch('/:id', function (req, res) {
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

app.delete('/:id', function (req, res) {
	database.rule.destroy({
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	}).then(() => res.sendStatus(200))
		.catch(e => console.log(e));
});

app.post('/import', function (req, res) {
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
