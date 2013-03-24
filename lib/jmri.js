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

JmriClient.prototype = {
	
	getThrottle: function(addresses, done){
		if(!(addresses instanceof Array)){
			addresses = [addresses];
		}
		var xmldata = "";
		addresses.forEach(function(address){
			xmldata += "<throttle><address>" + address + "</address></throttle>";
		});
		this._send(xmldata, done);
	},

	setThrottleSpeed: function(address, value, done){
		var xmldata = "<throttle><address>"+address+"</address><speed>"+value+"</speed></throttle>";
		this._send(xmldata, done);
	},

	setThrottleFunction: function(address, functionNumber, value, done){
		var xmldata = "<throttle><address>"+address+"</address><F"+functionNumber+">"+value+"</F"+functionNumber+"></throttle>";
		this._send(xmldata, done);
	},

	setThrottleDirection: function(address, value, done){
		var xmldata = "<throttle><address>"+address+"</address><forward>"+value+"</forward></throttle>";
		this._send(xmldata, done);
	},

	getPower: function(done){
		var xmldata = "<item><type>power</type><name>power</name></item>";
		this._send(xmldata, done);
	},

	setPower: function(value, done){
		var xmldata = "<item><type>power</type><name>power</name><set>"+value+"</set></item>";
		this._send(xmldata, done);
	},

	setTurnout: function(address, value){
		var xmldata = "<turnout name='"+address+"' set='"+value+"' />";
		this._send(xmldata, done);
	},

	getTurnouts: function(done){
		var xmldata = "<list type='turnout' />";
		this._send(xmldata, done);
	},

	_send: function(xmldata, done){

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

};

exports = module.exports = JmriClient;
