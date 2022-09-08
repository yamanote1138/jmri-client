jmri-client
[![Build](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml)
![License](https://img.shields.io/npm/l/jmri-client)
![NPM Version](https://img.shields.io/npm/v/jmri-client)
=========

node client to connect to a [JMRI](http://jmri.sourceforge.net/) xmlio webservice
this allows basic control of a model railroad layout via DCC

[![NPM](https://nodei.co/npm/jmri-client.png?compact=true)](https://nodei.co/npm/jmri-client/)

## Usage

### setup and instantiate client
```javascript
"use strict";

import { JmriClient } from "jmri-client";

const client = new JmriClient('http', 'jmri.local', 12080);
```

### getPower
get status of layout power (on or off)
```javascript
await client.getPower().then((res) => {
  console.log(res);
});
```

### setPower
turn layout power on/off
```javascript
await client.setPower(true).then((res) => {
  console.log(res);
});
```

## future functionality

### getThrottle
get full status data for a given address or array of addresses (eg [11, 38])
```javascript
await client.getThrottle(addresses);
```

### setThrottleSpeed
set speed for specified throttle address
```javascript
await client.setThrottleSpeed(address, speed);
```

### setThrottleDirection
set direction for specified address
use 'true' for forward, 'false' for backward
```javascript
await client.setThrottleDirection(address, direction);
```

### setThrottleFunction
set function value specified address and function
```javascript
await client.setThrottleFunction(address, functionNumber, value);
```

### getTurnouts
list all turnouts with current status
```javascript
await client.getTurnouts();
```

### setTurnout
set status of specific turnout by address
```javascript
await client.setTurnout(address, value);
```
