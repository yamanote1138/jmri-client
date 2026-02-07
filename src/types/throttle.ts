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
}

/**
 * Throttle function key (F0-F28)
 */
export type ThrottleFunctionKey =
  | 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9'
  | 'F10' | 'F11' | 'F12' | 'F13' | 'F14' | 'F15' | 'F16' | 'F17' | 'F18' | 'F19'
  | 'F20' | 'F21' | 'F22' | 'F23' | 'F24' | 'F25' | 'F26' | 'F27' | 'F28';

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
   * Function states (F0-F28)
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
  return /^F([0-9]|1[0-9]|2[0-8])$/.test(key);
}

/**
 * Validates that speed is in valid range (0.0 to 1.0)
 */
export function isValidSpeed(speed: number): boolean {
  return typeof speed === 'number' && speed >= 0 && speed <= 1;
}
