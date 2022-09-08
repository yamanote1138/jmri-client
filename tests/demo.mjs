"use strict";

import { JmriClient } from "../dist/index.js";

const client = new JmriClient('http', 'jmri.local', 12080);

await client.getPower().then((res) => {
  console.log(res);
});

await client.setPower(true).then((res) => {
  console.log(res);
});

await client.getRoster().then((res) => {
  console.log(res);
});
