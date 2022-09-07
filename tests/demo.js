"use strict";

const { JmriClient } = require("../dist/index");

const client = new JmriClient('http', 'jmri.local', 12080);

client.getPower().then((response)=>{
  console.log(JSON.stringify(response));
});

client.setPower(true).then((response)=>{
  console.log(JSON.stringify(response));
});

client.setPower(false).then((response)=>{
  console.log(JSON.stringify(response));
});