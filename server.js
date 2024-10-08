import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import * as csv from 'csv';

import parser from './api/parser.js';
import database from './api/database.js';
import api from './api/index.js';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

const options = {
	sync: false,
	test: false
};

options.files = process.argv.slice(2).filter(arg => {
	// connect to ephemeral DB
	if(arg == 'temp') {
		options.temp = true;
		return false;
	}

	// synchronise schema (always done for 'temp')
	if(arg === 'sync') {
		options.sync = true;
		return false;
	}

	// create test data
	if(arg === 'test') {
		options.test = true;
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
};

(options.temp ? database.connectTemp() : database.connect(dbOptions))
	.then(() => (options.test ? database.testData() : Promise.resolve()))
	.then(() => {
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

if(!options.sync) api.start(process.env.HTTPS === 'true', process.env.PORT);
