import { calculateBackoffDelay, shouldReconnect } from '../../../src/utils/exponential-backoff';
import { ReconnectionOptions } from '../../../src/types/client-options';

describe('exponential-backoff', () => {
  describe('calculateBackoffDelay', () => {
    const baseOptions: ReconnectionOptions = {
      enabled: true,
      maxAttempts: 0,
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: false
    };

    it('should calculate exponential delays', () => {
      expect(calculateBackoffDelay(1, baseOptions)).toBe(1000);  // 1000 * 2^0
      expect(calculateBackoffDelay(2, baseOptions)).toBe(2000);  // 1000 * 2^1
      expect(calculateBackoffDelay(3, baseOptions)).toBe(4000);  // 1000 * 2^2
      expect(calculateBackoffDelay(4, baseOptions)).toBe(8000);  // 1000 * 2^3
      expect(calculateBackoffDelay(5, baseOptions)).toBe(16000); // 1000 * 2^4
    });

    it('should cap at maxDelay', () => {
      const delay = calculateBackoffDelay(10, baseOptions);
      expect(delay).toBeLessThanOrEqual(30000);
    });

    it('should use multiplier correctly', () => {
      const options = { ...baseOptions, multiplier: 1.5 };
      expect(calculateBackoffDelay(1, options)).toBe(1000);    // 1000 * 1.5^0
      expect(calculateBackoffDelay(2, options)).toBe(1500);    // 1000 * 1.5^1
      expect(calculateBackoffDelay(3, options)).toBe(2250);    // 1000 * 1.5^2
    });

    it('should add jitter when enabled', () => {
      const optionsWithJitter = { ...baseOptions, jitter: true };
      const delays = new Set<number>();

      // Generate multiple delays - they should vary due to jitter
      for (let i = 0; i < 10; i++) {
        const delay = calculateBackoffDelay(2, optionsWithJitter);
        delays.add(delay);

        // Should be within ±25% of 2000
        expect(delay).toBeGreaterThanOrEqual(1500);
        expect(delay).toBeLessThanOrEqual(2500);
      }

      // With 10 iterations, very likely to have at least 2 different values
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should not produce negative delays with jitter', () => {
      const optionsWithJitter = { ...baseOptions, jitter: true };
      for (let attempt = 1; attempt <= 10; attempt++) {
        const delay = calculateBackoffDelay(attempt, optionsWithJitter);
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('shouldReconnect', () => {
    it('should return true when maxAttempts is 0 (infinite)', () => {
      expect(shouldReconnect(1, 0)).toBe(true);
      expect(shouldReconnect(100, 0)).toBe(true);
      expect(shouldReconnect(1000, 0)).toBe(true);
    });

    it('should return true when attempt <= maxAttempts', () => {
      expect(shouldReconnect(1, 5)).toBe(true);
      expect(shouldReconnect(3, 5)).toBe(true);
      expect(shouldReconnect(5, 5)).toBe(true);
    });

    it('should return false when attempt > maxAttempts', () => {
      expect(shouldReconnect(6, 5)).toBe(false);
      expect(shouldReconnect(10, 5)).toBe(false);
    });

    it('should handle edge case of maxAttempts = 1', () => {
      expect(shouldReconnect(1, 1)).toBe(true);
      expect(shouldReconnect(2, 1)).toBe(false);
    });
  });
});
