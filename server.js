require('dotenv').config();
var fs = require('fs');
var csv = require('csv');

const parser = require('./lib/parser');
const database = require('./lib/database');
const api = require('./lib/api');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

database.connect();
/*
database.connect().then(() => {
	// read all supplied statements
	process.argv.slice(1).map(filename => parser.parse(filename))
		.reduce((acc, val) => acc.concat(val))
		.filter(format => format.parsable() !== false)
		.forEach(format => format.pipe(database.transactions()));

	// read all buckets
	let csvParser = csv.parse({ columns: true }, (err, buckets) => { database.bucket.bulkCreate(buckets); } );
	fs.createReadStream('data/buckets.csv').pipe(csvParser);
}).catch(function(err) { console.log(err); });
*/
