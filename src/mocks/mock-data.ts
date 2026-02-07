/**
 * Mock data for JMRI responses
 * Used for testing and demo mode
 */

export const mockData = {
  "hello": {
    "type": "hello",
    "data": {
      "JMRI": "5.9.2",
      "JSON": "5.0",
      "Railroad": "Demo Railroad",
      "node": "jmri-server",
      "activeProfile": "Demo Profile"
    }
  },
  "power": {
    "get": {
      "on": {
        "type": "power",
        "data": {
          "state": 2
        }
      },
      "off": {
        "type": "power",
        "data": {
          "state": 4
        }
      }
    },
    "post": {
      "success": {
        "type": "power",
        "data": {
          "state": 2
        }
      }
    }
  },
  "roster": {
    "list": {
      "type": "roster",
      "data": {
        "CSX754": {
          "name": "CSX754",
          "address": "754",
          "isLongAddress": true,
          "road": "CSX",
          "number": "754",
          "mfg": "Athearn",
          "model": "GP38-2",
          "comment": "Blue and yellow scheme",
          "maxSpeed": 126,
          "functionKeys": {
            "F0": "Headlight",
            "F1": "Bell",
            "F2": "Horn",
            "F3": "Air Release",
            "F4": "Dynamic Brake"
          }
        },
        "UP3985": {
          "name": "UP3985",
          "address": "3985",
          "isLongAddress": true,
          "road": "Union Pacific",
          "number": "3985",
          "mfg": "Rivarossi",
          "model": "Challenger 4-6-6-4",
          "comment": "Steam locomotive",
          "maxSpeed": 126,
          "functionKeys": {
            "F0": "Headlight",
            "F1": "Bell",
            "F2": "Whistle",
            "F3": "Steam",
            "F4": "Coupler"
          }
        },
        "BNSF5240": {
          "name": "BNSF5240",
          "address": "5240",
          "isLongAddress": true,
          "road": "BNSF",
          "number": "5240",
          "mfg": "Kato",
          "model": "SD40-2",
          "comment": "Heritage II paint",
          "maxSpeed": 126,
          "functionKeys": {
            "F0": "Headlight",
            "F1": "Bell",
            "F2": "Horn",
            "F3": "Dynamic Brake",
            "F4": "Mars Light"
          }
        }
      }
    }
  },
  "throttle": {
    "acquire": {
      "success": {
        "type": "throttle",
        "data": {
          "throttle": "{THROTTLE_ID}",
          "address": "{ADDRESS}",
          "speed": 0,
          "forward": true,
          "F0": false,
          "F1": false,
          "F2": false,
          "F3": false,
          "F4": false
        }
      }
    },
    "release": {
      "success": {
        "type": "throttle",
        "data": {}
      }
    },
    "control": {
      "speed": {
        "type": "throttle",
        "data": {
          "throttle": "{THROTTLE_ID}",
          "speed": "{SPEED}"
        }
      },
      "direction": {
        "type": "throttle",
        "data": {
          "throttle": "{THROTTLE_ID}",
          "forward": "{FORWARD}"
        }
      },
      "function": {
        "type": "throttle",
        "data": {
          "throttle": "{THROTTLE_ID}",
          "{FUNCTION}": "{VALUE}"
        }
      }
    }
  },
  "ping": {
    "type": "ping"
  },
  "pong": {
    "type": "pong"
  },
  "goodbye": {
    "type": "goodbye"
  },
  "error": {
    "throttleNotFound": {
      "type": "error",
      "data": {
        "code": 404,
        "message": "Throttle not found"
      }
    },
    "invalidSpeed": {
      "type": "error",
      "data": {
        "code": 400,
        "message": "Invalid speed value"
      }
    },
    "connectionError": {
      "type": "error",
      "data": {
        "code": 500,
        "message": "Connection error"
      }
    }
  }
} as const;
