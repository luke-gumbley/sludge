var parser = require('./lib/parser');
var database = require('./lib/database');
var api = require('./lib/api');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

// read buckets, create DB
Promise.all([
	parser.readFile('data/buckets.csv',{ columns: true }, function(err, rows) { return rows; }),
	database.sync()
]).then(function(results) {
	// read all supplied transaction files, add buckets to DB
	var buckets = results[0];

	return Promise.all([
		// parser.parse no longer returns a promise but a bunch of readable streams that may produce transaction data.
		// TODO: add stream processor to cope with this data (add ordinal, commit or discard, etc)
		Promise.all(process.argv.map(parser.parse)),
		database.bucket.bulkCreate(buckets)
	]);
}).then(function(results) {
	// add transactions to DB
	var files = results[0];

	return Promise.all(files.map(function(file) { return database.transaction.bulkCreate(file.rows); }));
}).catch(function(err) { console.log(err); });
