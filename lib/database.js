var Sequelize = require('sequelize');

var sequelize = null;

var models = {
	user: {
	  firstName: {
	    type: Sequelize.STRING,
	    field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
	  },
	  lastName: {
	    type: Sequelize.STRING
	  }
	},

	transaction: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// Combination of date and ordinal unique for the row. Ordinals can change therefore should not be the PK.
		// Ordinals always start at 0 for the first transaction of the day and increment thereafter.
		date: { type: Sequelize.DATE },
		ordinal: { type: Sequelize.INTEGER },

		party: { type: Sequelize.STRING },
		amount: { type: Sequelize.DECIMAL },

		type: { type: Sequelize.STRING },
		particulars: { type: Sequelize.STRING },
		code: { type: Sequelize.STRING },
		reference: { type: Sequelize.STRING },
		subsidiary: { type: Sequelize.STRING }, // e.g. suffix of card, for shared accounts

		setup: function(db) {
			this.belongsTo(db.bucket);
		}
	},

	bucket: {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		name: { type: Sequelize.STRING },

		amount: { type: Sequelize.DECIMAL },

		periodDays: { type: Sequelize.INTEGER },
		periodMonths: { type: Sequelize.INTEGER },

		zeroDate: { type: Sequelize.DATE }
	}
};

module.exports = {
	connect: function(uri, options) {
		sequelize = new Sequelize(uri, options);

		var model;
		for(model in models) {
			var setup = models[model].setup;
			delete models[model].setup;

			this[model] = sequelize.define(model, models[model], { freezeTableName: true });

			this[model].setup = setup;
		}

		for(model in models) {
			if(this[model].setup) this[model].setup.call(this[model], this);
		}

		return sequelize;
	},

	sync: function() {
		var allModels = [];
		for(var model in sequelize.models) {
			if(sequelize.models.hasOwnProperty(model))
				allModels.push(sequelize.models[model]);
		}

		return Promise.all(allModels.map(function(model) {
			return model.sync({force: true});
		}));
	}
};
