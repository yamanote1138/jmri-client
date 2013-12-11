var assert = require("assert"),
	JmriClient = require("../lib/jmriClient");

describe('JmriClient', function(){
	describe('constructor', function(){
		
		it('should throw error when host is not set', function(){
			assert.throws(
				function(){
					new JmriClient();
				}, 
				Error
			);
		});
		
		it('should throw error when port is null', function(){
			assert.throws(
				function(){
					new JmriClient({host:'localhost', port:null, path:'/custom'});
				},
				Error
			);
		});

		it('should not throw error when port is set', function(){
			assert.doesNotThrow(
				function(){
					new JmriClient({host:'localhost', port:1138});
				},
				Error
			);
		});
		
		it(
			'should throw error when path is null', function(){
			assert.throws(
				function(){
					new JmriClient({hostname:'localhost', path:'/crap'});
				}
			);
		});


	});
});