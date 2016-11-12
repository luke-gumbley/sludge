var parser = require('./lib/parser');
var database = require('./lib/database');

database.connect('postgres://luke.gumbley:@localhost:5432/luke.gumbley', { });

// read buckets, create DB
Promise.all([
	parser.read('data/buckets.csv',{ columns: true }, function(err, rows) { return rows; }),
	database.sync()
]).then(function(results) {
	// read all supplied transaction files, add buckets to DB
	var buckets = results[0];

	return Promise.all([
		Promise.all(process.argv.filter(parser.knownFormat).map(parser.parse)),
		database.bucket.bulkCreate(buckets)
	]);
}).then(function(results) {
	// add transactions to DB
	var files = results[0];

	return Promise.all(files.map(function(file) { return database.transaction.bulkCreate(file.rows); }));
}).then(function() {
	// read transactions back from DB
	console.log('FROM DB!');
	return database.transaction.findOne().then(function (transaction) {
	    console.log(transaction.dataValues);
	});
}).catch(function(err) { console.log(err); });
