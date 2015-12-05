var fs = require('fs');
var csv = require('csv');

var isCSV = new RegExp('\.[Cc][Ss][Vv]$');
var files = process.argv.filter(function(p) { return isCSV.test(p); });

function readFile(filename, callback) {
	var parser = csv.parse({columns: true}, function(err, data){
		callback(filename, data);
	});
	fs.createReadStream(filename).pipe(parser);
}

files.forEach(function(name) { readFile(name, function(filename, data) {
	console.log(filename, data.length);
})});