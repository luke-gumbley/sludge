const assert = require('assert');

const defaults = require('superagent-defaults');
const supertest = require('supertest');

const { createTokens, app } = require('../api');

const database = require('./database.js');

const tokens = createTokens('jane.doe@email.com', 1);

const api = defaults(supertest(app))
	.set('authorization', 'Bearer ' + tokens.token)
	.set('x-xsrf-token', tokens.xsrfToken)
	.set('accept', 'application/json');

before(function(done){
	database
		.connectTest()
		.then(done);
});

after(function(done){
	database.close().then(() => done());
});

describe('Authentication', function () {

	it('should return a 404 response', function (done) {
		api.get('/api/')
			.expect(404, done);
	});

});

module.exports = { api };
