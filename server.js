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

database.connect({ sync: options.sync }).then(() => {
	if(options.sync) {
		process.exit();
		return;
	}

	options.files.map(filename => parser.parse(filename))
		.reduce((acc, val) => acc.concat(val), [])
		.filter(format => format.parsable() !== false)
		.forEach(format => format.pipe(database.transactions()));

	if(options.bucketFile) {
		let csvParser = csv.parse({ columns: true }, (err, buckets) => { database.bucket.bulkCreate(buckets); } );
		fs.createReadStream(options.bucketFile).pipe(csvParser);
	}
}).catch(function(err) { console.log(err); });
