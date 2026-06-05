/**
 * Throttle-specific types
 */

/**
 * Options for acquiring a throttle
 */
export interface ThrottleAcquireOptions {
  /**
   * DCC address of the locomotive
   */
  address: number;

  /**
   * Whether this is a long address (default: true for addresses > 127)
   */
  isLongAddress?: boolean;

  /**
   * JMRI connection prefix to target a specific hardware connection.
   * When omitted, routes to the default connection manager.
   * Use getSystemConnections() to discover available prefixes.
   */
  prefix?: string;
}

/**
 * Throttle function key (F0-F68)
 */
export type ThrottleFunctionKey =
  | 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9'
  | 'F10' | 'F11' | 'F12' | 'F13' | 'F14' | 'F15' | 'F16' | 'F17' | 'F18' | 'F19'
  | 'F20' | 'F21' | 'F22' | 'F23' | 'F24' | 'F25' | 'F26' | 'F27' | 'F28'
  | 'F29' | 'F30' | 'F31' | 'F32' | 'F33' | 'F34' | 'F35' | 'F36'
  | 'F37' | 'F38' | 'F39' | 'F40' | 'F41' | 'F42' | 'F43' | 'F44'
  | 'F45' | 'F46' | 'F47' | 'F48' | 'F49' | 'F50' | 'F51' | 'F52'
  | 'F53' | 'F54' | 'F55' | 'F56' | 'F57' | 'F58' | 'F59' | 'F60'
  | 'F61' | 'F62' | 'F63' | 'F64' | 'F65' | 'F66' | 'F67' | 'F68';

/**
 * Throttle state tracking
 */
export interface ThrottleState {
  /**
   * Throttle ID assigned by JMRI
   */
  id: string;

  /**
   * DCC address
   */
  address: number;

  /**
   * Current speed (0.0 to 1.0)
   */
  speed: number;

  /**
   * Direction (true = forward, false = reverse)
   */
  forward: boolean;

  /**
   * Function states (F0-F68)
   */
  functions: Map<ThrottleFunctionKey, boolean>;

  /**
   * Whether throttle is currently acquired
   */
  acquired: boolean;
}

/**
 * Validates that a value is a valid throttle function key
 */
export function isThrottleFunctionKey(key: string): key is ThrottleFunctionKey {
  return /^F([0-9]|[1-5][0-9]|6[0-8])$/.test(key);
}

/**
 * Validates that speed is in valid range (0.0 to 1.0)
 */
export function isValidSpeed(speed: number): boolean {
  return typeof speed === 'number' && speed >= 0 && speed <= 1;
}
