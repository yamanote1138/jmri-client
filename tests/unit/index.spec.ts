jest.mock("node-fetch");

import { JmriClient } from '../../src/index'

describe('Constructor', () => {
  describe('when well-formed parameters are given', () => {
    it('should not throw an error', () => {
      expect(() => {new JmriClient('http', '192.168.1.138', 'xmlio');}).not.toThrowError();
      expect(() => {new JmriClient('http', '192.168.1.138', 'xmlio', 1138);}).not.toThrowError();
    });
  });
  describe('when the host is empty', () => {
    it('should throw an error', () => {
      expect(() => {new JmriClient('http', '', 'xmlio');}).toThrow('host is empty');
      expect(() => {new JmriClient('http', '', 'xmlio', 1138);}).toThrow('host is empty');
    });
  });
  describe('when path is empty', () => {
    it('should throw an error', () => {
      expect(() => {new JmriClient('http', '192.168.1.138', '');}).toThrow('path is empty');
      expect(() => {new JmriClient('http', '192.168.1.138', '', 1138);}).toThrow('path is empty');
    });
  });
  describe('when port is out of range', () => {
    it('should throw an error', () => {
      expect(() => {new JmriClient('http', '192.168.1.138', 'xmlio', -1);}).toThrow('port is out of range');
      expect(() => {new JmriClient('http', '192.168.1.138', 'xmlio', 65536);}).toThrow('port is out of range');
    });
  });
});