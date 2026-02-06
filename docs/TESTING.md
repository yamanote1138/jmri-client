# Testing Guide

This guide covers how to test the jmri-client library with a real JMRI instance.

## Prerequisites

1. **JMRI Installation**: JMRI 5.x running on your network
2. **WebServer Enabled**: In JMRI Preferences → Web Server, ensure WebServer is enabled (default port 12080)
3. **DCC System**: Connected and configured in JMRI
4. **Test Locomotive**: A locomotive configured in your DCC system (note its address)
5. **Built Library**: Run `npm run build` to build the latest version

## Safety First ⚠️

When testing with physical hardware:
- Always verify the locomotive address before running tests
- Keep the maximum speed conservative (default tests use 30%)
- Keep your hand near the emergency stop or power switch
- All test scripts include safety features:
  - Power-off on exit
  - Power-off on errors
  - Power-off on Ctrl+C interrupt
  - Option to type "exit" in interactive tests

## Test Scripts

### 1. Interactive Test (Recommended)

**Purpose**: Streamlined interactive test with configuration prompts

**File**: `tests/functional/interactive-test.mjs`

**Features**:
- Prompts for hostname, port, and locomotive address
- Walks through essential operations with confirmations
- Press Ctrl+C at any time for emergency stop
- Automatically powers off track on completion or error

**How to Run**:

```bash
# From the project root directory
node tests/functional/interactive-test.mjs
```

**Test Sequence**:
1. Prompt for JMRI hostname (default: raspi-jmri.local)
2. Prompt for port (default: 12080)
3. Prompt for locomotive address (default: 11)
4. Connect to JMRI
5. Power ON (confirm)
6. Power OFF (confirm)
7. Power ON and acquire throttle
8. Set direction to FORWARD
9. Speed 10% → 20% → 30% → stop (confirm)
10. Set direction to REVERSE
11. Speed 10% → 20% → 30% → stop (confirm)
12. Headlight ON (confirm)
13. Headlight OFF (confirm)
14. Release throttle
15. Power OFF

**Expected Duration**: 3-4 minutes

### 2. Interactive Demo (Extended)

**Purpose**: Step through each operation with manual verification

**File**: `tests/functional/interactive-demo.mjs`

**Features**:
- Prompts before each operation
- Allows you to verify physical locomotive behavior
- Type "exit" at any prompt to safely shut down
- Press Ctrl+C at any time for emergency stop
- Automatically powers off track on completion or error

**How to Run**:

```bash
# From the project root directory
node tests/functional/interactive-demo.mjs
```

**Test Sequence**:
1. Power Off - verify track power is off
2. Power On - verify power indicators lit
3. Acquire Throttle - establishes control of locomotive
4. Forward at 15% - locomotive moves forward slowly
5. Increase to 25% - locomotive moves faster
6. Maximum Speed (30%) - locomotive at max test speed
7. Slow Down to 15% - locomotive slows
8. Stop - locomotive stops
9. Reverse at 20% - locomotive moves in reverse
10. Stop - locomotive stops
11. Forward Direction - change direction (while stopped)
12. Headlight On (F0) - turns on headlight
13. Horn (F2) - sounds horn
14. Headlight Off - turns off headlight
15. Quick Movement Test - brief forward movement
16. Release Throttle - releases control
17. Power Off - turns off track power

**Expected Duration**: 5-10 minutes (depending on verification time)

### 2. Automated Demo

**Purpose**: Automated test with timed pauses (no interaction required)

**File**: `tests/functional/demo-throttle.mjs`

**Features**:
- Runs automatically with built-in delays
- Good for quick verification or demonstrations
- Shows real-time speed update events
- Powers off on completion or error
- Ctrl+C for emergency stop

**How to Run**:

```bash
node tests/functional/demo-throttle.mjs
```

**Duration**: ~45 seconds

### 3. Cleanup Utility

**Purpose**: Clean up after crashed tests

**File**: `tests/functional/cleanup-throttles.mjs`

**Features**:
- Releases any active throttles from this client
- Turns power OFF
- Safe to run anytime

**How to Run**:

```bash
node tests/functional/cleanup-throttles.mjs
```

