# ALGOLAB — Trace Event Schema (Phase 2 POC)

**Specification Version:** 1.0  
**Format:** JSON Lines (JSONL)  
**Tracer Implementation:** Java Debug Interface (`com.sun.jdi`) via `tracer.Tracer`  

---

## 1. Overview & Source-Line Semantics

Each line emitted to standard output represents a single self-contained JSON object corresponding to an execution event, metadata update, or error state.

### Critical Source-Line Execution Semantics
> [!IMPORTANT]
> **State Before Line Execution (`state_before_line_execution`)**  
> In JDI line stepping (`StepRequest.STEP_LINE`, `StepRequest.STEP_INTO`), a `step` event is emitted when the execution thread pauses at a source line **before** the bytecode instructions of that line execute.  
> Consequently, all variable values, stack frame states, and array snapshots recorded in that event reflect the state immediately **prior** to the execution of the indicated source line.

---

## 2. Event Types & Schemas

### 2.1 `init` Event
Emitted once at the start of tracing after the target class is compiled and loaded into the target VM.

```json
{
  "type": "init",
  "mainClass": "BubbleSort",
  "sourceFile": "C:\\path\\to\\BubbleSort.java",
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

- `type`: Always `"init"`.
- `mainClass`: The detected or configured main entrypoint class.
- `sourceFile`: Absolute path to the Java source file.
- `semantics`: Semantic execution model (`"state_before_line_execution"`).
- `limits`: Active guardrails configured for this execution run.

---

### 2.2 `step` Event
Emitted on each source-line transition inside student code.

```json
{
  "type": "step",
  "stepIndex": 7,
  "line": 10,
  "method": "main",
  "variables": {
    "n": { "type": "int", "value": 5 },
    "i": { "type": "int", "value": 0 },
    "j": { "type": "int", "value": 0 },
    "temp": { "type": "int", "value": 64 }
  },
  "arrays": {
    "arr": {
      "type": "int[]",
      "length": 5,
      "truncated": false,
      "values": [64, 34, 25, 12, 22]
    }
  }
}
```

#### Fields:
- `stepIndex` *(integer)*: 1-indexed sequential counter of recorded steps.
- `line` *(integer)*: Source code line number in the Java source file.
- `method` *(string)*: Method name of the top stack frame.
- `variables` *(object)*: Map of local variable names to variable descriptor objects.
- `arrays` *(object)*: Map of local array variable names to array snapshot objects.

#### Variable Value Descriptor:
- `type` *(string)*: Type name (e.g. `"int"`, `"boolean"`, `"double"`, `"char"`, `"String"`, `"null"`).
- `value`: Primitive value, string, or `null`. (Floating-point `NaN`/`Infinity` values are safely normalized to `null`).
- `truncated` *(boolean, optional)*: Set to `true` if a string exceeded `maxStringLength`.

#### Array Snapshot Descriptor:
- `type` *(string)*: Array type descriptor (e.g. `"int[]"`, `"java.lang.String[]"`).
- `length` *(integer)*: Genuine total array length (`array.length`).
- `truncated` *(boolean)*: `true` if `length > maxArrayLength`.
- `values` *(array)*: Array of elements up to `maxArrayLength`. Elements are primitives, strings (bounded by `maxStringLength`), or `null`.

---

### 2.3 `truncation` Event
Emitted when the configured execution step limit is reached (`stepIndex > maxEvents`).

```json
{
  "type": "truncation",
  "reason": "max_events_exceeded",
  "stepIndex": 51,
  "limit": 50
}
```

- When this occurs, stepping is halted, the target VM step request is removed, and the program is permitted to run to completion or until `timeoutMs` expires.

---

### 2.4 `exit` Event
Emitted when the target Java program completes execution and terminates.

```json
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
```

- `exitCode` *(integer)*: JVM process exit code (e.g. `0` for success).
- `totalSteps` *(integer)*: Total count of steps recorded.
- `stdout` *(string)*: Captured standard output up to `maxOutputBytes`.
- `stderr` *(string)*: Captured standard error up to `maxOutputBytes`.
- `stdoutTruncated` *(boolean)*: `true` if stdout exceeded `maxOutputBytes`.
- `stderrTruncated` *(boolean)*: `true` if stderr exceeded `maxOutputBytes`.
- `stepsTruncated` *(boolean)*: `true` if trace recording was capped by `maxEvents`.

---

### 2.5 `error` Event
Emitted if compilation fails, execution times out, or arguments are invalid.

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

- `errorType`: One of `"compilation_error"`, `"timeout"`, `"file_not_found"`, `"invalid_arguments"`, or `"internal_error"`.
- `message`: Human-readable summary.
- `details` *(optional string)*: Compiler error diagnostic text or stack trace.

---

## 3. Supported and Unsupported Java Constructs

### Currently Supported
- Primitive variables: `boolean`, `byte`, `short`, `int`, `long`, `float`, `double`, `char`.
- One-dimensional primitive arrays: `int[]`, `double[]`, `boolean[]`, `char[]`, etc.
- `String` variables and string arrays (`String[]`).
- Control flow: `for`, `while`, `do-while`, `if`, `else`, `switch`, nested loops.
- Method calls and stack frame changes within the filtered student class.
- Console output via `System.out` / `System.err`.
- Standard input via `System.in` (when `--stdin` is provided).

### Unsupported / Restricted Constructs
- **Arbitrary Object Method Invocation:**  
  The tracer **never** invokes methods on user-defined objects (such as `toString()`, getters, or inspectors) during state capture. Invoking methods on untrusted target objects can execute user code during a pause, produce side-effects, or deadlock the JDI event queue.
- **Multithreading / Concurrency:**  
  The current tracer POC attaches a line step request to the main thread upon class preparation. Multi-threaded student code (`Thread`, `Runnable`, `CompletableFuture`, virtual threads) is not yet supported in this proof of concept.
- **Multi-dimensional Arrays (`int[][]`):**  
  Multi-dimensional arrays are captured as arrays of `ObjectReference` elements (`[int[]]`); recursive nested array expansion is planned for a subsequent phase.
- **Dynamically Generated / Bytecode Instrumented Classes:**  
  Reflection, dynamic proxies, or custom class loaders are not supported.

---

## 4. Security Status & Known Limitations

> [!CAUTION]
> **JDI Is a Debugging Interface, NOT a Sandbox.**  
> JDI executes code in a genuine Java Virtual Machine. JDI provides visibility into execution state; it does **not** restrict filesystem, network, process, or hardware access.

### Protections Currently Implemented
1. **External Process Watchdog Timeout:** A dedicated executor watchdog terminates the entire target process tree if execution exceeds `--timeout-ms`.
2. **Process Tree Termination:** `ProcessHandle.descendants().forEach(ProcessHandle::destroyForcibly)` ensures no orphaned child or grandchild processes survive.
3. **Bounded Buffers:** Strict bounds on stdout (`--max-output-bytes`), array lengths (`--max-array-length`), string lengths (`--max-string-length`), and trace length (`--max-events`).
4. **Isolated Compilation:** JDI compilation occurs in a temporary directory with debug symbols (`-g`), cleaned up automatically upon exit.
5. **No Method Invocation:** Untrusted object methods are never evaluated during inspection.

### Protections UNAVAILABLE Until Docker / Isolated Runner Is Established
- **Filesystem Isolation:** Target code has the same file access permissions as the executing user.
- **Network Isolation:** Target code can initiate outbound socket connections unless blocked by an OS sandbox or container.
- **System Resource Isolation:** RAM and CPU throttling are not enforced by JDI.
- **Security Policy:** No security manager is active (deprecated/removed in modern JDKs).

*Consequently, this tracer must not be exposed to untrusted web users until an isolated container sandbox (e.g. Docker Desktop or equivalent virtualization) is integrated.*
