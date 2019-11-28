const assert = require('assert').strict;
const { api } = require('../setup.test.js');

describe('Barrels', function () {

	it('should return a 403 response with a bad user', function (done) {
		api.badUser.get('/api/barrels')
			.expect(res => {
				assert(res.headers['set-cookie'],'Tokens not deleted in response');
			})
			.expect(403, done);
	});

	it('should return a 200 response', function (done) {
		api.get('/api/barrels')
			.expect(200)
			.expect(res => {
				assert.equal(res.body.length, 2);
				assert.equal(res.body[0], 1);
			})
			.end(done);
	});

});
