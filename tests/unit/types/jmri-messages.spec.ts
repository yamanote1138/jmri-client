/**
 * Tests for JMRI message types and utilities
 */

import { PowerState, powerStateToString } from '../../../src/types/jmri-messages';

describe('PowerState', () => {
  it('should have correct enum values', () => {
    expect(PowerState.UNKNOWN).toBe(0);
    expect(PowerState.ON).toBe(2);
    expect(PowerState.OFF).toBe(4);
  });
});

describe('powerStateToString', () => {
  it('should convert ON to string', () => {
    expect(powerStateToString(PowerState.ON)).toBe('ON');
  });

  it('should convert OFF to string', () => {
    expect(powerStateToString(PowerState.OFF)).toBe('OFF');
  });

  it('should convert UNKNOWN to string', () => {
    expect(powerStateToString(PowerState.UNKNOWN)).toBe('UNKNOWN');
  });

  it('should return UNKNOWN for invalid values', () => {
    expect(powerStateToString(999 as PowerState)).toBe('UNKNOWN');
  });
});
