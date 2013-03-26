var jmri = require('../lib/jmri.js'),
	prompt = require('prompt'),
	assert = require('chai').assert;

describe('JmriClient', function(done) {
	
	var jmriClient;

	before(function(done){
		prompt.start();

		prompt.get(['host'], function (err, result) {
			if (err) { console.log(err); return; }
			
			jmriClient = new jmri({
				host: result.host
			});
			done();
		});
	});

	describe('#getPower()', function(done) {
		it('should return xmldata', function(done) {
			jmriClient.getPower(function(err, data){
				assert.isNull(err, 'err is not null');
				assert.isNotNull(data, 'data is null');
				console.log(data);
				console.log(jmriClient.jmri.power);
				done();
			});
		});
	});

});