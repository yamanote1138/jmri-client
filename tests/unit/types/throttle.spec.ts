import { isThrottleFunctionKey, isValidSpeed } from '../../../src/types/throttle';

describe('throttle types', () => {
  describe('isThrottleFunctionKey', () => {
    it('should return true for valid function keys F0-F28', () => {
      expect(isThrottleFunctionKey('F0')).toBe(true);
      expect(isThrottleFunctionKey('F1')).toBe(true);
      expect(isThrottleFunctionKey('F10')).toBe(true);
      expect(isThrottleFunctionKey('F20')).toBe(true);
      expect(isThrottleFunctionKey('F28')).toBe(true);
    });

    it('should return false for invalid function keys', () => {
      expect(isThrottleFunctionKey('F29')).toBe(false);
      expect(isThrottleFunctionKey('F30')).toBe(false);
      expect(isThrottleFunctionKey('F-1')).toBe(false);
      expect(isThrottleFunctionKey('F')).toBe(false);
      expect(isThrottleFunctionKey('G0')).toBe(false);
      expect(isThrottleFunctionKey('f0')).toBe(false); // lowercase
      expect(isThrottleFunctionKey('')).toBe(false);
      expect(isThrottleFunctionKey('0')).toBe(false);
    });
  });

  describe('isValidSpeed', () => {
    it('should return true for valid speeds (0.0 to 1.0)', () => {
      expect(isValidSpeed(0)).toBe(true);
      expect(isValidSpeed(0.0)).toBe(true);
      expect(isValidSpeed(0.25)).toBe(true);
      expect(isValidSpeed(0.5)).toBe(true);
      expect(isValidSpeed(0.75)).toBe(true);
      expect(isValidSpeed(1.0)).toBe(true);
      expect(isValidSpeed(1)).toBe(true);
    });

    it('should return false for speeds outside range', () => {
      expect(isValidSpeed(-0.1)).toBe(false);
      expect(isValidSpeed(-1)).toBe(false);
      expect(isValidSpeed(1.1)).toBe(false);
      expect(isValidSpeed(2)).toBe(false);
      expect(isValidSpeed(100)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(isValidSpeed(NaN)).toBe(false);
      expect(isValidSpeed('0.5' as any)).toBe(false);
      expect(isValidSpeed(null as any)).toBe(false);
      expect(isValidSpeed(undefined as any)).toBe(false);
    });
  });
});
