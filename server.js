require('dotenv').config();
var fs = require('fs');
var csv = require('csv');

const parser = require('./api/parser');
const database = require('./api/database');
const api = require('./api');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

const options = {
	sync: false
};

options.files = process.argv.slice(2).filter(arg => {
	if(arg === 'sync') {
		options.sync = true;
		return false;
	}

	if(arg.includes('bucket')) {
		options.bucketFile = arg;
		return false;
	}

	return true;
});

const dbOptions = {
	database: process.env.DB_NAME,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOSTNAME,
	port: process.env.DB_PORT,
	sync: options.sync
}

database.connect(dbOptions).then(() => {
	options.files.map(filename => parser.parse(filename))
		.reduce((acc, val) => acc.concat(val), [])
		.filter(format => format.parsable() !== false)
		.forEach(format => format.pipe(database.transactions()));

	if(options.bucketFile) {
		let csvParser = csv.parse({ columns: true }, (err, buckets) => { database.bucket.bulkCreate(buckets); } );
		fs.createReadStream(options.bucketFile).pipe(csvParser);
	}

	if(options.sync) return database.close();
}).catch(function(err) { console.log(err); });

if(!options.sync) api.start();
