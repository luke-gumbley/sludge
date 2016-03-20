var parser = require('./lib/parser');

var files = process.argv.filter(parser.knownFormat);

files.forEach(function(name) { parser.read(name, function(data) {
	var rows = data.rows;
	delete data.rows;
	console.log(data);
	console.log(rows[0]);
})});