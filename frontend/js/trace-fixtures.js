// =====================================================
// ALGOLAB - trace-fixtures.js
// Pre-recorded JDI trace fixtures for Code Lab
// Conforms to docs/TRACE_SCHEMA.md
//
// NOTE: These fixtures are pre-recorded test fixtures
// for evaluating the client-side playback engine.
// They are NOT live executions of student code.
// =====================================================

export const BUBBLE_SORT_TRACE_FIXTURE = [
  {
    "type": "init",
    "mainClass": "BubbleSort",
    "sourceFile": "C:\\Users\\m s i\\Downloads\\ALGOLAB-frontend_3\\backend\\runner\\tests\\fixtures\\BubbleSort.java",
    "semantics": "state_before_line_execution",
    "limits": {
      "maxEvents": 1000,
      "maxArrayLength": 50,
      "maxStringLength": 100,
      "maxOutputBytes": 10000,
      "timeoutMs": 5000
    }
  },
  {
    "type": "step",
    "stepIndex": 1,
    "line": 3,
    "method": "main",
    "variables": {},
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 2,
    "line": 4,
    "method": "main",
    "variables": {},
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 3,
    "line": 6,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 4,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 5,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 6,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 7,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          64,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 8,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          34,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 9,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          64,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 10,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          64,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 11,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          64,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 12,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          64,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 13,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          25,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 14,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          64,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 15,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          64,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 16,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          64,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 17,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 2
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          64,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 18,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 2
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          12,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 19,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          64,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 20,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 3
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          64,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 21,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 3
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          64,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 22,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 3
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          64,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 23,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 3
      },
      "temp": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          22
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 24,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      },
      "j": {
        "type": "int",
        "value": 3
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 25,
    "line": 6,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 26,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 27,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 28,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 29,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          34,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 30,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          25,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 31,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          34,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 32,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          34,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 33,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          34,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 34,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          34,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 35,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          12,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 36,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          34,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 37,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          34,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 38,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          34,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 39,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 2
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          34,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 40,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 2
      },
      "temp": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          22,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 41,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      },
      "j": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 42,
    "line": 6,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 43,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 44,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 45,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 46,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 25
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          25,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 47,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 0
      },
      "temp": {
        "type": "int",
        "value": 25
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          12,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 48,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          25,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 49,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          25,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 50,
    "line": 9,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          25,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 51,
    "line": 10,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 25
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          25,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 52,
    "line": 11,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 1
      },
      "temp": {
        "type": "int",
        "value": 25
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          22,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 53,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      },
      "j": {
        "type": "int",
        "value": 1
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 54,
    "line": 6,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 2
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 55,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 3
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 56,
    "line": 8,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 3
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 57,
    "line": 7,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 3
      },
      "j": {
        "type": "int",
        "value": 0
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 58,
    "line": 6,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "i": {
        "type": "int",
        "value": 3
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 59,
    "line": 16,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 60,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 61,
    "line": 18,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "val": {
        "type": "int",
        "value": 12
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 62,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 63,
    "line": 18,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "val": {
        "type": "int",
        "value": 22
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 64,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 65,
    "line": 18,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "val": {
        "type": "int",
        "value": 25
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 66,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 67,
    "line": 18,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "val": {
        "type": "int",
        "value": 34
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 68,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 69,
    "line": 18,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      },
      "val": {
        "type": "int",
        "value": 64
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 70,
    "line": 17,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 71,
    "line": 20,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "step",
    "stepIndex": 72,
    "line": 21,
    "method": "main",
    "variables": {
      "n": {
        "type": "int",
        "value": 5
      }
    },
    "arrays": {
      "args": {
        "type": "java.lang.String[]",
        "length": 0,
        "truncated": false,
        "values": []
      },
      "arr": {
        "type": "int[]",
        "length": 5,
        "truncated": false,
        "values": [
          12,
          22,
          25,
          34,
          64
        ]
      }
    }
  },
  {
    "type": "exit",
    "exitCode": 0,
    "totalSteps": 72,
    "stdout": "Sorted array:\r\n12 22 25 34 64 \r\n",
    "stderr": "",
    "stdoutTruncated": false,
    "stderrTruncated": false,
    "stepsTruncated": false
  }
];

export const SINGLE_STEP_FIXTURE = [
  {"type":"init","mainClass":"Simple","sourceFile":"Simple.java","semantics":"state_before_line_execution","limits":{"maxEvents":1000,"maxArrayLength":50,"maxStringLength":100,"maxOutputBytes":10000,"timeoutMs":5000}},
  {"type":"step","stepIndex":1,"line":3,"method":"main","variables":{"x":{"type":"int","value":42}},"arrays":{}},
  {"type":"exit","exitCode":0,"totalSteps":1,"stdout":"Done\n","stderr":"","stdoutTruncated":false,"stderrTruncated":false,"stepsTruncated":false}
];

export const TRUNCATED_TRACE_FIXTURE = [
  {"type":"init","mainClass":"Loop","sourceFile":"Loop.java","semantics":"state_before_line_execution","limits":{"maxEvents":5,"maxArrayLength":50,"maxStringLength":100,"maxOutputBytes":10000,"timeoutMs":5000}},
  {"type":"step","stepIndex":1,"line":3,"method":"main","variables":{"i":{"type":"int","value":0}},"arrays":{}},
  {"type":"step","stepIndex":2,"line":4,"method":"main","variables":{"i":{"type":"int","value":1}},"arrays":{}},
  {"type":"step","stepIndex":3,"line":4,"method":"main","variables":{"i":{"type":"int","value":2}},"arrays":{}},
  {"type":"step","stepIndex":4,"line":4,"method":"main","variables":{"i":{"type":"int","value":3}},"arrays":{}},
  {"type":"step","stepIndex":5,"line":4,"method":"main","variables":{"i":{"type":"int","value":4}},"arrays":{}},
  {"type":"truncation","reason":"max_events_exceeded","stepIndex":6,"limit":5},
  {"type":"exit","exitCode":0,"totalSteps":5,"stdout":"","stderr":"","stdoutTruncated":false,"stderrTruncated":false,"stepsTruncated":true}
];

export const TIMEOUT_ERROR_FIXTURE = [
  {"type":"init","mainClass":"Infinite","sourceFile":"Infinite.java","semantics":"state_before_line_execution","limits":{"maxEvents":1000,"maxArrayLength":50,"maxStringLength":100,"maxOutputBytes":10000,"timeoutMs":1000}},
  {"type":"step","stepIndex":1,"line":3,"method":"main","variables":{"x":{"type":"int","value":0}},"arrays":{}},
  {"type":"error","errorType":"timeout","message":"Execution timed out after 1000ms"}
];

export const COMPILATION_ERROR_FIXTURE = [
  {"type":"error","errorType":"compilation_error","message":"Compilation failed","details":"BubbleSort.java:5: error: ';' expected\n"}
];

export const EMPTY_TRACE_FIXTURE = [];

export const MALFORMED_TRACE_FIXTURE = [
  null,
  "invalid-json-string",
  {"type":"unknown_type_name"},
  {"type":"step"}
];

if (typeof window !== 'undefined') {
  window.ALGOLAB_FIXTURES = {
    BUBBLE_SORT_TRACE_FIXTURE,
    SINGLE_STEP_FIXTURE,
    TRUNCATED_TRACE_FIXTURE,
    TIMEOUT_ERROR_FIXTURE,
    COMPILATION_ERROR_FIXTURE,
    EMPTY_TRACE_FIXTURE,
    MALFORMED_TRACE_FIXTURE
  };
}
