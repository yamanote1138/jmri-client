"use strict";
import prompt from "prompt";
import { JmriClient, PowerState } from "../../dist/esm/index.js";

prompt.start();

const prompt_options = [
  {
    'name': 'host',
    'default': 'jmri.local'
  },
  {
    'name': 'port',
    'default': 12080
  }
];

const { host, port } = await prompt.get(prompt_options);

console.log(`host set to ${host}`);
console.log(`port set to ${port}`);
console.log('');

// Create client with event listeners
const client = new JmriClient({
  host,
  port: parseInt(port),
  autoConnect: true
});

// Listen for connection events
client.on('connected', () => {
  console.log('✓ Connected to JMRI');
});

client.on('disconnected', (reason) => {
  console.log(`✗ Disconnected: ${reason}`);
});

client.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

client.on('power:changed', (state) => {
  console.log(`Power changed: ${state === PowerState.ON ? 'ON' : 'OFF'}`);
});

// Wait for connection
await new Promise((resolve) => {
  if (client.isConnected()) {
    resolve();
  } else {
    client.once('connected', resolve);
  }
});

console.log('');
console.log('Testing power control...');

// Get current power state
const currentPower = await client.getPower();
console.log(`Current power state: ${currentPower === PowerState.ON ? 'ON' : 'OFF'} (${currentPower})`);

// Turn power on
console.log('Setting power ON...');
await client.powerOn();
await new Promise(resolve => setTimeout(resolve, 500));

// Turn power off
console.log('Setting power OFF...');
await client.powerOff();
await new Promise(resolve => setTimeout(resolve, 500));

console.log('');
console.log('Testing roster retrieval...');

// Get roster
const roster = await client.getRoster();
console.log(`Found ${roster.length} locomotives in roster`);

if (roster.length > 0) {
  console.log('First 3 entries:');
  roster.slice(0, 3).forEach((entry) => {
    console.log(`  - ${entry.name} (Address: ${entry.address})`);
  });
}

console.log('');
console.log('Demo complete. Disconnecting...');

await client.disconnect();
console.log('Disconnected.');
