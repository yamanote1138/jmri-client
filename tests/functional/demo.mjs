"use strict";

import { JmriClient } from "../../dist/index.js";

const client = new JmriClient('http', 'jmri.local', 12080);

client.getPower().then((response)=>{
  console.log(response.data);
});

client.setPower(true).then((response)=>{
  console.log(response.data);
});

client.setPower(false).then((response)=>{
  console.log(response.data);
});

client.getRoster().then((response) => {
  console.log(response.data);
});