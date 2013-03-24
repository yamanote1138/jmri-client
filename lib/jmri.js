var request = require('request'),
	util = require('utile'),
	xml2json = require('xml2json');

function JmriClient(config) {
	config = util.mixin(
		{
			host:'',
			port:80,
			path:'/xmlio/'
		},
		config
	);

	this.host = config.host;
	this.port = config.port;
	this.path = config.path;

};

JmriClient.prototype.connect = function(done) {
	done(err, connection);
};

JmriClient.prototype.getThrottle = function(address, done) {

	var xmldata = "<throttle><address>"+address+"</address></throttle>";
	this._send(xmldata, done);

};

JmriClient.prototype._send = function(xmldata, done){

	// wrap request data 
	xmldata = '<?xml version="1.0" encoding="UTF-8"?><XMLIO>'+xmldata+'</XMLIO>';

	var options = {
		'uri':this.host+this.path,
		'body':xmldata,
		'headers': {
			'Content-Type':'application/xml'
		}
	};
	request.post(options, function (error, response, body) {
		done(error, body);
	});

}

exports = module.exports = JmriClient;
