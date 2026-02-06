import { JmriClient } from "../../dist/esm/index.js";

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

client.on('message:received', (msg) => {
  if (msg.type === 'roster') {
    console.log('Raw roster response:');
    console.log(JSON.stringify(msg, null, 2));
  }
});

client.on('connected', async () => {
  console.log('Connected, fetching roster...\n');

  try {
    await client.getRoster();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.disconnect();
    process.exit(1);
  }
});

setTimeout(() => process.exit(1), 10000);
