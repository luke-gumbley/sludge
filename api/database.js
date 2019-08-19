const Sequelize = require('sequelize');
const { execSync } = require('child_process');

const utils = require('./utils.js');

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
		barrelId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},

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
		barrelId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},

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
		zeroTransactionId: Sequelize.INTEGER,

		budget: Sequelize.STRING
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.transaction, { as: 'zeroTransaction', foreignKey: { allowNull: true }, onDelete: 'SET NULL'});
		this.hasMany(db.transaction, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
	}

}, {
	name: 'transaction',

	definition: {
		barrelId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},

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

		processed: Sequelize.DATE,

		bucketId: Sequelize.INTEGER
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.bucket);
	}
}, {
	name: 'rule',

	definition: {
		barrelId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},

		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		account: Sequelize.STRING,
		search: Sequelize.STRING,

		bucketId: Sequelize.INTEGER
	},

	setup: function(db) {
		this.belongsTo(db.barrel, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
		this.belongsTo(db.bucket, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' });
	}
}];

module.exports = {

	models,

	connect: function({ sync, ...options }) {
		sequelize = new Sequelize(Object.assign({
			dialect: 'postgres',
			logging: false
		}, options));

		models.forEach(model =>
			module.exports[model.name] = sequelize.define(model.name, model.definition, { freezeTableName: true })
		);

		// horrible shit to permit cyclic dependencies.
		return (sync ? sequelize.drop().then(() => sequelize.sync()) : Promise.resolve())
			.then(() => models.forEach(model => { (model.setup || (() => {})).call(module.exports[model.name], module.exports) }) )
			.then(() => sync
				? Object.keys(sequelize.models).reduce((promise, model) => promise.then(() => sequelize.models[model].sync({ alter: true })), Promise.resolve())
				: Promise.resolve()
			);
	},

	close: function() {
		return sequelize.close();
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

	applyRules: function(user, barrelId, id) {
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

				const summary = results.filter(r => r.transactions)
					.sort((a,b) => b.transactions - a.transactions);

				const total = summary.reduce((t,r) => t + r.transactions, 0);
				const output = summary.map(r => `${r.ruleId}:${r.transactions}`).join(' ');

				utils.log({
					user,
					content: `applyRules ${total} ${output}`
				});

				return transactions;
			});
	},

	connectTest: async function() {
		const db = module.exports;
		const data = require('./test_data.js');

		const uri = execSync('pg_tmp', { encoding: 'utf8' });
		console.log(uri);

		await db.connect({
			database: 'test',
			host: '/tmp/ephemeralpg.'.concat(uri.slice(-6)),
			sync: true
		});

		await data.barrel.reduce((promise, b) => promise.then(() => db.barrel.create(b)), Promise.resolve());
		await data.user.reduce((promise, u) => promise.then(() => db.user.create(u)), Promise.resolve());
		await data.bucket.reduce((promise, b) => promise.then(() => db.bucket.create(b)), Promise.resolve());
		await data.transaction.reduce((promise, t) => promise.then(() => db.transaction.create(t)), Promise.resolve());
		await data.rule.reduce((promise, r) => promise.then(() => db.rule.create(r)), Promise.resolve());
	}
};
