import assert from 'assert';

import defaults from 'superagent-defaults';
import supertest from 'supertest';

import { createTokens, app } from './index.js';

import database from './database.js';

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

	it('should return a 403 response from /auth/barrel/7 with valid tokens', function(done) {
		api.get('/auth/barrel/7')
			.expect(403, done);
	});

	it('should return a 403 response from /auth/barrel/1 with a bad user', function(done) {
		api.badUser.get('/auth/barrel/1')
			.expect(403, done);
	});

	it('should return a 403 response from /auth/barrel/1 with no tokens', function(done) {
		api.noTokens.get('/auth/barrel/1')
			.expect(403, done);
	});

	it('should return a 200 response from /auth/barrel/1 with no barrel', function(done) {
		api.noBarrel.get('/auth/barrel/1')
			.expect(res => {
				assert.equal(res.body.id, 1)
			})
			.expect(200, done);
	});

	it('should return a 200 response from /auth/barrel/1 with valid tokens', function(done) {
		api.get('/auth/barrel/1')
			.expect(res => {
				assert.equal(res.body.id, 1)
			})
			.expect(200, done);
	});

	it('should return a 200 response from /blank with valid tokens', function (done) {
		api.get('/blank')
			.expect(200, done);
	});

});

export default api;
