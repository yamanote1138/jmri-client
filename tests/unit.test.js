const assert = require('assert');
const JmriClient = require('../lib/jmriClient');

describe('JmriClient', function(){

  describe('constructor', function(){

    describe('host validation', function(){

      it('should throw error when host is not provided', function(){
        assert.throws(
          function(){
            new JmriClient();
          },
          Error
        );
      });

      it('should throw error when host is not valid', function(){
        assert.throws(
          function(){
            new JmriClient({host:123});
          },
          Error
        );
      });

      it('should not throw error when host is valid', function(){
        assert.doesNotThrow(
          function(){
            new JmriClient({host:'localhost'});
          },
          Error
        );
      });

    });

    describe('port validation', function(){

      it('should default to port 80 if no value is specified', function(){
        let jc = new JmriClient({host:'localhost'});
        assert(jc.config.port === 80);
      });

      it('should throw error when specified port is not valid', function(){
        assert.throws(
          function(){
            new JmriClient({host:'localhost', port:null});
          },
          Error
        );
        assert.throws(
          function(){
            new JmriClient({host:'localhost', port:'foo'});
          },
          Error
        );
        assert.throws(
          function(){
            new JmriClient({host:'localhost', port:70000});
          },
          Error
        );
      });

      it('should not throw error when port is valid', function(){
        assert.doesNotThrow(
          function(){
            new JmriClient({host:'localhost', port:1138});
          },
          Error
        );
      });

    });

    describe('path validation', function(){

      it('should default to \'/xmlio/\' if no path is specified', function(){
        let jc = new JmriClient({host:'localhost'});
        assert(jc.config.path === '/xmlio/');
      });

      it('should throw error when specified path is invalid', function(){
        assert.throws(
          function(){
            new JmriClient({host:'localhost', path:null});
          }
        );
        assert.throws(
          function(){
            new JmriClient({host:'localhost', path:1});
          }
        );
        assert.throws(
          function(){
            new JmriClient({host:'localhost', path:''});
          }
        );
      });

      it('should not throw error when specified path is valid', function(){
        assert.doesNotThrow(
          function(){
            new JmriClient({host:'localhost', path:'/crap'});
          }
        );
      });

    });

  });

});
