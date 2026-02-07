# Troubleshooting

## Connection Issues

### Cannot Connect to JMRI

**Symptoms:**
- `disconnected` event fires immediately
- Connection timeout errors
- `ECONNREFUSED` errors

**Solutions:**

1. **Ensure JMRI Web Server is running:**
   - In JMRI: **Tools → Start JMRI Web Server**
   - Default port is 12080
   - Check JMRI preferences under Web Server settings

2. **Check firewall settings:**
   - Allow incoming connections on port 12080
   - On macOS: System Preferences → Security & Privacy → Firewall
   - On Windows: Windows Defender Firewall → Allow an app

3. **Verify host and port:**
   ```typescript
   const client = new JmriClient({
     host: 'localhost',  // Try 'localhost' instead of hostname
     port: 12080
   });
   ```

4. **Test connectivity:**
   ```bash
   # Check if JMRI is listening
   telnet localhost 12080
   # Or with curl
   curl http://localhost:12080/json/
   ```

### Connection Drops Frequently

**Symptoms:**
- Frequent `disconnected` and `reconnecting` events
- Operations fail intermittently

**Solutions:**

1. **Check network stability:**
   - Ensure stable WiFi/Ethernet connection
   - Try wired connection instead of WiFi

2. **Adjust heartbeat settings:**
   ```typescript
   const client = new JmriClient({
     host: 'jmri.local',
     heartbeat: {
       enabled: true,
       interval: 10000,  // More frequent pings
       timeout: 3000
     }
   });
   ```

3. **Increase reconnection attempts:**
   ```typescript
   const client = new JmriClient({
     host: 'jmri.local',
     reconnection: {
       enabled: true,
       maxAttempts: 0,  // Infinite attempts
       initialDelay: 500,
       maxDelay: 5000
     }
   });
   ```

## Throttle Issues

### Throttle Not Responding

**Symptoms:**
- Commands sent but locomotive doesn't move
- No error messages

**Solutions:**

1. **Verify track power is ON:**
   ```typescript
   await client.powerOn();
   const state = await client.getPower();
   console.log('Power:', state);
   ```

2. **Check DCC address:**
   ```typescript
   // Ensure correct address
   const throttle = await client.acquireThrottle({ address: 3 });

   // For long addresses (>127), explicitly set:
   const throttle = await client.acquireThrottle({
     address: 3985,
     isLongAddress: true
   });
   ```

3. **Verify locomotive is on the track:**
   - Check physical connection
   - Test with JMRI DecoderPro first

4. **Check for address conflicts:**
   - Only one throttle per address at a time
   - Release previous throttle before acquiring again

### Throttle Commands Delayed

**Symptoms:**
- Significant delay between command and action
- Commands seem to queue up

**Solutions:**

1. **Reduce request timeout:**
   ```typescript
   const client = new JmriClient({
     host: 'jmri.local',
     requestTimeout: 3000  // Reduce from default 10s
   });
   ```

2. **Check JMRI CPU usage:**
   - High CPU usage in JMRI can cause delays
   - Close unnecessary JMRI windows
   - Reduce JMRI logging

3. **Limit concurrent operations:**
   ```typescript
   // Wait for each operation to complete
   await client.setThrottleSpeed(throttle, 0.5);
   await new Promise(resolve => setTimeout(resolve, 100));
   await client.setThrottleDirection(throttle, true);
   ```

### Throttle Lost on Reconnect

**Symptoms:**
- `throttle:lost` event fires after reconnection
- Throttle ID no longer valid

**Explanation:**
- JMRI releases all throttles when client disconnects
- This is expected behavior

**Solution:**
```typescript
client.on('throttle:lost', async (throttleId) => {
  console.log(`Throttle ${throttleId} was lost`);
  // Re-acquire if needed
});

client.on('reconnected', async () => {
  // Re-acquire throttles after reconnection
  const throttle = await client.acquireThrottle({ address: 3 });
  // Restore state...
});
```

## Power Control Issues

### Power State Not Updating

**Symptoms:**
- `getPower()` returns stale data
- `power:changed` events not firing

**Solutions:**