**When to use**:
- After a test crashes without completing
- Before running tests if you suspect stale throttles
- As a safety measure between test runs

**Note**: This only clears throttles created by this client. To clear ALL throttles in JMRI, restart JMRI or use Tools → Throttles → Release All in JMRI.

### 4. Debug Scripts

For troubleshooting WebSocket communication:

**Basic Throttle Debug**:
```bash
node tests/functional/debug-throttle2.mjs
```
Shows all WebSocket messages for throttle acquisition and release.

**Throttle Control Debug**:
```bash
node tests/functional/debug-throttle-control.mjs
```
Shows all WebSocket messages for speed, direction, and function commands.

**Simple Connection Test**:
```bash
node tests/functional/test-connection.mjs
```
Basic connectivity test with power control and roster retrieval.

## Configuration

To test with different settings, edit the test file:

```javascript
const client = new JmriClient({
  host: 'raspi-jmri.local',  // Change to your JMRI hostname/IP
  port: 12080,                // Change if using different port
  autoConnect: true
});

// In the test code, change:
const throttleId = await client.acquireThrottle({ address: 11 });  // Your locomotive address

// And modify speed limits:
await client.setThrottleSpeed(throttleId, 0.30);  // Change max speed (0.0-1.0)
```

## Troubleshooting

### Connection Issues

**Problem**: `Connection error` or `ECONNREFUSED`

**Solutions**:
- Verify JMRI WebServer is running (JMRI → Web → Start Web Server)
- Check hostname/IP address is correct
- Verify port 12080 is not blocked by firewall
- Try using IP address instead of hostname
- Ensure you're on the same network as JMRI

### Base Station Beeps / Throttle Acquisition Fails

**Problem**: Base station beeps when acquiring throttle, or "throttle already in use" error

**Cause**: A previous test may have crashed without releasing the throttle, leaving it registered in JMRI

**Solutions**:
1. Wait 30-60 seconds and try again (JMRI may auto-cleanup)
2. Restart JMRI to clear all throttles
3. In JMRI, manually release throttles via Tools → Throttles → Release All
4. Check JMRI console for specific error messages

**Prevention**: Always let tests complete fully, or use Ctrl+C to trigger emergency cleanup

### Locomotive Not Responding

**Problem**: Commands sent but locomotive doesn't move

**Solutions**:
- Verify track power is ON in JMRI
- Check locomotive address is correct
- Verify DCC system is connected and working
- Test locomotive manually in JMRI throttle first
- Check locomotive is on the track and making contact

### Timeout Errors

**Problem**: `Request timeout after 10000ms`

**Solutions**:
- Verify JMRI WebServer is responding (try accessing http://hostname:12080/json/ in browser)
- Check DCC system is responding in JMRI
- Ensure throttle with that address can be acquired in JMRI manually
- Look at JMRI console for error messages

### Power Won't Turn Off

**Problem**: Track power stays on after test

**Solutions**:
- Use JMRI's power button to turn off manually
- Check JMRI console for errors
- The library sends power-off command, but hardware may override
- Verify your DCC system respects power commands

## Emergency Stop

If the locomotive is running and you need to stop immediately:

1. **Press Ctrl+C** in the terminal running the test
2. **Use JMRI's STOP button** in the main window
3. **Use your DCC system's emergency stop** button
4. **Turn off track power** at the DCC command station

The test scripts will attempt to:
- Release the throttle
- Turn off track power
- Disconnect cleanly

But physical emergency stops are always faster and more reliable.

## Unit Tests

Run the Jest test suite (no hardware required):

```bash
npm test
```

These tests use mocks and don't require a JMRI instance.

## Continuous Integration

The unit tests run automatically on CI. Functional tests require physical hardware and must be run manually.

## Test Coverage

Check test coverage:

```bash
npm test -- --coverage
```

Current coverage: ~74% (unit tests only)

## Contributing Tests

When adding new features:
1. Add unit tests in `tests/unit/`
2. Update functional tests if the feature affects physical hardware
3. Document any new test scripts in this file
4. Ensure all tests include proper safety measures (power-off, etc.)
