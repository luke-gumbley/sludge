var parser = require('./lib/parser');
var database = require('./lib/database');

database.connect('postgres://luke.gumbley:@localhost:5432/luke.gumbley', { });

// read all supplied files, create DB
Promise.all([
	Promise.all(process.argv.filter(parser.knownFormat).map(parser.read)),
	database.sync()
]).then(function(results) {
	// add transactions to DB
	var files = results[0];
	return Promise.all(files.map(function(file) {
		return database.transaction.create(file.rows[0]);
	}));
}).then(function() {
	// read transactions back from DB
	console.log('FROM DB!');
	return database.transaction.findOne().then(function (transaction) {
	    console.log(transaction.dataValues);
	});
}).catch(function(err) { console.log(err); });
