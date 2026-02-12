/**
 * Mock data for JMRI responses
 * Used for testing and demo mode
 */

export const mockData = {
  "hello": {
    "type": "hello",
    "data": {
      "JMRI": "5.9.2",
      "json": "5.0",
      "version": "v5",
      "heartbeat": 13500,
      "railroad": "Demo Railroad",
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
    "list": [
      {
        "type": "rosterEntry",
        "data": {
          "name": "CSX754",
          "address": "754",
          "isLongAddress": true,
          "road": "CSX",
          "number": "754",
          "mfg": "Athearn",
          "decoderModel": "DH163D",
          "decoderFamily": "Digitrax DH163",
          "model": "GP38-2",
          "comment": "Blue and yellow scheme",
          "maxSpeedPct": 100,
          "image": null,
          "icon": "/roster/CSX754/icon",
          "shuntingFunction": "",
          "owner": "",
          "dateModified": "2026-02-10T00:00:00.000+00:00",
          "functionKeys": [
            { "name": "F0", "label": "Headlight", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F1", "label": "Bell", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F2", "label": "Horn", "lockable": false, "icon": null, "selectedIcon": null },
            { "name": "F3", "label": null, "lockable": false, "icon": null, "selectedIcon": null },
            { "name": "F4", "label": "Dynamic Brake", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F5", "label": null, "lockable": false, "icon": null, "selectedIcon": null }
          ],
          "attributes": [],
          "rosterGroups": []
        },
        "id": 1
      },
      {
        "type": "rosterEntry",
        "data": {
          "name": "UP3985",
          "address": "3985",
          "isLongAddress": true,
          "road": "Union Pacific",
          "number": "3985",
          "mfg": "Rivarossi",
          "decoderModel": "Sound decoder",
          "decoderFamily": "ESU LokSound",
          "model": "Challenger 4-6-6-4",
          "comment": "Steam locomotive",
          "maxSpeedPct": 100,
          "image": null,
          "icon": "/roster/UP3985/icon",
          "shuntingFunction": "",
          "owner": "",
          "dateModified": "2026-02-10T00:00:00.000+00:00",
          "functionKeys": [
            { "name": "F0", "label": "Headlight", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F1", "label": "Bell", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F2", "label": "Whistle", "lockable": false, "icon": null, "selectedIcon": null },
            { "name": "F3", "label": "Steam", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F4", "label": null, "lockable": false, "icon": null, "selectedIcon": null }
          ],
          "attributes": [],
          "rosterGroups": []
        },
        "id": 2
      },
      {
        "type": "rosterEntry",
        "data": {
          "name": "BNSF5240",
          "address": "5240",
          "isLongAddress": true,
          "road": "BNSF",
          "number": "5240",
          "mfg": "Kato",
          "decoderModel": "DCC Sound",
          "decoderFamily": "Kato",
          "model": "SD40-2",
          "comment": "Heritage II paint",
          "maxSpeedPct": 100,
          "image": null,
          "icon": "/roster/BNSF5240/icon",
          "shuntingFunction": "",
          "owner": "",
          "dateModified": "2026-02-10T00:00:00.000+00:00",
          "functionKeys": [
            { "name": "F0", "label": "Headlight", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F1", "label": "Bell", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F2", "label": "Horn", "lockable": false, "icon": null, "selectedIcon": null },
            { "name": "F3", "label": "Dynamic Brake", "lockable": true, "icon": null, "selectedIcon": null },
            { "name": "F4", "label": null, "lockable": false, "icon": null, "selectedIcon": null },
            { "name": "F5", "label": "Mars Light", "lockable": true, "icon": null, "selectedIcon": null }
          ],
          "attributes": [],
          "rosterGroups": []
        },
        "id": 3
      }
    ]
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
