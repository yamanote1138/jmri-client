import { JmriClient } from '../../src/index'

describe('Constructor', () => {
  describe('when well-formed parameters are given', () => {
    it('should not throw an error', () => {
      expect(() => {new JmriClient('http', '192.168.1.138');}).not.toThrowError();
      expect(() => {new JmriClient('http', '192.168.1.138', 1138);}).not.toThrowError();
    });
  });
  describe('when the host is empty', () => {
    it('should throw an error', () => {
      expect(() => {new JmriClient('http', '');}).toThrow('host is empty');
      expect(() => {new JmriClient('http', '', 1138);}).toThrow('host is empty');
    });
  });
  describe('when port is out of range', () => {
    it('should throw an error', () => {
      expect(() => {new JmriClient('http', '192.168.1.138', -1);}).toThrow('port is out of range');
      expect(() => {new JmriClient('http', '192.168.1.138', 65536);}).toThrow('port is out of range');
    });
  });
});