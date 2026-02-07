/**
 * Main JMRI client class
 */

import { EventEmitter } from 'events';
import { WebSocketClient } from './core/websocket-client.js';
import { PowerManager } from './managers/power-manager.js';
import { RosterManager } from './managers/roster-manager.js';
import { ThrottleManager } from './managers/throttle-manager.js';
import { JmriClientOptions, PartialClientOptions, mergeOptions } from './types/client-options.js';
import { PowerState, RosterEntry } from './types/jmri-messages.js';
import { ConnectionState } from './types/events.js';
import { ThrottleAcquireOptions, ThrottleFunctionKey, ThrottleState } from './types/throttle.js';

/**
 * JMRI WebSocket Client
 * Provides event-driven interface to JMRI with throttle control
 */
export class JmriClient extends EventEmitter {
  private options: JmriClientOptions;
  private wsClient: WebSocketClient;
  private powerManager: PowerManager;
  private rosterManager: RosterManager;
  private throttleManager: ThrottleManager;

  /**
   * Create a new JMRI client
   *
   * @param options - Client configuration options
   *
   * @example
   * ```typescript
   * const client = new JmriClient({
   *   host: 'jmri.local',
   *   port: 12080
   * });
   *
   * client.on('connected', () => console.log('Connected!'));
   * client.on('power:changed', (state) => console.log('Power:', state));
   * ```
   */
  constructor(options?: PartialClientOptions) {
    super();

    // Merge options with defaults
    this.options = mergeOptions(options);

    // Create WebSocket client
    this.wsClient = new WebSocketClient(this.options);

    // Create managers
    this.powerManager = new PowerManager(this.wsClient);
    this.rosterManager = new RosterManager(this.wsClient);
    this.throttleManager = new ThrottleManager(this.wsClient);

    // Forward events from WebSocket client
    this.wsClient.on('connected', () => this.emit('connected'));
    this.wsClient.on('disconnected', (reason: string) => this.emit('disconnected', reason));
    this.wsClient.on('reconnecting', (attempt: number, delay: number) =>
      this.emit('reconnecting', attempt, delay)
    );
    this.wsClient.on('reconnected', () => this.emit('reconnected'));
    this.wsClient.on('reconnectionFailed', (attempts: number) =>
      this.emit('reconnectionFailed', attempts)
    );
    this.wsClient.on('connectionStateChanged', (state: ConnectionState) =>
      this.emit('connectionStateChanged', state)
    );
    this.wsClient.on('error', (error: Error) => this.emit('error', error));
    this.wsClient.on('heartbeat:sent', () => this.emit('heartbeat:sent'));
    this.wsClient.on('heartbeat:timeout', () => this.emit('heartbeat:timeout'));
    this.wsClient.on('debug', (message: string) => this.emit('debug', message));

    // Forward events from managers
    this.powerManager.on('power:changed', (state: PowerState) =>
      this.emit('power:changed', state)
    );
    this.throttleManager.on('throttle:acquired', (id: string) =>
      this.emit('throttle:acquired', id)
    );
    this.throttleManager.on('throttle:updated', (id: string, data: any) =>
      this.emit('throttle:updated', id, data)
    );
    this.throttleManager.on('throttle:released', (id: string) =>
      this.emit('throttle:released', id)
    );
    this.throttleManager.on('throttle:lost', (id: string) =>
      this.emit('throttle:lost', id)
    );

    // Auto-connect if enabled
    if (this.options.autoConnect) {
      this.connect().catch((error) => {
        this.emit('error', error);
      });
    }
  }

  /**
   * Connect to JMRI server
   */
  async connect(): Promise<void> {
    return this.wsClient.connect();
  }

  /**
   * Disconnect from JMRI server
   * Releases all throttles and closes connection
   */
  async disconnect(): Promise<void> {
    // Release all throttles first
    await this.throttleManager.releaseAllThrottles();

    // Disconnect WebSocket
    return this.wsClient.disconnect();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.wsClient.getState();
  }

  /**
   * Check if connected to JMRI
   */
  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  // ============================================================================
  // Power Control
  // ============================================================================

  /**
   * Get current track power state
   */
  async getPower(): Promise<PowerState> {
    return this.powerManager.getPower();
  }

