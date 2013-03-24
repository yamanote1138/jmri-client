var request = require('request'),
	util = require('utile');

function JmriClient(config) {
	config = utile.mixin(
		config,
		{
			host:'jmri.rodimus.x.chadfrancis.com',
			port:'80',
			user:'',
			pass:''
		}
	);
};

JmriClient.prototype.connect = function(done) {
	done(err, connection);
};

JmriClient.prototype.send = function(done) {
	done(err, data);
};

exports = module.exports = JmriClient;
