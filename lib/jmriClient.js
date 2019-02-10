'use strict';

const _ = require('lodash');
const request = require('request');
const xml2json = require('xml2json');

function JmriClient(config) {
  config = _.extend(
    {
      host: '',
      port: 80,
      path: '/xmlio/',
    },
    config
  );

  this.host = config.host;
  this.port = config.port;
  this.path = config.path;
}

JmriClient.prototype = {

  getPower: function(done){
    var self = this;

    var xmldata = '<item><type>power</type><name>power</name></item>';

    _send(self, xmldata, function(err, data){
      if (!err && data){
        data = data.XMLIO.item.value;
      }
      done(err, data);
    });
  },

  setPower: function(value, done){
    var xmldata = '<item><type>power</type><name>power</name><set>' + value + '</set></item>';
    _send(this, xmldata, done);
  },

  getThrottle: function(addresses, done){
    if (!(addresses instanceof Array)){
      addresses = [addresses];
    }
    var xmldata = '';
    addresses.forEach(function(address){
      xmldata += '<throttle><address>' + address + '</address></throttle>';
    });
    _send(this, xmldata, done);
  },

  setThrottleSpeed: function(address, value, done){
    var xmldata = '<throttle><address>' + address + '</address><speed>' + value + '</speed></throttle>';
    _send(this, xmldata, done);
  },

  setThrottleFunction: function(address, functionNumber, value, done){
    var xmldata = '<throttle><address>' + address + '</address><F' + functionNumber + '>' + value + '</F' + functionNumber + '></throttle>';
    _send(this, xmldata, done);
  },

  setThrottleDirection: function(address, value, done){
    var xmldata = '<throttle><address>' + address + '</address><forward>' + value + '</forward></throttle>';
    _send(this, xmldata, done);
  },

  setTurnout: function(address, value, done){
    var xmldata = "<turnout name='" + address + "' set='" + value + "' />";
    _send(this, xmldata, done);
  },

  getTurnouts: function(done){
    var xmldata = "<list type='turnout' />";
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
    if (body){ body = JSON.parse(xml2json.toJson(body)); }
    done(error, body);
  });
}

module.exports = JmriClient;
