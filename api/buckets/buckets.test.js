const assert = require('assert').strict;
const { api } = require('../setup.test.js');

describe('Buckets', function () {

	it('should return a 200 response', function (done) {
		api.get('/api/buckets')
			.expect(200)
			.expect(res => {
				assert.equal(res.body.length, 5);
				assert.equal(res.body[0].name, 'mortgage');
			})
			.end(done);
	});

});
