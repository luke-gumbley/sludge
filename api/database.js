const Sequelize = require('sequelize');
const stream = require('stream');
const moment = require('moment');
const Big = require('big.js');
const { stableSort } = require('./utils');

var sequelize = null;

const models = [{
	name: 'barrel',
	definition: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
	},

}, {
	name: 'user',

	definition: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		name: Sequelize.STRING,

		email: Sequelize.STRING,
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
	},

}, {
	name: 'bucket',

	definition: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		name: Sequelize.STRING,

		amount: Sequelize.DECIMAL,

		period: Sequelize.DECIMAL,
		periodUnit: Sequelize.STRING,

		date: Sequelize.DATE,

		budget: Sequelize.STRING,
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.transaction, { as: 'zeroTransaction' });
		this.hasMany(db.transaction);
	}

}, {
	name: 'transaction',

	definition: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// Combination of date and ordinal unique for the row. Ordinals can change therefore should not be the PK.
		// Ordinals always start at 0 for the first transaction of the day and increment thereafter.
		// When an intra-day transaction is added later, ordinals for every row in the day following are incremented.
		date: Sequelize.DATE,
		ordinal: Sequelize.INTEGER,

		account: Sequelize.STRING,

		party: Sequelize.STRING,

		particulars: Sequelize.STRING,
		code: Sequelize.STRING,
		reference: Sequelize.STRING,

		amount: Sequelize.DECIMAL,

		type: Sequelize.STRING,
		partyAccount: Sequelize.STRING,
		subsidiary: Sequelize.STRING, // e.g. suffix of card, for shared accounts
		serial: Sequelize.STRING,
		txnCode: Sequelize.STRING,
		batch: Sequelize.STRING,
		bank: Sequelize.STRING,

		processed: Sequelize.DATE
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.bucket);
	}
}, {
	name: 'rule',

	definition: {
		barrelId: Sequelize.INTEGER,

		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		account: Sequelize.STRING,
		search: Sequelize.STRING
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.bucket, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' });
	}
}];

const transactionEquals = (() => {
	const definition = models.find(m => m.name === 'transaction').definition;
	const keys = Object.keys(definition)
		.filter(k => !['id', 'ordinal'].includes(k))

	return b => (a => {
		return keys.every(key => {
			return typeof a[key] === 'object' && a[key] !== null && b[key] !== null
				? a[key].valueOf() === b[key].valueOf()
				// less stringent comparison allows null == undefined
				: a[key] == b[key];
		});
	});
})();

// match newly imported transactions with transactions that already exist (naive when it comes to deletions)
function matchTransactions(imported, existing, min, max) {
	existing.reduce((lastMatch, transaction, index) => {
		const match = imported.slice(lastMatch)
			.filter(t => t.date.isSameOrBefore(transaction.date))
			.findIndex(transactionEquals(transaction))

		if(match !== -1)
			imported[lastMatch + match].matchIndex = index;

		transaction.action = match !== -1 ? 'match'
			: min.isSame(transaction.date) ? 'start'
			: max.isSame(transaction.date) ? 'end'
			: 'delete';

		return lastMatch + match + 1;
	}, 0);
}

// insert genuinely new imported transactions at the correct indices
function spliceTransactions(imported, existing) {
	let end = existing.findIndex(t => t.action === 'end');
	if(end === -1) end = existing.length;

	imported.reverse().reduce((index, transaction) => {
		if(transaction.matchIndex === undefined) {
			transaction.action = 'insert';
			existing.splice(index, 0, transaction);
			return index;
		}
		return transaction.matchIndex;
	}, end)
}

// set all transaction ordinals correctly
function orderTransactions(transactions) {
	transactions.reduce((state, transaction, index) => {
		if(!moment(transaction.date).isSame(state.date)) {
			state.offset = index;
			state.date = transaction.date;
		}
		transaction.ordinal = index - state.offset;
		return state;
	}, {});
}

class TransactionImporter extends stream.Writable {
	constructor() {
		super({ objectMode: true });
		this._transactions = [];
	}

	_write(chunk, encoding, callback) {
		this._transactions.push(chunk);
		callback(null);
	}

	_writev(chunks, encoding, callback) {
		this._transactions = this._transactions.concat(chunks.map(c => c.chunk));
		callback(null);
	}

	import() {
		var me = this;
		return new Promise((resolve, reject) => {
			me.on('finish', () => resolve(me._transactions));
		});
	}
}

