"use strict";
import prompt from "prompt";
import { JmriClient } from "../../dist/index.js";

prompt.start();

	const prompt_options = [
		{
			'name':'protocol',
			'default':'http'
		},
		{
			'name':'host',
			'default':'jmri.local'
		},
		{
			'name':'port',
			'default':12080
		}
	];

	const { protocol, host, port } = await prompt.get(prompt_options);

	console.log(`protocol set to ${protocol}`);
	console.log(`host set to ${host}`);
	console.log(`port set to ${port}`);

const client = new JmriClient(protocol, host, port);

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