# ALGOLAB — Java Execution & Tracing Contract

**Document Version:** 1.0  
**Status:** Specified & Verified against `tracer.Tracer`  
**Purpose:** Defines the strict technical contract between the future ALGOLAB backend API service, the isolated Java JDI tracer runner, and the client-side trace playback engine.

---

## 1. System Context & Roles

```
┌────────────────────────────────┐
│   ALGOLAB Frontend (Code Lab)  │
│  TracePlaybackEngine (Vanilla) │
└───────────────┬────────────────┘
                │ HTTP POST /api/run (Future Phase)
                ▼
┌────────────────────────────────┐
│      Trusted Node.js API       │
│  - Payload Validation          │
│  - Auth & Rate Limiting        │
└───────────────┬────────────────┘
                │ Spawns isolated container (Docker)
                ▼
┌──────────────────────────────────────────────┐
│  Untrusted Execution Sandbox (Runner)        │
│  - tracer.Tracer (Java 25 JDI)               │
│  - Student Program (Under JDI Observation)   │
└──────────────────────────────────────────────┘
```

---

## 2. Runner Input Contract

### 2.1 CLI Interface (`tracer.Tracer`)

The tracer executable is launched with explicit arguments:

| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--source <path>` | String | *(Required)* | Absolute path to the student Java source file (`.java`). |
| `--main <className>` | String | Derived from filename | Entrypoint class containing `public static void main(String[] args)`. |
| `--max-events <int>` | Integer | `1000` | Maximum number of `step` events recorded before trace truncation. |
| `--max-array-length <int>` | Integer | `50` | Maximum elements captured per array snapshot. |
| `--max-string-length <int>` | Integer | `100` | Maximum length captured per string before truncation. |
| `--max-output-bytes <int>` | Integer | `10000` (10KB) | Maximum bytes captured from student stdout and stderr streams. |
| `--timeout-ms <long>` | Long | `5000` (5s) | Hard execution timeout enforced by external watchdog thread. |
| `--stdin <string>` | String | `null` | Optional standard input data piped to the target JVM process. |

### 2.2 Future Backend JSON Request Payload (`/api/run`)

```json
{
  "code": "public class BubbleSort {\n    public static void main(String[] args) {\n        // ...\n    }\n}",
  "mainClass": "BubbleSort",
  "stdin": "5\n10 20 30 40 50\n",
  "limits": {
    "timeoutMs": 5000,
    "maxEvents": 1000,
    "maxArrayLength": 50,
    "maxStringLength": 100,
    "maxOutputBytes": 10000
  }
}
```

---

## 3. Output Stream Contract (JSON Lines / JSONL)

The tracer emits newline-delimited JSON objects to its standard output. Each line is an independent, valid JSON object.

### 3.1 Event Stream Sequence Rules
1. An `init` event is emitted first upon successful compilation and class loading.
2. Zero or more `step` events are emitted in chronological execution order.
3. If `maxEvents` is exceeded, a single `truncation` event is emitted immediately, after which no further `step` events are emitted.
4. When the target JVM finishes, an `exit` event is emitted.
5. If an unrecoverable failure occurs (compilation error, watchdog timeout, invalid parameters), an `error` event is emitted and the process terminates with a non-zero exit status.

---

## 4. Event Specifications

### 4.1 `init` Event
Emitted immediately before starting thread execution stepping:
```json
{
  "type": "init",
  "mainClass": "BubbleSort",
  "sourceFile": "/sandbox/BubbleSort.java",
  "semantics": "state_before_line_execution",
  "limits": {
    "maxEvents": 1000,
    "maxArrayLength": 50,
    "maxStringLength": 100,
    "maxOutputBytes": 10000,
    "timeoutMs": 5000
  }
}
```

### 4.2 `step` Event
Emitted at every source-line boundary within the filtered student class:
```json
{
  "type": "step",
  "stepIndex": 12,
  "line": 9,
  "method": "main",
  "variables": {
    "n": { "type": "int", "value": 5 },
    "i": { "type": "int", "value": 0 },
    "j": { "type": "int", "value": 1 },
    "temp": { "type": "int", "value": 64 }
  },
  "arrays": {
    "arr": {
      "type": "int[]",
      "length": 5,
      "truncated": false,
      "values": [34, 64, 25, 12, 22]
    }
  }
}
```

#### Source-Line Semantics: `state_before_line_execution`
- In JDI line stepping (`StepRequest.STEP_LINE`), execution suspends **before** the bytecode instructions of `line` execute.
- All variable values and array states in this event represent the state **prior** to the execution of `line`.

### 4.3 `truncation` Event
Emitted when `stepIndex > maxEvents`:
```json
{
  "type": "truncation",
  "reason": "max_events_exceeded",
  "stepIndex": 1001,
  "limit": 1000
}
```
*Behavior:* The step request is unregistered. The target VM continues executing uninhibited until completion or timeout so that final output and exit code can still be captured.

### 4.4 `exit` Event
Emitted when the target program finishes:
```json
{
  "type": "exit",
  "exitCode": 0,
  "totalSteps": 72,
  "stdout": "Sorted array:\n12 22 25 34 64 \n",
  "stderr": "",
  "stdoutTruncated": false,
  "stderrTruncated": false,
  "stepsTruncated": false
}
```

### 4.5 `error` Event
Emitted on compilation failure, timeout, or configuration error:
```json
{
  "type": "error",
  "errorType": "compilation_error",
  "message": "Compilation failed",
  "details": "BubbleSort.java:5: error: ';' expected\n"
}
```
```json
{
  "type": "error",
  "errorType": "timeout",
  "message": "Execution timed out after 5000ms"
}
```

---

## 5. Error & Boundary Handling Contract

| Scenario | Trigger / Detection | Tracer Behavior | Emitted Event | Process Exit Code |
| :--- | :--- | :--- | :--- | :--- |
| **Compilation Error** | `javac -g` exits non-zero | Aborts before JDI launch | `error` (`errorType: "compilation_error"`) | `1` |
| **Invalid CLI Args** | Missing `--source` or file not found | Aborts immediately | `error` (`errorType: "invalid_arguments"` or `"file_not_found"`) | `1` |
| **Infinite Loop / Timeout** | Time > `timeoutMs` | Watchdog forcibly kills target process tree | `error` (`errorType: "timeout"`) | `2` |
| **Runtime Exception** | Uncaught exception in student code | Target VM prints to stderr and exits with non-zero exit code | Pre-crash `step` events preserved; `exit` event emitted with `exitCode != 0` and stderr details | `0` (Tracer completed normally) |
| **Event Limit Exceeded** | `stepIndex > maxEvents` | Step request removed, target VM continues to completion | `truncation` event; `exit` event has `stepsTruncated: true` | `0` |
| **Oversized Output** | stdout/stderr > `maxOutputBytes` | StreamReader truncates buffer and drains remainder | `exit` event has `stdoutTruncated: true` or `stderrTruncated: true` | `0` |
| **Large Arrays** | `array.length > maxArrayLength` | Only first `maxArrayLength` elements captured | In `step.arrays.<name>`: `truncated: true` | `0` |
| **Long Strings** | `string.length > maxStringLength` | Substring of `maxStringLength` chars stored | In `step.variables.<name>`: `truncated: true` | `0` |

---

## 6. Protection Against Forged Trace Output

A malicious or curious student might attempt to spoof trace events by printing raw JSON to standard output:
```java
System.out.println("{\"type\":\"step\",\"line\":999,\"variables\":{...}}");
```
**Architectural Protection:**
- Student code stdout is captured by `Tracer.java` via `targetProcess.getInputStream()`.
- Student stdout is **never** piped directly into the tracer's standard output stream.
- Student stdout is safely JSON-quoted and stored as a string property inside the final `exit` event: `"stdout": "..."`.
- The outer JSONL stream contains exclusively genuine events produced by the trusted `Tracer.java` process.

---

## 7. Frontend Trace Consumption Contract

When the future backend returns the trace payload, the frontend consumes it via `TracePlaybackEngine`:

1. **Payload Ingestion:**
   ```javascript
   const engine = new TracePlaybackEngine({
     onStepChange: (step, index) => updateUI(step, index),
     onStatusChange: (status, message) => updateStatusBadge(status, message),
     onError: (errorEvent) => displayError(errorEvent),
     onTruncated: (truncEvent) => displayTruncationWarning(truncEvent)
   });
   engine.loadTrace(traceEventsArray);
   ```
2. **State Consumption:**
   - `step.line`: Drives Monaco/textarea line gutter highlighting.
   - `step.variables`: Populates the Variable Inspector table (name, type, value).
   - `step.arrays`: Renders interactive array element cards.
   - `exit.stdout`: Appends program output to the Console Output panel.
   - `semantics`: Shows banner reminding user that state reflects values **before** executing the highlighted line.
