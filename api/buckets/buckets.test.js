const assert = require('assert');
const { api } = require('../auth.test.js');

describe('Buckets', function () {

	it('should return a 200 response', function (done) {
		api.get('/api/buckets')
			.expect(200, done);
	});

});
