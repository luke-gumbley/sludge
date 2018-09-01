const express = require('express');
const Sequelize = require('sequelize');
const moment = require('moment');
const csv = require('csv');
const Big = require('big.js');
const rfc6902 = require('rfc6902');

const database = require('../database.js');

const app = module.exports = express();

function getBuckets(barrelId, id) {
	const {or, eq, gt} = Sequelize.Op;

	let query = {
		where: id !== undefined ? { id, barrelId } : { barrelId },
		attributes: { exclude: ['barrelId'] },
		include: [{
			model: database.transaction,
			as: 'zeroTransaction',
			attributes: ['date', 'ordinal']
		}, {
			model: database.transaction,
			as: 'transactions',
			attributes: ['amount'],
			required: false,
			where: { [or] : [
				{ '$bucket.zeroTransactionId$': { [eq]: null } },
				{ date: { [gt]: Sequelize.col('zeroTransaction.date') } },
				{ date: { [eq]: Sequelize.col('zeroTransaction.date') }, ordinal: { [gt]: Sequelize.col('zeroTransaction.ordinal') } }
			]}
		}]
	};

	return database.bucket.findAll(query)
		.then(dbBuckets => dbBuckets.map(dbBucket => {
			const { zeroTransaction, transactions, ...bucket } = dbBucket.toJSON();
			const balance = transactions.reduce((balance, transaction) => balance.plus(transaction.amount), new Big(0)).toFixed(2);

			const zeroDate = zeroTransaction
				? zeroTransaction.date
				: moment(bucket.date).subtract(bucket.period,bucket.periodUnit);
			return Object.assign(bucket, { balance, zeroDate });
		}));
}

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
	}).then(() => getBuckets(req.decoded.barrelId, req.params.id))
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
	getBuckets(req.decoded.barrelId)
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
		.then(bucket => getBuckets(req.decoded.barrelId, bucket.id))
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
				.then(() => err ? Promise.resolve() : getBuckets(req.decoded.barrelId))
				.then(buckets => {
					const updated = imported.filter(i => i.existing).length;
					console.log('import buckets', 'i' + (imported.length - updated), 'u' + updated);
					return res.status(err ? 400 : 200).json(err || buckets)
				});
		})
	});

	req.pipe(csvParser);
});
