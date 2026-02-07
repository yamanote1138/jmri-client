/**
 * Exponential backoff calculator with jitter
 */

import { ReconnectionOptions } from '../types/client-options.js';

/**
 * Calculate next reconnection delay using exponential backoff
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param options - Reconnection options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  options: ReconnectionOptions
): number {
  // Base delay calculation: initialDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = options.initialDelay * Math.pow(options.multiplier, attempt - 1);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

  // Add jitter if enabled (±25%)
  if (options.jitter) {
    const jitterAmount = cappedDelay * 0.25;
    const jitter = (Math.random() * 2 - 1) * jitterAmount; // Random between -25% and +25%
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  return Math.round(cappedDelay);
}

/**
 * Check if should attempt reconnection
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param maxAttempts - Maximum attempts (0 = infinite)
 * @returns True if should attempt reconnection
 */
export function shouldReconnect(attempt: number, maxAttempts: number): boolean {
  if (maxAttempts === 0) {
    return true; // Infinite attempts
  }
  return attempt <= maxAttempts;
}
