var fs = require('fs');
var csv = require('csv');
var moment = require('moment');

var formats = [{
	name: 'kb_credit',
	expression: new RegExp(/(\d{4}-\d{2}-{2}--{4}-\d{4})_(\d{2}[A-Z][a-z]{2}).CSV/),
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
	data: function(filename) {
		if(!this.expression.test(filename)) return null;
		var match = this.expression.exec(filename);
		return {
			filename: filename,
			type: this.name,
			account: match[1],
			start: moment(match[2]).format(),
			end: moment(match[3]).format(),
		};
	}
}]

var files = process.argv.filter(function(p) { return !formats.every(function(format) { return !format.expression.test(p); }); });

function readFile(filename, callback) {
	var parser = csv.parse({columns: true}, function(err, data){
		callback(filename, data);
	});
	fs.createReadStream(filename).pipe(parser);
}

files.forEach(function(name) { readFile(name, function(filename, data) {
	var format = formats.find(function(format) { return format.expression.test(filename); });
	var summary = format.data(filename);
	summary.lines = data.length;
	console.log(summary);
})});