var parser = require('./lib/parser');
var database = require('./lib/database');

var files = process.argv.filter(parser.knownFormat);

files.forEach(function(name) { parser.read(name, function(data) {
	var rows = data.rows;
	delete data.rows;
	console.log(data);
	console.log(rows[0]);
})});

database.connect('postgres://luke.gumbley:@localhost:5432/luke.gumbley', { logging: false });

database.sync().then(function () {
	database.user.create({
		firstName: 'John',
		lastName: 'Hancock'
	});
});

/*
database.user.findOne().then(function (user) {
    console.log(user.firstName);
});
*/