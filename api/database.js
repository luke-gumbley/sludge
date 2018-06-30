const Sequelize = require('sequelize');

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

module.exports = {

	models,

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
};
