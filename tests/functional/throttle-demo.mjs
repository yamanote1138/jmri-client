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
  },
  {
    'name': 'address',
    'description': 'DCC address of locomotive',
    'default': 3
  }
];

const { host, port, address } = await prompt.get(prompt_options);

console.log(`host set to ${host}`);
console.log(`port set to ${port}`);
console.log(`DCC address set to ${address}`);
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

// Listen for throttle events
client.on('throttle:acquired', (id) => {
  console.log(`✓ Throttle acquired: ${id}`);
});

client.on('throttle:updated', (id, data) => {
  console.log(`Throttle ${id} updated:`, data);
});

client.on('throttle:released', (id) => {
  console.log(`✓ Throttle released: ${id}`);
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
console.log('Ensuring power is ON...');
await client.powerOn();
await new Promise(resolve => setTimeout(resolve, 500));

console.log('');
console.log(`Acquiring throttle for address ${address}...`);
const throttleId = await client.acquireThrottle({ address: parseInt(address) });
console.log(`Throttle ID: ${throttleId}`);

await new Promise(resolve => setTimeout(resolve, 1000));

console.log('');
console.log('Testing throttle control...');

// Test speed control
console.log('Setting speed to 0.25 (25%)...');
await client.setThrottleSpeed(throttleId, 0.25);
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('Setting speed to 0.5 (50%)...');
await client.setThrottleSpeed(throttleId, 0.5);
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('Setting speed to 0.75 (75%)...');
await client.setThrottleSpeed(throttleId, 0.75);
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('Slowing down to 0.25...');
await client.setThrottleSpeed(throttleId, 0.25);
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('Emergency stop!');
await client.emergencyStop(throttleId);
await new Promise(resolve => setTimeout(resolve, 1000));

console.log('');
console.log('Testing direction change...');
console.log('Setting direction to reverse...');
await client.setThrottleDirection(throttleId, false);
await new Promise(resolve => setTimeout(resolve, 500));

console.log('Setting speed to 0.3 (reverse)...');
await client.setThrottleSpeed(throttleId, 0.3);
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('Stopping...');
await client.setThrottleSpeed(throttleId, 0);
await new Promise(resolve => setTimeout(resolve, 500));

console.log('Setting direction to forward...');
await client.setThrottleDirection(throttleId, true);
await new Promise(resolve => setTimeout(resolve, 500));

console.log('');
console.log('Testing functions...');
console.log('Turning on F0 (headlight)...');
await client.setThrottleFunction(throttleId, 'F0', true);
await new Promise(resolve => setTimeout(resolve, 1000));

console.log('Activating F2 (horn)...');
await client.setThrottleFunction(throttleId, 'F2', true);
await new Promise(resolve => setTimeout(resolve, 500));
await client.setThrottleFunction(throttleId, 'F2', false);
await new Promise(resolve => setTimeout(resolve, 500));

console.log('Turning off F0 (headlight)...');
await client.setThrottleFunction(throttleId, 'F0', false);
await new Promise(resolve => setTimeout(resolve, 1000));

console.log('');
console.log('Getting throttle state...');
const state = client.getThrottleState(throttleId);
if (state) {
  console.log(`  Address: ${state.address}`);
  console.log(`  Speed: ${state.speed}`);
  console.log(`  Direction: ${state.forward ? 'forward' : 'reverse'}`);
  console.log(`  Functions: ${Array.from(state.functions.entries()).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}`);
}

console.log('');
console.log('Releasing throttle...');
await client.releaseThrottle(throttleId);
await new Promise(resolve => setTimeout(resolve, 500));

console.log('');
console.log('Demo complete. Disconnecting...');
await client.disconnect();
console.log('Disconnected.');