1. **Use event listener for real-time updates:**
   ```typescript
   client.on('power:changed', (state) => {
     console.log('Power changed:', state);
   });
   ```

2. **Force refresh:**
   ```typescript
   // getPower() always fetches from JMRI
   const state = await client.getPower();
   ```

## Roster Issues

### Empty Roster

**Symptoms:**
- `getRoster()` returns empty array
- Expected locomotives not found

**Solutions:**

1. **Check JMRI roster:**
   - Open JMRI DecoderPro
   - Verify roster entries exist
   - Ensure roster is saved

2. **Verify JMRI Web Server settings:**
   - Check that roster is accessible via web interface
   - Visit `http://localhost:12080/roster` in browser

3. **Clear cache and retry:**
   ```typescript
   // RosterManager caches entries
   // Create new client to force refresh
   ```

## Performance Issues

### High Memory Usage

**Solutions:**

1. **Limit message queue size:**
   ```typescript
   const client = new JmriClient({
     host: 'jmri.local',
     messageQueueSize: 50  // Reduce from default 100
   });
   ```

2. **Remove event listeners when done:**
   ```typescript
   const handler = (state) => console.log(state);
   client.on('power:changed', handler);

   // Later...
   client.off('power:changed', handler);
   ```

3. **Disconnect when not in use:**
   ```typescript
   await client.disconnect();
   ```

### Slow Operations

**Solutions:**

1. **Check network latency:**
   ```bash
   ping jmri.local
   ```

2. **Reduce timeout for faster failures:**
   ```typescript
   const client = new JmriClient({
     host: 'jmri.local',
     requestTimeout: 5000
   });
   ```

3. **Use events instead of polling:**
   ```typescript
   // DON'T do this:
   setInterval(async () => {
     const power = await client.getPower();
   }, 1000);

   // DO this instead:
   client.on('power:changed', (state) => {
     // Handle change
   });
   ```

## Debugging

### Enable Debug Logging

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

// Log all messages
client.on('message:sent', (msg) => {
  console.log('→ Sent:', JSON.stringify(msg, null, 2));
});

client.on('message:received', (msg) => {
  console.log('← Received:', JSON.stringify(msg, null, 2));
});

// Log all errors
client.on('error', (error) => {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
});

// Log connection state changes
client.on('connectionStateChanged', (state) => {
  console.log('State:', state);
});
```

### Check JMRI Logs

JMRI logs can provide additional context:
- Location: JMRI preferences → Locations → User Files → Logs
- Look for WebSocket-related errors
- Check for throttle allocation failures

## Common Error Messages

### "Request timeout after 10000ms"

**Cause:** JMRI didn't respond within timeout period

**Solutions:**
- Check JMRI is running and responsive
- Increase `requestTimeout` option
- Check network connectivity

### "Throttle not found"

**Cause:** Trying to control a throttle that wasn't acquired or was released

**Solutions:**
- Ensure `acquireThrottle()` succeeded
- Store throttle ID correctly
- Don't use throttle after `releaseThrottle()`

### "Invalid speed: X. Must be between 0.0 and 1.0"

**Cause:** Speed value out of valid range

**Solution:**
```typescript
// Speed must be between 0.0 and 1.0
await client.setThrottleSpeed(throttle, 0.5);  // ✓ Correct
await client.setThrottleSpeed(throttle, 50);   // ✗ Wrong
```

### "Invalid function key: F29"

**Cause:** Function key out of valid range (F0-F28)

**Solution:**
```typescript
// Only F0-F28 are valid
await client.setThrottleFunction(throttle, 'F0', true);   // ✓ Correct
await client.setThrottleFunction(throttle, 'F29', true);  // ✗ Wrong
```

## Still Having Issues?

1. **Check the examples:** [docs/EXAMPLES.md](./EXAMPLES.md)
2. **Review the API:** [docs/API.md](./API.md)
3. **Open an issue:** [GitHub Issues](https://github.com/yamanote1138/jmri-client/issues)

When reporting issues, please include:
- Node.js version (`node --version`)
- jmri-client version
- JMRI version
- Minimal code example that reproduces the issue
- Error messages and stack traces
- Debug logs (if applicable)
