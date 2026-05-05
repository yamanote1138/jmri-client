/**
 * Static mock response templates for non-configurable protocol messages.
 * Configurable data (server info, roster, lights, turnouts) lives in MockConfig.
 */

export const mockData = {
  throttle: {
    release: {
      type: 'throttle',
      data: {}
    },
    control: {
      type: 'throttle',
      data: {}
    }
  },
  ping: { type: 'ping' },
  pong: { type: 'pong' },
  goodbye: { type: 'goodbye' },
  error: {
    throttleNotFound: {
      type: 'error',
      data: { code: 404, message: 'Throttle not found' }
    },
    invalidSpeed: {
      type: 'error',
      data: { code: 400, message: 'Invalid speed value' }
    },
    connectionError: {
      type: 'error',
      data: { code: 500, message: 'Connection error' }
    }
  }
} as const;
