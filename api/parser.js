var fs = require('fs');
const path = require('path');
var csv = require('csv');
var moment = require('moment-timezone');
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
		this._header = options.header || [];
	}

	parsable(parsable, failure) {
		if(this._parsable !== false && parsable === true || parsable === false) {
			if(!parsable)
				this._failure = failure;
			this._parsable = parsable;
		}
		return this._parsable !== false;
	}

	_transform(row, encoding, callback) {
		let index = this._index++;

		if(this._columns && index >= this._header.length) {
			// check parsed row against column definition (not parsable if mismatched)
			this.parsable(row.length === this._columns.length, `Column count mismatch at row ${index} (${row.length}, expected ${this._columns.length})`);
		}

		if(this.parsable()) {
			index >= this._header.length
				? this.parseRow(row, index)
				: this.parseHeader(row, index);
		}

		// abandon errors for flow control in favour of just ending the stream
		callback(null, this.parsable() ? undefined : null);
    }

	parseRow(row, index) {
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

	parseHeader(row, index) {
		let header = this._header[index];

		if(header === 'columns') {
			this.parsable(row.join(',') === this._columns.join(','), `Column definition mismatch`);
		} else if(header instanceof RegExp) {
			this.parsable(header.test(row[0]), `Header mismatch at row ${index} [${row[0]}]`);
		} else if(typeof header === 'object') {
			let match = header.exp.exec(row[0]);

			if(this.parsable(match !== null, `Header mismatch at row ${index} [${row[0]}]`))
				Object.assign(this._data, header.fn(match))
		}
	}

	parse() {
		return new Promise((resolve, reject) => {
			this.on('end', () => resolve({ name: this._name, parsable: this.parsable(), failure: this._failure }));
		});
	}
}

