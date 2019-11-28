const assert = require('assert');

const defaults = require('superagent-defaults');
const supertest = require('supertest');

const { createTokens, app } = require('../api');

const database = require('./database.js');

function createApi(tokens) {
	let newApi = defaults(supertest(app)).set('accept', 'application/json');
	if(tokens) {
		newApi.set('authorization', 'Bearer ' + tokens.token);
		newApi.set('x-xsrf-token', tokens.xsrfToken);
	}
	return newApi;
}

const api = createApi(createTokens('alex@email.com', 1));
api.noTokens = createApi();
api.noBarrel = createApi(createTokens('alex@email.com'));
api.badUser = createApi(createTokens('jane@doe.com', 1));

before(function(done){
	database.connectTemp()
		.then(() => database.testData())
		.then(done);
});

after(function(done){
	database.close().then(() => done());
});

describe('Authentication', function () {

	it('should return a 403 response from /api/ with no tokens', function(done) {
		api.noTokens.get('/api/')
			.expect(403, done);
	});

	it('should return a 404 response from /api/ with valid tokens', function (done) {
		api.get('/api/')
			.expect(404, done);
	});

	it('should return a 200 response from /blank with valid tokens', function (done) {
		api.get('/api/')
			.expect(404, done);
	});

});

module.exports = { api };
