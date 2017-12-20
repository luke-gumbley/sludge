var Sequelize = require('sequelize');

var sequelize = null;

function connect(uri, options) {
	sequelize = new Sequelize(uri, options);

	models.forEach(function(model, i) {
		module.exports[model.name] = sequelize.define(model.name, model.definition, { freezeTableName: true });
		module.exports[model.name].ordinal = i;
	});

	models.forEach(function(model) {
		if(model.setup) model.setup.call(module.exports[model.name], module.exports);
	});

	return sequelize;
}

var models = [{
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

module.exports = {

	connect: connect,

	sync: function() {
		var models = [];
		for(var model in sequelize.models) {
			if(sequelize.models.hasOwnProperty(model))
				models[sequelize.models[model].ordinal] = sequelize.models[model];
		}

		return models.reduce(function(promise, model) { return promise.then(function() {
			console.log(model.name);
			return model.sync({ force: true });
		}); }, Promise.resolve());
	}
};

connect('postgres://luke:@localhost:5432/luke', { operatorsAliases: false });
