'use strict';

const request = require('request');
const xml2json = require('xml2json');

function JmriClient(config) {
  this.config = {
    port:80,
    path:'/xmlio/'
  };
  Object.assign(this.config, config);

  if(!this.config.host) throw new Error('host not specified');
  if(typeof(this.config.host) != 'string') throw new Error('host is not a string');

  if(!this.config.port) throw new Error('port not specified');
  if(typeof(this.config.port) != 'number') throw new Error('port is not a number');
  if(this.config.port < 0 || this.config.port > 65535) throw new Error('port is out of range');

  if(!this.config.path) throw new Error('path not specified');
  if(typeof(this.config.path) != 'string') throw new Error('path is not a string');
}

JmriClient.prototype = {

  getPower: function(done){
    let xmldata = '<item><type>power</type><name>power</name></item>';

    _send(this, xmldata, function(err, data){
      if (!err && data) data = data.XMLIO.item.value;
      done(err, data);
    });
  },

  setPower: function(value, done){
    let xmldata = `<item><type>power</type><name>power</name><set>${value}</set></item>`;
    _send(this, xmldata, done);
  },

  getThrottle: function(addresses, done){
    if (!(addresses instanceof Array)) addresses = [addresses];
    let xmldata = '';
    addresses.forEach(function(address){
      xmldata += `<throttle><address>${address}</address></throttle>`;
    });
    _send(this, xmldata, done);
  },

  setThrottleSpeed: function(address, value, done){
    let xmldata = `<throttle><address>${address}</address><speed>${value}</speed></throttle>`;
    _send(this, xmldata, done);
  },

  setThrottleFunction: function(address, functionNumber, value, done){
    let xmldata = `<throttle><address>${address}</address><F${functionNumber}>${value}</F${functionNumber}></throttle>`;
    _send(this, xmldata, done);
  },

  setThrottleDirection: function(address, value, done){
    let xmldata = `<throttle><address>${address}</address><forward>${value}</forward></throttle>`;
    _send(this, xmldata, done);
  },

  setTurnout: function(address, value, done){
    let xmldata = `<turnout name="${address}" set="${value}" />`;
    _send(this, xmldata, done);
  },

  getTurnouts: function(done){
    let xmldata = '<list type="turnout" />';
    _send(this, xmldata, done);
  },

};

function _send(client, xmldata, done){

  // wrap request data
  xmldata = `<?xml version="1.0" encoding="UTF-8"?><XMLIO>${xmldata}</XMLIO>`;

  var options = {
    uri: client.host + client.path,
    body: xmldata,
    headers: {
      'Content-Type': 'application/xml',
    },
  };

  request.post(options, function(error, response, body) {
    if (body) body = JSON.parse(xml2json.toJson(body));
    done(error, body);
  });
}

module.exports = JmriClient;