  /**
   * Set track power state
   */
  async setPower(state: PowerState): Promise<void> {
    return this.powerManager.setPower(state);
  }

  /**
   * Turn track power on
   */
  async powerOn(): Promise<void> {
    return this.powerManager.powerOn();
  }

  /**
   * Turn track power off
   */
  async powerOff(): Promise<void> {
    return this.powerManager.powerOff();
  }

  // ============================================================================
  // Roster Management
  // ============================================================================

  /**
   * Get all roster entries
   */
  async getRoster(): Promise<RosterEntry[]> {
    return this.rosterManager.getRoster();
  }

  /**
   * Get roster entry by name
   */
  async getRosterEntryByName(name: string): Promise<RosterEntry | undefined> {
    return this.rosterManager.getRosterEntryByName(name);
  }

  /**
   * Get roster entry by address
   */
  async getRosterEntryByAddress(address: string | number): Promise<RosterEntry | undefined> {
    return this.rosterManager.getRosterEntryByAddress(address);
  }

  /**
   * Search roster by partial name match
   */
  async searchRoster(query: string): Promise<RosterEntry[]> {
    return this.rosterManager.searchRoster(query);
  }

  // ============================================================================
  // Throttle Control
  // ============================================================================

  /**
   * Acquire a throttle for a locomotive
   *
   * @param options - Throttle acquisition options
   * @returns Throttle ID for use in other throttle methods
   *
   * @example
   * ```typescript
   * const throttleId = await client.acquireThrottle({ address: 3 });
   * await client.setThrottleSpeed(throttleId, 0.5); // Half speed
   * ```
   */
  async acquireThrottle(options: ThrottleAcquireOptions): Promise<string> {
    return this.throttleManager.acquireThrottle(options);
  }

  /**
   * Release a throttle
   */
  async releaseThrottle(throttleId: string): Promise<void> {
    return this.throttleManager.releaseThrottle(throttleId);
  }

  /**
   * Set throttle speed (0.0 to 1.0)
   *
   * @param throttleId - Throttle ID from acquireThrottle
   * @param speed - Speed value between 0.0 (stopped) and 1.0 (full speed)
   */
  async setThrottleSpeed(throttleId: string, speed: number): Promise<void> {
    return this.throttleManager.setSpeed(throttleId, speed);
  }

  /**
   * Set throttle direction
   *
   * @param throttleId - Throttle ID from acquireThrottle
   * @param forward - True for forward, false for reverse
   */
  async setThrottleDirection(throttleId: string, forward: boolean): Promise<void> {
    return this.throttleManager.setDirection(throttleId, forward);
  }

  /**
   * Set throttle function (F0-F28)
   *
   * @param throttleId - Throttle ID from acquireThrottle
   * @param functionKey - Function key (F0-F28)
   * @param value - True to activate, false to deactivate
   *
   * @example
   * ```typescript
   * await client.setThrottleFunction(throttleId, 'F0', true);  // Headlight on
   * await client.setThrottleFunction(throttleId, 'F2', true);  // Horn
   * ```
   */
  async setThrottleFunction(
    throttleId: string,
    functionKey: ThrottleFunctionKey,
    value: boolean
  ): Promise<void> {
    return this.throttleManager.setFunction(throttleId, functionKey, value);
  }

  /**
   * Emergency stop for a throttle (speed to 0)
   */
  async emergencyStop(throttleId: string): Promise<void> {
    return this.throttleManager.emergencyStop(throttleId);
  }

  /**
   * Set throttle to idle (speed to 0, maintain direction)
   */
  async idleThrottle(throttleId: string): Promise<void> {
    return this.throttleManager.idle(throttleId);
  }

  /**
   * Get throttle state
   */
  getThrottleState(throttleId: string): ThrottleState | undefined {
    return this.throttleManager.getThrottleState(throttleId);
  }

  /**
   * Get all throttle IDs
   */
  getThrottleIds(): string[] {
    return this.throttleManager.getThrottleIds();
  }

  /**
   * Get all throttle states
   */
  getAllThrottles(): ThrottleState[] {
    return this.throttleManager.getAllThrottles();
  }

  /**
   * Release all throttles
   */
  async releaseAllThrottles(): Promise<void> {
    return this.throttleManager.releaseAllThrottles();
  }
}
