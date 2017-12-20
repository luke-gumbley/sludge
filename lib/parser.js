var fs = require('fs');
var csv = require('csv');
var moment = require('moment');

var formats = [{
	name: 'kb_credit',
	expression: new RegExp(/(\d{4}-\d{2}-{2}--{4}-\d{4})_(\d{2}[A-Z][a-z]{2}).CSV/),
	columns: [ { name: 'date', parse: function(val) { return new Date(val.substring(6), val.substring(3,5),val.substring(0,2)); } },'party','card','amount'],
	header: 1,
	data: function(filename) {
		if(!this.expression.test(filename)) return null;
		var match = this.expression.exec(filename);
		return {
			filename: filename,
			type: this.name,
			account: match[1],
			date: moment(match[2],'DDMMM').format()
		};
	}
},{
	name: 'anz_acct',
	expression: new RegExp(/(\d{2}-\d{4}-\d{7}-\d{2})_Transactions_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2}).csv/),
	columns: ['type','party','particulars','code','reference','amount',{ name:'date', parse: function(val) { return new Date(val.substring(6), val.substring(3,5),val.substring(0,2)); } },'unknown'],
	data: function(filename) {
		if(!this.expression.test(filename)) return null;
		var match = this.expression.exec(filename);
		return {
			filename: filename,
			type: this.name,
			account: match[1],
			start: moment(match[2]).format(),
			end: moment(match[3]).format()
		};
	}
},{
	name: 'bnz_acct',
	expression: new RegExp(/([^-]+)-(\d{1,2}[A-Z]{3}\d{4})-to-(\d{1,2}[A-Z]{3}\d{4}).csv/),
	columns: [{name: 'date', parse: d => moment(d,'DD/MM/YYYY')},'amount','party','particulars','code','reference','type','account','partyAccount','serial','txnCode','batch','bank',{name: 'processed', parse: d => moment(d,'DD/MM/YYYY')}],
	header: 1,
	data: function(filename) {
		if(!this.expression.test(filename)) return null;
		var match = this.expression.exec(filename);
		return {
			filename: filename,
			type: this.name,
			start: moment(match[2],'DMMMYYYY').format(),
			end: moment(match[3],'DMMMYYYY').format()
		};
	}
}];

module.exports = {
	knownFormat: function(filename) {
		return !formats.every(function(format) { return !format.expression.test(filename); });
	},

	testFormat: function(filename) {
		parsable = module.exports.knownFormat(filename);
		return new Promise((resolve, reject) => {
			parsable ? resolve(filename) : reject(filename);
		});
	},

	readStream: function(stream, options, parse) {
		return new Promise(function(resolve) {
			var parser = csv.parse(options, function(err, rows) { resolve(parse(err, rows)); });
			stream.pipe(parser);
		});
	},

	readFile: function(filename, options, parse) {
		return module.exports.readStream(fs.createReadStream(filename), options, parse);
	},

	parse: function(filename, stream) {
		var format = formats.find(function(f) { return f.expression.test(filename); });
		var columns = format.columns.map(function(column) { return typeof column === 'object' ? column.name : column });
		var formatters = format.columns.filter(function(column) { return typeof column === 'object' });

		stream = stream || fs.createReadStream(filename);

		return module.exports.readStream(stream, { columns: columns }, function(err, rows) {
				var data = format.data(filename);
				data.rows = rows
					.slice(format.header || 0)
					.map(function(row, i) {
						formatters.forEach(function(formatter) {
							row[formatter.name] = formatter.parse(row[formatter.name]);
						});
						row.ordinal = i;
						return row;
					});
				return data;
			});
	}
};