var formatDefinitions = [{
	name: 'bnz_acct',
	regex: /([^-]+)-(\d{1,2}[A-Z]{3}\d{4})-to-(\d{1,2}[A-Z]{3}\d{4}).csv/,
	data: match => ({ start: moment.tz(match[2],'DMMMYYYY', 'Pacific/Auckland'), end: moment.tz(match[3],'DMMMYYYY', 'Pacific/Auckland') }),
	header: ['columns'],
	columns: ['Date','Amount','Payee','Particulars','Code','Reference','Tran Type','This Party Account','Other Party Account','Serial','Transaction Code','Batch Number','Originating Bank/Branch','Processed Date'],
	map: r => ({
		date: moment.tz(r.Date, 'DD/MM/YYYY', 'Pacific/Auckland'),
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
		processed: moment.tz(r['Processed Date'], 'DD/MM/YYYY', 'Pacific/Auckland'),
	})
}, {
	name: 'bnz_credit',
	regex: /([^-]+)-(\d{1,2}[A-Z]{3}\d{4})-to-(\d{1,2}[A-Z]{3}\d{4}).csv/,
	data: match => ({ account: match[1], start: moment.tz(match[2],'DMMMYYYY', 'Pacific/Auckland'), end: moment.tz(match[3],'DMMMYYYY', 'Pacific/Auckland') }),
	header: [ 'columns' ],
	columns: ['Date','Amount','Payee','Particulars','Code','Reference','Tran Type','Processed Date'],
	map: r => ({
		date: moment.tz(r.Date, 'DD/MM/YYYY', 'Pacific/Auckland'),
		amount: r.Amount,
		party: r.Payee,
		particulars: r.Particulars,
		code: r.Code,
		reference: r.Reference,
		type: r['Tran Type'],
		processed: moment.tz(r['Processed Date'], 'DD/MM/YYYY', 'Pacific/Auckland'),
	})
}, {
	name: 'kb_credit',
	regex: /(\d{4}-\d{2}-{2}--{4}-\d{4})_(\d{2}[A-Z][a-z]{2}).CSV/,
	data: match => ({ statement_date: moment.tz(match[2],'DDMMM', 'Pacific/Auckland') }),
	header: [
		{
			exp: /^(\d{4}-\d{4}-\d{4}-\d{4})$/,
			fn: m => ({ account: m[1] })
		}
	],
	map: r => ({
		date: moment.tz(r[0], 'DD-MM-YYYY', 'Pacific/Auckland'),
		party: r[1],
		subsidiary: r[2],
		amount: r[3]
	})
},{
	name: 'anz_acct',
	regex: /(\d{2}-\d{4}-\d{7}-\d{2})_Transactions_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2}).csv/,
	data: match => ({ account: match[1], start: moment.tz(match[2], 'Pacific/Auckland'), end: moment.tz(match[3], 'Pacific/Auckland') }),
	columns: ['type','party','particulars','code','reference','amount','date','unknown'],
	map: r => Object.assign({}, r, {
		date: moment.tz(r.date, 'DD/MM/YYYY', 'Pacific/Auckland')
	})
},{
	name: 'asb_acct',
	regex: /Export(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).csv/,
	data: match => ({ statement_date: moment.tz(match.slice(1,7).map(n => parseInt(n)), 'Pacific/Auckland') }),
	header: [
		/^Created date \/ time : (\d+) ([A-Za-z]+) (\d{4}) \/ (\d{2}):(\d{2}):(\d{2})$/,
		{
			exp: /^Bank (\d{2}); Branch (\d{4}); Account (\d{7})-(\d{2}) \((.+)\)$/,
			fn: m => ({ account: `${m[1]}-${m[2]}-${m[3]}-${m[4]} (${m[5]})` })
		}, {
			exp: /^From date (\d{4})(\d{2})(\d{2})$/,
			fn: m => ({ start: moment.tz(m.slice(1,4), 'Pacific/Auckland') })
		}, {
			exp: /^To date (\d{4})(\d{2})(\d{2})$/,
			fn: m => ({ end: moment.tz(m.slice(1,4), 'Pacific/Auckland') })
		},
		/^Avail Bal :/,
		/^Ledger Balance :/,
		'columns',
		/^$/,
	],
	columns: ['Date','Unique Id','Tran Type','Cheque Number','Payee','Memo','Amount'],
	map: r => Object.assign({}, r, {
		date: moment.tz(r.Date, 'YYYY/MM/DD', 'Pacific/Auckland'),
		txnCode: r['Unique Id'],
		type: r['Tran Type'],
		serial: r['Cheque Number'],
		party: r.Payee,
		particulars: r.Memo,
		amount: r.Amount
	})
},{
	name: 'westpac_credit',
	regex: /AXXXX_XXXX_XXXX_(\d{4})-(\d{2}[A-Za-z]{3}\d{2}).csv/,
	data: match => ({ account: `XXXX_${match[1]}`, start: moment.tz(match[2],'DDMMMYY', 'Pacific/Auckland') }),
	header: ['columns'],
	columns: ['Process Date','Amount','Other Party','Credit Plan Name','Transaction Date','Foreign Details','City','Country Code'],
	map: r => Object.assign({}, r, {
		processed: moment.tz(r['Process Date'], 'DD/MM/YYYY', 'Pacific/Auckland'),
		amount: r.Amount,
		party: r['Other Party'],
		type: r['Credit Plan Name'],
		date: moment.tz(r['Transaction Date'], 'DD/MM/YYYY', 'Pacific/Auckland'),
		particulars: r['Foreign Details'],
		code: r.City,
		reference: r['Country Code']
	})
}];

module.exports = {
	parse: function(filename, stream) {
		var formats = formatDefinitions
			.map(def => new Format({ filename: path.basename(filename), ...def }))
			.filter(format => format.parsable());

		stream = (stream || fs.createReadStream(filename)).pipe(csv.parse({ relax_column_count: true }));

		formats.forEach(format => {
			format.on('error', () => {});
			stream.pipe(format);
		});

		return formats;
	}
};
