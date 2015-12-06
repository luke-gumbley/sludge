var fs = require('fs');
var csv = require('csv');
var moment = require('moment');

var formats = [{
	name: 'kb_credit',
	expression: new RegExp(/(\d{4}-\d{2}-{2}--{4}-\d{4})_(\d{2}[A-Z][a-z]{2}).CSV/),
	columns: ['date','party','card','amount'],
	header: 1,
	data: function(filename) {
		if(!this.expression.test(filename)) return null;
		var match = this.expression.exec(filename);
		return {
			filename: filename,
			type: this.name,
			account: match[1],
			date: moment(match[2],'DDMMM').format(),
		};
	}
},{
	name: 'anz_acct',
	expression: new RegExp(/(\d{2}-\d{4}-\d{7}-\d{2})_Transactions_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2}).csv/),
	columns: ['type','party','particulars','code','reference','amount','date','unknown'],
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
}];

var files = process.argv.filter(function(p) { return !formats.every(function(format) { return !format.expression.test(p); }); });

function readFile(filename, callback) {
	var format = formats.find(function(f) { return f.expression.test(filename); });
	var parser = csv.parse({columns: format.columns}, function(err, rows){
		var data = format.data(filename);
		data.rows = rows.slice(format.header || 0);
		callback(data);
	});
	fs.createReadStream(filename).pipe(parser);
}

files.forEach(function(name) { readFile(name, function(data) {
	var rows = data.rows;
	delete data.rows;
	console.log(data);
	console.log(rows[0]);
})});