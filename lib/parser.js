var fs = require('fs');
const path = require('path');
var csv = require('csv');
var moment = require('moment');
const stream = require('stream');

class Format extends stream.Transform {
	constructor(options) {
		super({ objectMode: true });

		this._name = options.name;
		this._filename = options.filename;
		this._index = 0;
		this._parsable = options.regex && !options.regex.test(options.filename) ? false : null;
		this._data = (options.regex && options.data && this.parsable()) ? options.data(options.regex.exec(this._filename)) : {};
		this._columns = options.columns;
		this._map = options.map;
		this._header = options.header;
	}

	parsable(parsable) {
		if(parsable === true || parsable === false)
			this._parsable = parsable;
		return this._parsable !== false;
	}

	_row(row, index) {
		// optionally overridden in subclasses; returns object with data gathered from the row
		return this._header && index === 0 ? undefined : row;
	}

	_transform(row, encoding, callback) {
		let index = this._index++;

		if(this._columns) {
			// check parsed row against column definition (not parsable if mismatched)
			this.parsable((row.length === this._columns.length) && (index !== 0 || !this._header || row.join(',') === this._columns.join(',')));

		}

		if(this.parsable() && (index !==0 || !this._header)) {

			// convert row array to object with named properties
			if(this._columns) {
				const obj = {};
				this._columns.forEach((c, i) => obj[c] = row[i]);
				row = obj;
			}

			// convert (non-header) row elements based on provided maps (if any)
			if(this._map)
				row = this._map(row);

			// add default properties
			row = Object.assign({}, this._data, row);

			this.push(row);
		}

		// abandon errors for flow control in favour of just ending the stream
		callback(null, this.parsable() ? undefined : null);
    }

	parse() {
		var me = this;
		return new Promise((resolve, reject) => {
			me.on('end', () => resolve(me.parsable()));
		});
	}
}

var formatDefinitions = [{
	name: 'bnz_acct',
	regex: /([^-]+)-(\d{1,2}[A-Z]{3}\d{4})-to-(\d{1,2}[A-Z]{3}\d{4}).csv/,
	data: match => ({ start: moment(match[2],'DMMMYYYY'), end: moment(match[3],'DMMMYYYY') }),
	header: true,
	columns: ['Date','Amount','Payee','Particulars','Code','Reference','Tran Type','This Party Account','Other Party Account','Serial','Transaction Code','Batch Number','Originating Bank/Branch','Processed Date'],
	map: r => ({
		date: moment(r.Date, 'DD/MM/YYYY'),
		amount: r.Amount,
		party: r.Payee,
		particulars: r.Particulars,
		code: r.Code,
		reference: r.Reference,
		type: r['Tran Type'],
		account: r['This Party Account'],
		partyAccount: r['Other Party Account'],
		serial: r.Serial,
		txnCode: r['Transaction Code'],
		batch: r['Batch Number'],
		bank: r['Originating Bank/Branch'],
		processed: moment(r['Processed Date'], 'DD/MM/YYYY'),
	})
}, {
	name: 'bnz_credit',
	regex: /([^-]+)-(\d{1,2}[A-Z]{3}\d{4})-to-(\d{1,2}[A-Z]{3}\d{4}).csv/,
	data: match => ({ account: match[1], start: moment(match[2],'DMMMYYYY'), end: moment(match[3],'DMMMYYYY') }),
	header: true,
	columns: ['Date','Amount','Payee','Particulars','Code','Reference','Tran Type','Processed Date'],
	map: r => ({
		date: moment(r.Date, 'DD/MM/YYYY'),
		amount: r.Amount,
		party: r.Payee,
		particulars: r.Particulars,
		code: r.Code,
		reference: r.Reference,
		type: r['Tran Type'],
		processed: moment(r['Processed Date'], 'DD/MM/YYYY'),
	})
}, {
	name: 'kb_credit',
	regex: /(\d{4}-\d{2}-{2}--{4}-\d{4})_(\d{2}[A-Z][a-z]{2}).CSV/,
	data: match => ({ account: match[1], statement_date: moment(match[2],'DDMMM') }),
	header: true,
	map: r => ({
		date: moment(r[0], 'DD-MM-YYYY'),
		party: r[1],
		card: r[2],
		amount: r[3]
	})
},{
	name: 'anz_acct',
	regex: /(\d{2}-\d{4}-\d{7}-\d{2})_Transactions_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2}).csv/,
	data: match => ({ account: match[1], start: moment(match[2]), end: moment(match[3]) }),
	columns: ['type','party','particulars','code','reference','amount','date','unknown'],
	map: r => Object.assign({}, r, {
		date: moment(r.date, 'DD/MM/YYYY')
	})
}];

module.exports = {
	parse: function(filename, stream) {
		var formats = formatDefinitions
			.map(def => new Format({ filename: path.basename(filename), ...def }))
			.filter(format => format.parsable());

		stream = (stream || fs.createReadStream(filename)).pipe(csv.parse());

		formats.forEach(format => {
			format.on('error', () => {});
			stream.pipe(format);
		});

		return formats;
	}
};
