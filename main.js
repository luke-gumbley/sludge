var fs = require('fs');
var csv = require('csv');

var parser = require('./lib/parser');
var database = require('./lib/database');
var api = require('./lib/api');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

database.sync().then(() => {
	// read all supplied statements
	process.argv.map(parser.parse)
		.reduce((acc, val) => acc.concat(val))
		.forEach(format => format.pipe(database.transactions()));

	// read all buckets
	let parser = csv.parse({ columns: true }, (err, buckets) => { database.bucket.bulkCreate(buckets); } );
	fs.createReadStream('data/buckets.csv').pipe(parser);
}).catch(function(err) { console.log(err); });
