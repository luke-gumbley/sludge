const Sequelize = require('sequelize');
const stream = require('stream');
const moment = require('moment');
const { stableSort } = require('../utils');
const database = require('../database');

const transactionEquals = (() => {
	const definition = database.models.find(m => m.name === 'transaction').definition;
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
	importTransactions: function(barrelId) {
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
				return database.transaction.findAll({
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

					if(process.env.NODE_ENV!='test')
						console.log('import', account, 'd' + actions.delete.length, 'i' + actions.insert.length, 'u' + actions.update.length);

					// delete existing transactions with no match in the import
					return (actions.delete.length
							? database.transaction.destroy({where: { barrelId, id: actions.delete.map(t => t.id) }})
							: Promise.resolve())
						// update ordinals in the DB
						.then(() => Promise.all(actions.update.map(t => t.update({ ordinal: t.ordinal }))))
						// insert new transactions
						.then(() => database.transaction.bulkCreate(actions.insert))
				});
			}));
		});

		return { importer, promise };
	},
}
