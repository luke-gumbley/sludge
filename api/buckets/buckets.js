const express = require('express');
const Sequelize = require('sequelize');
const moment = require('moment');
const csv = require('csv');

const database = require('../database.js');

const app = module.exports = express();

app.patch('/:id', function (req, res) {
	const query = {
		where: { barrelId: req.decoded.barrelId, id: req.params.id }
	};
	database.bucket.findOne(query).then(bucket => {
		var newBucket = Object.assign({}, bucket.dataValues);
		rfc6902.applyPatch(newBucket, req.body);
		delete newBucket.barrelId;
		delete newBucket.id;
		return database.bucket.update(newBucket, query);
	}).then(() => database.getBuckets(req.decoded.barrelId, req.params.id))
		.then(buckets => res.json(buckets[0]))
		.catch(e => console.log(e));
});

app.delete('/:id', function (req, res) {
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

app.get('/', function (req, res) {
	database.getBuckets(req.decoded.barrelId)
		.then(buckets => res.json(buckets))
		.catch(e => console.log(e));
});

app.post('/', function (req, res) {
	database.bucket.create(Object.assign({
			amount: 0,
			period: 0,
			periodUnit: 'months',
			date: moment().add(1, 'month')
		}, req.body, { barrelId: req.decoded.barrelId }))
		.then(bucket => database.getBuckets(req.decoded.barrelId, bucket.id))
		.then(buckets => res.json(buckets[0]))
});

app.get('/export', function (req, res) {
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

app.post('/import', function (req, res) {
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
				.then(() => err ? Promise.resolve() : database.getBuckets(req.decoded.barrelId))
				.then(buckets => {
					const updated = imported.filter(i => i.existing).length;
					console.log('import buckets', 'i' + (imported.length - updated), 'u' + updated);
					return res.status(err ? 400 : 200).json(err || buckets)
				});
		})
	});

	req.pipe(csvParser);
});
