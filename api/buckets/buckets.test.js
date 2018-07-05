const assert = require('assert');
const { api } = require('../setup.test.js');

describe('Buckets', function () {

	it('should return a 200 response', function (done) {
		api.get('/api/buckets')
			.expect(200)
			.expect(res => {
				assert(res.body.length, 1);
				assert(res.body[0].name, 'tesqlitey');
			})
			.end(done);
	});

});
