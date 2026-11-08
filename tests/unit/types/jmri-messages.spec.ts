/**
 * Tests for JMRI message types and utilities
 */

import { PowerState, powerStateToString, SensorState, sensorStateToString } from '../../../src/types/jmri-messages';

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

describe('sensorStateToString', () => {
  it.each([
    [SensorState.ACTIVE, 'ACTIVE'],
    [SensorState.INACTIVE, 'INACTIVE'],
    [SensorState.INCONSISTENT, 'INCONSISTENT'],
    [SensorState.UNKNOWN, 'UNKNOWN']
  ])('should convert %d to %s', (state, label) => {
    expect(sensorStateToString(state)).toBe(label);
  });

  it('should fall back to UNKNOWN for unexpected values', () => {
    expect(sensorStateToString(99 as SensorState)).toBe('UNKNOWN');
  });
});
