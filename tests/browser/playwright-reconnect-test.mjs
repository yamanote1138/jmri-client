#!/usr/bin/env node
/**
 * Headless browser test for reconnection using Playwright
 * Monitors WebSocket connections and console logs programmatically
 */

import { chromium } from 'playwright';

console.log('=== Playwright Headless Browser Reconnection Test ===\n');

// Track WebSocket connections
const wsConnections = [];
let wsConnectionCount = 0;

// Track console messages
const consoleMessages = [];

// Track events from the page
const pageEvents = {
  connected: 0,
  disconnected: 0,
  reconnecting: 0,
  reconnected: 0
};

// Launch browser
console.log('Launching headless Chromium...');
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-web-security'] // Allow WebSocket connections
});

const context = await browser.newContext();
const page = await context.newPage();

// Monitor console messages
page.on('console', msg => {
  const text = msg.text();
  const timestamp = new Date().toISOString();
  consoleMessages.push({ timestamp, text, type: msg.type() });

  // Parse our structured logs
  if (text.includes('CONNECTED:')) {
    pageEvents.connected++;
    console.log(`[${timestamp}] 📡 CONNECTED event (total: ${pageEvents.connected})`);
  } else if (text.includes('DISCONNECTED:')) {
    pageEvents.disconnected++;
    console.log(`[${timestamp}] 📡 DISCONNECTED event (total: ${pageEvents.disconnected})`);
  } else if (text.includes('RECONNECTING:')) {
    pageEvents.reconnecting++;
    console.log(`[${timestamp}] 📡 RECONNECTING event (total: ${pageEvents.reconnecting})`);
  } else if (text.includes('RECONNECTED:')) {
    pageEvents.reconnected++;
    console.log(`[${timestamp}] 📡 RECONNECTED event (total: ${pageEvents.reconnected})`);
  }

  // Show error messages
  if (msg.type() === 'error') {
    console.log(`[${timestamp}] ❌ Console Error: ${text}`);
  }
});

// Monitor page errors
page.on('pageerror', error => {
  console.log(`[PAGE ERROR] ${error.message}`);
});

// Monitor WebSocket connections via CDP
const client = await context.newCDPSession(page);
await client.send('Network.enable');

client.on('Network.webSocketCreated', ({ requestId, url }) => {
  wsConnectionCount++;
  const timestamp = new Date().toISOString();
  wsConnections.push({ requestId, url, timestamp, status: 'created' });
  console.log(`[${timestamp}] 🔌 WebSocket #${wsConnectionCount} CREATED: ${url}`);
});

client.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
  const conn = wsConnections.find(c => c.requestId === requestId);
  if (conn && !conn.opened) {
    conn.opened = true;
    console.log(`[${new Date(timestamp * 1000).toISOString()}] ✅ WebSocket opened: ${conn.url}`);
  }
});

client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
  const conn = wsConnections.find(c => c.requestId === requestId);
  if (conn) {
    conn.status = 'closed';
    console.log(`[${new Date(timestamp * 1000).toISOString()}] ❌ WebSocket closed: ${conn.url}`);
  }
});

// Navigate to test page
console.log('\nNavigating to test page...');
await page.goto('http://localhost:3000/tests/browser/reconnection-test.html');

// Wait for page to load
await page.waitForLoadState('networkidle');
console.log('✅ Page loaded\n');

// Step 1: Click Connect
console.log('Step 1: Clicking Connect button...\n');
await page.click('#connect-btn');

// Wait for connection
await page.waitForTimeout(2000);

// Step 2: Force disconnect
console.log('\nStep 2: Clicking Force Disconnect button...\n');
await page.click('#force-btn');

// Step 3: Monitor reconnection for 20 seconds
console.log('\nStep 3: Monitoring reconnection attempts for 20 seconds...\n');
await page.waitForTimeout(20000);

// Step 4: Read status from page
const status = await page.evaluate(() => {
  return {
    state: document.getElementById('state').textContent,
    connectedCount: parseInt(document.getElementById('connected-count').textContent),
    disconnectedCount: parseInt(document.getElementById('disconnected-count').textContent),
    reconnectingCount: parseInt(document.getElementById('reconnecting-count').textContent),
    reconnectedCount: parseInt(document.getElementById('reconnected-count').textContent)
  };
});

// Close browser
await browser.close();

// Results
console.log('\n=== TEST RESULTS ===\n');

console.log('WebSocket Connections:');
console.log(`  Total created: ${wsConnectionCount}`);
console.log(`  Connections:`);
wsConnections.forEach((conn, i) => {
  console.log(`    #${i + 1}: ${conn.status} - ${conn.url} (${conn.timestamp})`);
});

console.log('\nPage Event Counters:');
console.log(`  Connected:     ${status.connectedCount}`);
console.log(`  Disconnected:  ${status.disconnectedCount}`);
console.log(`  Reconnecting:  ${status.reconnectingCount}`);
console.log(`  Reconnected:   ${status.reconnectedCount}`);

console.log('\n=== ANALYSIS ===\n');

// Critical test: Do reconnection attempts create new WebSocket connections?
if (status.connectedCount === 0) {
  console.log('❌ FAIL: Never connected initially');
  process.exit(1);
}

console.log('✅ Initial connection succeeded');

if (status.disconnectedCount === 0) {
  console.log('❌ FAIL: Force disconnect did not work');
  process.exit(1);
}

console.log('✅ Force disconnect triggered');

if (status.reconnectingCount === 0) {
  console.log('❌ FAIL: No reconnection attempts fired');
  console.log('\n💡 This indicates the reconnection manager is not scheduling attempts in browser');
  process.exit(1);
}

console.log(`✅ ${status.reconnectingCount} reconnection attempts fired`);

// The critical test: Are new WebSockets being created?
const expectedWSConnections = 1 + status.reconnectingCount; // Initial + attempts
const actualWSConnections = wsConnectionCount;

console.log(`\n📊 WEBSOCKET CONNECTION ANALYSIS:`);
console.log(`  Expected: ${expectedWSConnections} (1 initial + ${status.reconnectingCount} reconnection attempts)`);
console.log(`  Actual:   ${actualWSConnections}`);

if (actualWSConnections >= expectedWSConnections) {
  console.log(`\n✅ PASS: Reconnection creates new WebSocket connections!`);
  console.log(`   Each reconnection attempt created a new WebSocket as expected.`);
  process.exit(0);
} else {
  console.log(`\n❌ FAIL: Reconnection not creating WebSocket connections`);
  console.log(`   Reconnection events fired (${status.reconnectingCount}x)`);
  console.log(`   BUT only ${actualWSConnections} WebSocket connection(s) created`);
  console.log(`   Missing: ${expectedWSConnections - actualWSConnections} WebSocket connections`);
  console.log(`\n   Test failure indicates:`);
  console.log(`   - ReconnectionManager schedules attempts ✓`);
  console.log(`   - Events fire correctly ✓`);
  console.log(`   - But connect() is NOT creating new WebSockets ✗`);
  process.exit(1);
}
