const assert = require('assert');

const defaults = require('superagent-defaults');
const supertest = require('supertest');

const { createTokens } = require('../api');

const tokens = createTokens('luke.gumbley@gmail.com', 1);

const api = defaults(supertest('https://localhost:8443'))
	.set('authorization', 'Bearer ' + tokens.token)
	.set('x-xsrf-token', tokens.xsrfToken)
	.set('accept', 'application/json');

describe('Authentication', function () {

	it('should return a 404 response', function (done) {
		api.get('/api/')
			.expect(404, done);
	});

});

module.exports = { api };
