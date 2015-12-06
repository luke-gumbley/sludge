var Sequelize = require('sequelize');

var sequelize = new Sequelize('postgres://luke.gumbley:@localhost:5432/luke.gumbley');

var User = sequelize.define('user', {
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
  },
  lastName: {
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

/*
User.sync({force: true}).then(function () {
  // Table created
  return User.create({
    firstName: 'John',
    lastName: 'Hancock'
  });
});
*/

User.findOne().then(function (user) {
    console.log(user.firstName);
});


/*
Combination of date and ordinal unique for the row. Ordinals can change therefore should not be the PK.
Ordinals always start at 0 for the first transaction of the day and increment thereafter.
*/

var Transaction = sequelize.define('transaction', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},

	date: { type: Sequelize.DATE },
	ordinal: { type: Sequelize.INTEGER },
	party: { type: Sequelize.STRING },
	amount: { type: Sequelize.DECIMAL },

	type: { type: Sequelize.STRING },
	particulars: { type: Sequelize.STRING },
	code: { type: Sequelize.STRING },
	reference: { type: Sequelize.STRING },
	subsidiary: { type: Sequelize.STRING }, // e.g. suffix of card, for shared accounts
}, {
	freezeTableName: true
});