module.exports = {

	connect: function({ sync }) {
		sequelize = new Sequelize({
			dialect: 'postgres',
			database: process.env.DB_NAME,
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			host: process.env.DB_HOSTNAME,
			port: process.env.DB_PORT,
			operatorsAliases: false,
			logging: false
		});

		models.forEach(model =>
			module.exports[model.name] = sequelize.define(model.name, model.definition, { freezeTableName: true })
		);

		// horrible shit to permit cyclic dependencies.
		return (sync ? sequelize.drop().then(() => sequelize.sync()) : Promise.resolve())
			.then(() => models.forEach(model => { (model.setup || (() => {})).call(module.exports[model.name], module.exports) }) )
			.then(() => sync
				? Object.keys(sequelize.models).reduce((promise, model) => promise.then(() => sequelize.models[model].sync({ force: true })), Promise.resolve())
				: Promise.resolve()
			);
	},

	query: function(sql, options) {
		return sequelize.query(sql, options);
	},

	buildFilter: function(filter) {
		const where = { barrelId: filter.barrelId };
		if(filter.bucketId !== undefined)
			where.bucketId = filter.bucketId;

		if(filter.account)
			where.account = filter.account;

		if(filter.search) {
			const {or, and, iLike} = Sequelize.Op;

			const terms = filter.search.split(' ').map(t => '%' + t + '%');

			where[and] = terms.map(term => ({
				[or]: [
					{ party: { [iLike]: term } },
					{ particulars: { [iLike]: term } },
					{ code: { [iLike]: term } },
					{ reference: { [iLike]: term } }
				]
			}) );
		}
		return where;
	},

	applyRules: function(barrelId, id) {
		const db = module.exports;
		return db.rule.findAll({ where: id !== undefined ? { barrelId, id } : { barrelId } })
			.then(rules => Promise.all(rules.map(rule => {
				const where = db.buildFilter({ barrelId, bucketId: null, account: rule.account, search: rule.search });
				return db.transaction.update({ bucketId: rule.bucketId }, { where })
					.then(result => ({ ruleId: rule.id, transactions: result[0] }));
			})))
			.then(results => {
				const transactions = [];
				results.forEach(result => transactions[result.ruleId] = result.transactions);
				console.log('applyRules ', transactions);
				return transactions;
			});
	},

	importTransactions: function(barrelId) {
		const db = module.exports;
		const importer = new TransactionImporter();

		const promise = importer.import().then(transactions => {
			// either no valid transactions or the upstream Format was not parsable
			if(transactions.length === 0)
				return;

			if(!stableSort(transactions, t => t.date))
				console.log('Imported transactions were not in ascending date order!');

			const min = transactions[0].date;
			const max = transactions.slice(-1)[0].date;

			const {and, lte, gte} = Sequelize.Op;

			const accounts = transactions.map(t => t.account).filter((v, i, a) => a.indexOf(v) === i);

			return Promise.all(accounts.map(account => {
				return db.transaction.findAll({
					where: {
						barrelId,
						account,
						[and] : [ { date: { [gte]: min } }, { date: { [lte]: max } } ]
					},
					order: ['date', 'ordinal']
				}).then(existing => {
					const imported = transactions.filter(t => t.account === account);

					matchTransactions(imported, existing, min, max);
					spliceTransactions(imported, existing);
					orderTransactions(existing.filter(t => t.action !== 'delete'));

					const actions = {
						delete: existing.filter(t => t.action === 'delete'),
						insert: existing.filter(t => t.action === 'insert'),
						update: existing.filter(t => ['start', 'end', 'match'].includes(t.action))
					};

					actions.insert.forEach(t => t.barrelId = barrelId);

					console.log('import', account, 'd' + actions.delete.length, 'i' + actions.insert.length, 'u' + actions.update.length);

					// delete existing transactions with no match in the import
					return (actions.delete.length
							? db.transaction.destroy({where: { barrelId, id: actions.delete.map(t => t.id) }})
							: Promise.resolve())
						// update ordinals in the DB
						.then(() => Promise.all(actions.update.map(t => t.update({ ordinal: t.ordinal }))))
						// insert new transactions
						.then(() => db.transaction.bulkCreate(actions.insert))
				});
			}));
		});

		return { importer, promise };
	},

	getBuckets: function(barrelId, id) {
		const db = module.exports;
		const {or, eq, gt} = Sequelize.Op;

		let query = {
			where: id !== undefined ? { id, barrelId } : { barrelId },
			attributes: { exclude: ['barrelId'] },
			include: [{
				model: db.transaction,
				as: 'zeroTransaction',
				attributes: ['date', 'ordinal']
			}, {
				model: db.transaction,
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

		query['where'] = id !== undefined ? { id } : undefined;

		return db.bucket.findAll(query)
			.then(dbBuckets => dbBuckets.map(dbBucket => {
				const { zeroTransaction, transactions, ...bucket } = dbBucket.toJSON();
				const balance = transactions.reduce((balance, transaction) => balance.plus(transaction.amount), new Big(0)).toFixed(2);

				const zeroDate = zeroTransaction
					? zeroTransaction.date
					: moment(bucket.date).subtract(bucket.period,bucket.periodUnit);
				return Object.assign(bucket, { balance, zeroDate });
			}));
	},

	getRules: function(barrelId, id) {
		const db = module.exports;

		const query = {
			where: id !== undefined ? { barrelId, id } : { barrelId },
			attributes: { exclude: ['barrelId'] }
		};

		return db.rule.findAll(query)
			.then(dbRules => dbRules.map(dbRule => dbRule.toJSON()))
	}
};
