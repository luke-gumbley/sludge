const Sequelize = require('sequelize');
const stream = require('stream');
const parser = require('./parser')

var sequelize = null;

const models = [{
	name: 'user',

	definition: {
	  firstName: {
	    type: Sequelize.STRING,
	    field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
	  },
	  lastName: {
	    type: Sequelize.STRING
	  }
	}
}, {
	name: 'bucket',

	definition: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		name: { type: Sequelize.STRING },

		amount: { type: Sequelize.DECIMAL },

		periodDays: { type: Sequelize.INTEGER },
		periodMonths: { type: Sequelize.INTEGER },
		nextDate: { type: Sequelize.DATE },
	},

	setup: function(db) {
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
		date: {type: Sequelize.DATE},
		ordinal: {type: Sequelize.INTEGER},

		account: {type: Sequelize.STRING},

		party: {type: Sequelize.STRING},

		particulars: {type: Sequelize.STRING},
		code: {type: Sequelize.STRING},
		reference: {type: Sequelize.STRING},

		amount: {type: Sequelize.DECIMAL},

		type: {type: Sequelize.STRING},
		partyAccount: {type: Sequelize.STRING},
		subsidiary: {type: Sequelize.STRING}, // e.g. suffix of card, for shared accounts
		serial: {type: Sequelize.STRING},
		txnCode: {type: Sequelize.STRING},
		batch: {type: Sequelize.STRING},
		bank: {type: Sequelize.STRING},

		processed: {type: Sequelize.DATE}
	},

	setup: function(db) {
		this.belongsTo(db.bucket);
	}
}];

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

	connect: function() {
		sequelize = new Sequelize({
			dialect: 'postgres',
			database: process.env.DB_NAME,
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			host: process.env.DB_HOSTNAME,
			port: process.env.DB_PORT,
			operatorsAliases: false
		});
		const sync = false;

		models.forEach(model =>
			module.exports[model.name] = sequelize.define(model.name, model.definition, { freezeTableName: true })
		);

		// horrible shit to permit cyclic dependencies. Need to move to separate DB script for creation and burn this with fire.
		return (sync ? sequelize.drop().then(() => sequelize.sync()) : Promise.resolve())
			.then(() => models.forEach(model => { (model.setup || (() => {})).call(module.exports[model.name], module.exports) }) )
			.then(() => sync
				? Object.keys(sequelize.models).reduce((promise, model) => promise.then(() => sequelize.models[model].sync({ force: true })), Promise.resolve())
				: Promise.resolve()
			);
	},

	transactions: function() {
		let importer = new TransactionImporter();

		importer.import().then(transactions => {
			// TODO: more sophisticated import.
			module.exports.transaction.bulkCreate(transactions);
		});

		return importer;
	}
};
