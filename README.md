jmri-client [![Build Status](https://travis-ci.org/yamanote1138/jmri-client.png?branch=master)](https://travis-ci.org/yamanote1138/jmri-client)
=========

node client to connect to a [JMRI](http://jmri.sourceforge.net/) xmlio webservice
this allows basic control of a model railroad layout via DCC

[![NPM](https://nodei.co/npm/jmri-client.png?compact=true)](https://nodei.co/npm/jmri-client/)

## Usage

setup, configure and connect
```javascript
const JmriClient = require('jmri-client');

let client = new JmriClient({
	host: 'http://domain.com',
  port: 1138
});
```

get status of layout power (on or off)
```javascript
client.getPower(function(err, status){
	console.log('the power is ', status);
	// handle error and/or do stuff
});
```

turn layout power on/off (2=on, 4=off)
todo: change to accept 'on', 1, 'off' or 0
```javascript
client.setPower('1', function(err){
	// handle error and/or do stuff
});
```

get full status data for a given address or array of addresses (eg [11, 38])
```javascript
client.getThrottle(addresses, function(err, data){
	// handle error and/or do stuff
});
```

set speed (0-1) for specified address
todo: change this to accept value from 0-100
```javascript
client.setThrottleSpeed(address, speed, function(err){
	// handle error and/or do stuff
});
```

set direction for specified address
use 'true' for forward, 'false' for backward
todo: fix this to use clearer values
```javascript
client.setThrottleDirection(address, function(err){
	// handle error and/or do stuff
});
```

set function value specified address and function
```javascript
client.setThrottleFunction(address, functionNumber, value, function(err){
	// handle error and/or do stuff
});
```

list all turnouts with current status
```javascript
client.getTurnouts(function(err, data){
	// handle error and/or do stuff
});
```

set status of specific turnout by address
```javascript
client.setTurnout(address, value, function(err, data){
	// handle error and/or do stuff
});
```
