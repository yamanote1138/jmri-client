# Reconnection Flow Analysis

## Expected Flow

### Initial Connection Succeeds
1. `connect()` called
2. State: DISCONNECTED → CONNECTING
3. WebSocket created
4. Connection succeeds
5. State: CONNECTING → CONNECTED
6. ✅ Initial connection working

### Connection Drops (code 1006)
1. WebSocket closes
2. Close handler fires, state is CONNECTED
3. Goes to `else` branch, calls `handleClose(code, reason)`
4. In `handleClose()`:
   - `wasConnected = true` (state is CONNECTED)
   - `isReconnecting = false` (not reconnecting yet)
   - State: CONNECTED → DISCONNECTED
   - Emits 'disconnected'
   - Condition: `!isManualDisconnect && (wasConnected || isReconnecting) && enabled`
     - `false && (true || false) && true` = **TRUE**
   - State: DISCONNECTED → RECONNECTING (via `forceState`)
   - Calls `reconnectionManager.start(() => this.connect())`
5. ReconnectionManager starts, schedules first retry

### First Reconnection Attempt
1. Timer fires
2. Calls `await reconnect()` (which is `() => this.connect()`)
3. In `connect()`:
   - Guard: `isConnected() || isConnecting()`?
   - State is RECONNECTING
   - `isConnected()` = `state === CONNECTED` = false
   - `isConnecting()` = `state === CONNECTING` = false
   - **Guard passes** ✅
   - State: RECONNECTING → CONNECTING
   - Creates new WebSocket (**should happen!**)
4. WebSocket fails immediately
5. Close event fires, state is CONNECTING
6. Goes to `if` branch (v3.1.3+):
   - State: CONNECTING → DISCONNECTED
   - Rejects Promise
   - Calls `handleClose(code, reason)`
7. In `handleClose()`:
   - `wasConnected = false` (state is DISCONNECTED now)
   - `isReconnecting = true` (reconnectionManager is active!)
   - State: DISCONNECTED → DISCONNECTED (no-op)
   - Emits 'disconnected'
   - Condition: `!isManualDisconnect && (wasConnected || isReconnecting) && enabled`
     - `false && (false || true) && true` = **TRUE**
   - State: DISCONNECTED → RECONNECTING (via `forceState`)
   - Calls `reconnectionManager.start(() => this.connect())`
     - **Returns early!** Already reconnecting (line 28-30)
8. Promise rejects, reconnectionManager catches it
9. In reconnectionManager catch block:
   - Emits 'failed'
   - Calls `scheduleNextAttempt(reconnect)` (**This should schedule attempt #2!**)

### Second Reconnection Attempt
1. Timer fires again
2. Calls `await reconnect()` (which is `() => this.connect()`)
3. **Same as First Reconnection Attempt**

## The Mystery

Based on this analysis, reconnection **SHOULD** work! Each failed attempt:
- Rejects the Promise
- reconnectionManager catches it
- Schedules the next attempt
- Next attempt calls `connect()` which should create a new WebSocket

## Possible Issues

### 1. Guard Clause False Positive?
Maybe `isConnecting()` is returning true even when state is RECONNECTING?

**Check**: `ConnectionStateManager.isConnecting()` implementation

### 2. Promise Never Rejects?
Maybe the Promise from `connect()` isn't actually rejecting, so reconnectionManager never catches the error?

**Check**: Close handler is definitely calling `reject(error)`

### 3. Event Handler Not Firing?
Maybe the close event handler isn't being attached before the WebSocket fails?

**Check**: In browser, WebSocket errors might fire synchronously before event handlers are attached

### 4. ReconnectionManager Not Scheduling?
Maybe `scheduleNextAttempt()` has a bug?

**Check**: reconnection-manager.ts line 40-70

### 5. Multiple Event Handlers?
Maybe we're setting up event handlers multiple times and they conflict?

**Check**: Each `connect()` creates a new WebSocket and new event handlers

### 6. State Race Condition?
Maybe there's a race between state transitions?

**Check**: All state transitions should be synchronous

## Next Steps

1. **Run the browser test** (`npm run test:browser`) to see actual behavior
2. **Check if `connect()` is even being called** during reconnection attempts
3. **Verify WebSocket creation** with the monkey-patched constructor
4. **Add event listeners** to reconnectionManager events to trace exact flow
5. **Check state at each step** to see if it matches expectations

## Critical Questions

1. Is `connect()` being called during reconnection attempts?
2. If yes, does it pass the guard clause?
3. If yes, is a new WebSocket being created?
4. If no WebSocket is created, where does execution stop?

---

## ROOT CAUSE FOUND! ✅

### The Bug

In `connection-state-manager.ts`, the `VALID_TRANSITIONS` map did not allow transitioning from `RECONNECTING` to `CONNECTING`:

```typescript
[ConnectionState.RECONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED]
// Missing: ConnectionState.CONNECTING!
```

### What Was Happening

1. Initial connection succeeds (DISCONNECTED → CONNECTING → CONNECTED) ✅
2. Connection drops, `handleClose()` called
3. `handleClose()` calls `forceState(RECONNECTING)` ✅
4. ReconnectionManager schedules retry, calls `connect()` ✅
5. `connect()` tries to do `transition(CONNECTING)` ❌
6. **StateManager throws error**: `Invalid state transition: reconnecting -> connecting`
7. Error is caught by ReconnectionManager, treated as connection failure
8. ReconnectionManager schedules next retry (creates infinite loop)
9. **No WebSocket is ever created!**

### The Fix

Add `CONNECTING` as a valid transition from `RECONNECTING`:

```typescript
[ConnectionState.RECONNECTING]: [
  ConnectionState.CONNECTING,  // ← Added this!
  ConnectionState.CONNECTED,
  ConnectionState.DISCONNECTED
]
```

Now reconnection attempts can properly transition:
`RECONNECTING → CONNECTING → (success) CONNECTED` or `(failure) DISCONNECTED`

### Why This Wasn't Caught

1. **No error visibility**: The transition error was silently caught by ReconnectionManager's try/catch
2. **Events still fired**: ReconnectionManager still emitted 'reconnecting' events even though connect() was throwing
3. **No integration tests**: Unit tests didn't cover the full reconnection flow with state transitions
4. **Debug logs didn't show**: Console.logs in `connect()` were after the throwing line

### Lessons Learned

1. **State machine bugs are subtle**: Invalid transitions can cause silent failures
2. **Need integration tests**: Unit tests passed but integration flow failed
3. **Better error handling**: Should log state transition errors even when caught
4. **Test in target environment**: Browser behavior differs from Node.js
