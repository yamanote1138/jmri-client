/**
 * Client configuration options
 */

/**
 * Reconnection strategy options
 */
export interface ReconnectionOptions {
  /**
   * Enable automatic reconnection (default: true)
   */
  enabled: boolean;

  /**
   * Maximum number of reconnection attempts (0 = infinite, default: 0)
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds (default: 1000)
   */
  initialDelay: number;

  /**
   * Maximum delay in milliseconds (default: 30000)
   */
  maxDelay: number;

  /**
   * Backoff multiplier (default: 1.5)
   */
  multiplier: number;

  /**
   * Add jitter to prevent thundering herd (default: true)
   * Jitter is ±25% of calculated delay
   */
  jitter: boolean;
}

/**
 * Heartbeat (ping/pong) options
 */
export interface HeartbeatOptions {
  /**
   * Enable heartbeat (default: true)
   */
  enabled: boolean;

  /**
   * Interval between pings in milliseconds (default: 30000)
   */
  interval: number;

  /**
   * Timeout waiting for pong in milliseconds (default: 5000)
   */
  timeout: number;
}

/**
 * Mock mode options
 */
export interface MockOptions {
  /**
   * Enable mock mode (default: false)
   * When enabled, all responses are generated from mock data instead of a real JMRI server
   */
  enabled: boolean;

  /**
   * Delay in milliseconds before returning mock responses (default: 50)
   * Simulates network latency. Set to 0 for instant responses.
   */
  responseDelay: number;
}

/**
 * JMRI client configuration options
 */
export interface JmriClientOptions {
  /**
   * JMRI server hostname or IP address (default: 'localhost')
   */
  host: string;

  /**
   * JMRI server WebSocket port (default: 12080)
   */
  port: number;

  /**
   * WebSocket protocol (default: 'ws', use 'wss' for secure)
   */
  protocol: 'ws' | 'wss';

  /**
   * Automatically connect on instantiation (default: true)
   */
  autoConnect: boolean;

  /**
   * Reconnection strategy
   */
  reconnection: ReconnectionOptions;

  /**
   * Heartbeat/ping configuration
   */
  heartbeat: HeartbeatOptions;

  /**
   * Maximum number of messages to queue when disconnected (default: 100)
   */
  messageQueueSize: number;

  /**
   * Default timeout for request/response in milliseconds (default: 10000)
   */
  requestTimeout: number;

  /**
   * Mock mode configuration (default: disabled)
   * Use mock responses instead of a real JMRI server
   */
  mock: MockOptions;
}

/**
 * Default client options
 */
export const DEFAULT_CLIENT_OPTIONS: JmriClientOptions = {
  host: 'localhost',
  port: 12080,
  protocol: 'ws',
  autoConnect: true,
  reconnection: {
    enabled: true,
    maxAttempts: 0, // infinite
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 1.5,
    jitter: true
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  },
  messageQueueSize: 100,
  requestTimeout: 10000,
  mock: {
    enabled: false,
    responseDelay: 50
  }
};

/**
 * Partial client options for user input (all fields optional)
 */
export type PartialClientOptions = Partial<{
  host: string;
  port: number;
  protocol: 'ws' | 'wss';
  autoConnect: boolean;
  reconnection: Partial<ReconnectionOptions>;
  heartbeat: Partial<HeartbeatOptions>;
  messageQueueSize: number;
  requestTimeout: number;
  mock: Partial<MockOptions>;
}>;

/**
 * Merge user options with defaults
 */
export function mergeOptions(userOptions?: PartialClientOptions): JmriClientOptions {
  const options = { ...DEFAULT_CLIENT_OPTIONS };

  if (!userOptions) {
    return options;
  }

  if (userOptions.host !== undefined) options.host = userOptions.host;
  if (userOptions.port !== undefined) options.port = userOptions.port;
  if (userOptions.protocol !== undefined) options.protocol = userOptions.protocol;
  if (userOptions.autoConnect !== undefined) options.autoConnect = userOptions.autoConnect;
  if (userOptions.messageQueueSize !== undefined) options.messageQueueSize = userOptions.messageQueueSize;
  if (userOptions.requestTimeout !== undefined) options.requestTimeout = userOptions.requestTimeout;

  if (userOptions.reconnection) {
    options.reconnection = { ...DEFAULT_CLIENT_OPTIONS.reconnection, ...userOptions.reconnection };
  }

  if (userOptions.heartbeat) {
    options.heartbeat = { ...DEFAULT_CLIENT_OPTIONS.heartbeat, ...userOptions.heartbeat };
  }

  if (userOptions.mock) {
    options.mock = { ...DEFAULT_CLIENT_OPTIONS.mock, ...userOptions.mock };
  }

  return options;
}
