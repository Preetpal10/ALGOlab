package tracer;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.StepRequest;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * ALGOLAB JDI Tracer (Phase 2 Proof of Concept)
 *
 * Traces genuine Java execution step-by-step using the Java Debug Interface (JDI).
 *
 * CRITICAL SEMANTICS:
 * - A 'step' event occurs when the target VM reaches a source line and suspends
 *   BEFORE that line's bytecode instructions execute.
 * - The variable and array states captured in a step event reflect the state
 *   prior to the execution of the indicated source line.
 * - Arbitrary student-object methods (e.g. toString()) are NEVER invoked
 *   to avoid executing untrusted code or introducing side effects / hangs.
 */
public class Tracer {

    public static class Config {
        public String sourcePath;
        public String mainClass;
        public int maxEvents = 1000;
        public int maxArrayLength = 50;
        public int maxStringLength = 100;
        public int maxOutputBytes = 10000;
        public long timeoutMs = 5000;
        public String stdinData = null;
    }

    public static void main(String[] args) {
        Config config = parseArgs(args);
        if (config == null || config.sourcePath == null) {
            emitJson(buildErrorJson("invalid_arguments", "Missing required --source argument. Usage: Tracer --source <path> [options]"));
            System.exit(1);
        }

        Path sourceFile = Paths.get(config.sourcePath).toAbsolutePath().normalize();
        if (!Files.exists(sourceFile)) {
            emitJson(buildErrorJson("file_not_found", "Source file not found: " + sourceFile));
            System.exit(1);
        }

        if (config.mainClass == null) {
            String fileName = sourceFile.getFileName().toString();
            config.mainClass = fileName.endsWith(".java") ? fileName.substring(0, fileName.length() - 5) : fileName;
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("algolab_trace_");
            // Step 1: Compile with debug symbols (-g)
            CompilationResult compileResult = compileSource(sourceFile, tempDir);
            if (!compileResult.success) {
                emitJson(buildErrorJson("compilation_error", "Compilation failed", compileResult.output));
                System.exit(1);
            }

            // Step 2: Trace under JDI
            runTracer(config, sourceFile, tempDir);

        } catch (Exception e) {
            emitJson(buildErrorJson("internal_error", e.getMessage(), getStackTraceString(e)));
            System.exit(1);
        } finally {
            if (tempDir != null) {
                deleteRecursively(tempDir);
            }
        }
    }

    private static Config parseArgs(String[] args) {
        Config cfg = new Config();
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--source":
                    if (++i < args.length) cfg.sourcePath = args[i];
                    break;
                case "--main":
                    if (++i < args.length) cfg.mainClass = args[i];
                    break;
                case "--max-events":
                    if (++i < args.length) cfg.maxEvents = Integer.parseInt(args[i]);
                    break;
                case "--max-array-length":
                    if (++i < args.length) cfg.maxArrayLength = Integer.parseInt(args[i]);
                    break;
                case "--max-string-length":
                    if (++i < args.length) cfg.maxStringLength = Integer.parseInt(args[i]);
                    break;
                case "--max-output-bytes":
                    if (++i < args.length) cfg.maxOutputBytes = Integer.parseInt(args[i]);
                    break;
                case "--timeout-ms":
                    if (++i < args.length) cfg.timeoutMs = Long.parseLong(args[i]);
                    break;
                case "--stdin":
                    if (++i < args.length) cfg.stdinData = args[i];
                    break;
            }
        }
        return cfg;
    }

    private static class CompilationResult {
        boolean success;
        String output;
        CompilationResult(boolean success, String output) {
            this.success = success;
            this.output = output;
        }
    }

    private static CompilationResult compileSource(Path sourceFile, Path outputDir) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
            "javac",
            "-g", // generate all debugging information (LineNumberTable, LocalVariableTable)
            "-d", outputDir.toString(),
            sourceFile.toString()
        );
        pb.redirectErrorStream(true);
        Process proc = pb.start();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        int exitCode = proc.waitFor();
        return new CompilationResult(exitCode == 0, sb.toString().trim());
    }

    private static void runTracer(Config config, Path sourceFile, Path classDir) throws Exception {
        VirtualMachineManager vmm = Bootstrap.virtualMachineManager();
        LaunchingConnector connector = vmm.defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();

        arguments.get("main").setValue(config.mainClass);
        // Quoted classpath to handle Windows directories with spaces
        arguments.get("options").setValue("-cp \"" + classDir.toAbsolutePath().toString() + "\"");
        arguments.get("suspend").setValue("true");

        VirtualMachine vm = connector.launch(arguments);
        Process targetProcess = vm.process();

        // Pass standard input if configured
        if (config.stdinData != null) {
            try (OutputStream os = targetProcess.getOutputStream()) {
                os.write(config.stdinData.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (IOException ignored) {}
        } else {
            try {
                targetProcess.getOutputStream().close();
            } catch (IOException ignored) {}
        }

        // Bounded output capture threads
        BoundedStreamReader stdoutReader = new BoundedStreamReader(targetProcess.getInputStream(), config.maxOutputBytes);
        BoundedStreamReader stderrReader = new BoundedStreamReader(targetProcess.getErrorStream(), config.maxOutputBytes);
        Thread stdoutThread = new Thread(stdoutReader, "StdoutReader");
        Thread stderrThread = new Thread(stderrReader, "StderrReader");
        stdoutThread.start();
        stderrThread.start();

        // Emit initial metadata event
        emitJson("{\"type\":\"init\",\"mainClass\":" + quote(config.mainClass) +
                 ",\"sourceFile\":" + quote(sourceFile.toString()) +
                 ",\"semantics\":\"state_before_line_execution\"" +
                 ",\"limits\":{\"maxEvents\":" + config.maxEvents +
                 ",\"maxArrayLength\":" + config.maxArrayLength +
                 ",\"maxStringLength\":" + config.maxStringLength +
                 ",\"maxOutputBytes\":" + config.maxOutputBytes +
                 ",\"timeoutMs\":" + config.timeoutMs + "}}");

        EventRequestManager erm = vm.eventRequestManager();
        ClassPrepareRequest cpr = erm.createClassPrepareRequest();
        cpr.addClassFilter(config.mainClass);
        cpr.enable();

        EventQueue queue = vm.eventQueue();
        boolean running = true;
        boolean eventLimitExceeded = false;
        AtomicBoolean timedOut = new AtomicBoolean(false);
        long startTime = System.currentTimeMillis();

        // Watchdog thread for external timeout
        ScheduledExecutorService watchdog = Executors.newSingleThreadScheduledExecutor();
        watchdog.schedule(() -> {
            timedOut.set(true);
            terminateProcessTree(targetProcess);
            try {
                vm.dispose();
            } catch (Exception ignored) {}
        }, config.timeoutMs, TimeUnit.MILLISECONDS);

        int stepIndex = 0;
        vm.resume();

        try {
            while (running && !timedOut.get()) {
                EventSet eventSet = queue.remove(500); // 500ms poll to check timeout
                if (eventSet == null) {
                    if (System.currentTimeMillis() - startTime >= config.timeoutMs) {
                        timedOut.set(true);
                        break;
                    }
                    continue;
                }

                boolean shouldResume = true;
                for (Event event : eventSet) {
                    if (event instanceof ClassPrepareEvent) {
                        ClassPrepareEvent cpe = (ClassPrepareEvent) event;
                        StepRequest sr = erm.createStepRequest(cpe.thread(), StepRequest.STEP_LINE, StepRequest.STEP_INTO);
                        sr.addClassFilter(config.mainClass);
                        sr.setSuspendPolicy(EventRequest.SUSPEND_ALL);
                        sr.enable();
                    } else if (event instanceof StepEvent) {
                        StepEvent se = (StepEvent) event;
                        stepIndex++;

                        if (stepIndex > config.maxEvents) {
                            if (!eventLimitExceeded) {
                                eventLimitExceeded = true;
                                emitJson("{\"type\":\"truncation\",\"reason\":\"max_events_exceeded\",\"stepIndex\":" + stepIndex +
                                         ",\"limit\":" + config.maxEvents + "}");
                                // Disable step request to allow target VM to run to completion without further stepping
                                erm.deleteEventRequest(se.request());
                            }
                            break;
                        }

                        // Capture step state
                        captureStepEvent(stepIndex, se, config);

                    } else if (event instanceof VMDeathEvent) {
                        // VM is shutting down. We MUST resume so VM can complete clean exit.
                        shouldResume = true;
                    } else if (event instanceof VMDisconnectEvent) {
                        // Target VM has disconnected; eventSet cannot be resumed.
                        running = false;
                        shouldResume = false;
                    }
                }

                if (shouldResume && running) {
                    try {
                        eventSet.resume();
                    } catch (VMDisconnectedException e) {
                        running = false;
                    }
                }
            }
        } catch (VMDisconnectedException e) {
            running = false;
        } finally {
            watchdog.shutdownNow();
        }

        if (timedOut.get()) {
            terminateProcessTree(targetProcess);
            emitJson(buildErrorJson("timeout", "Execution timed out after " + config.timeoutMs + "ms"));
            System.exit(2);
        }

        // Wait for process exit and bounded streams
        int exitCode = -1;
        try {
            if (targetProcess.waitFor(2, TimeUnit.SECONDS)) {
                exitCode = targetProcess.exitValue();
            } else {
                terminateProcessTree(targetProcess);
                exitCode = targetProcess.exitValue();
            }
        } catch (InterruptedException ignored) {}

        stdoutThread.join(1000);
        stderrThread.join(1000);

        // Emit final summary exit event
        StringBuilder exitJson = new StringBuilder();
        exitJson.append("{\"type\":\"exit\"");
        exitJson.append(",\"exitCode\":").append(exitCode);
        exitJson.append(",\"totalSteps\":").append(stepIndex);
        exitJson.append(",\"stdout\":").append(quote(stdoutReader.getContent()));
        exitJson.append(",\"stderr\":").append(quote(stderrReader.getContent()));
        exitJson.append(",\"stdoutTruncated\":").append(stdoutReader.isTruncated());
        exitJson.append(",\"stderrTruncated\":").append(stderrReader.isTruncated());
        exitJson.append(",\"stepsTruncated\":").append(eventLimitExceeded);
        exitJson.append("}");
        emitJson(exitJson.toString());
    }

    private static void captureStepEvent(int stepIndex, StepEvent se, Config config) {
        Location loc = se.location();
        int line = loc.lineNumber();
        String method = loc.method().name();

        StringBuilder json = new StringBuilder();
        json.append("{\"type\":\"step\"");
        json.append(",\"stepIndex\":").append(stepIndex);
        json.append(",\"line\":").append(line);
        json.append(",\"method\":").append(quote(method));

        Map<String, String> variablesJson = new LinkedHashMap<>();
        Map<String, String> arraysJson = new LinkedHashMap<>();

        try {
            ThreadReference tr = se.thread();
            if (tr.frameCount() > 0) {
                StackFrame frame = tr.frame(0);
                List<LocalVariable> visibleVars = frame.visibleVariables();
                for (LocalVariable lv : visibleVars) {
                    Value val = frame.getValue(lv);
                    String name = lv.name();
                    if (val instanceof ArrayReference) {
                        ArrayReference ar = (ArrayReference) val;
                        arraysJson.put(name, serializeArray(ar, config.maxArrayLength, config.maxStringLength));
                    } else {
                        variablesJson.put(name, serializeValue(val, config.maxStringLength));
                    }
                }
            }
        } catch (AbsentInformationException e) {
            // No local variable table available for this frame
        } catch (Exception e) {
            // Frame unavailable or invalidated
        }

        // Build variables object
        json.append(",\"variables\":{");
        int vCount = 0;
        for (Map.Entry<String, String> entry : variablesJson.entrySet()) {
            if (vCount++ > 0) json.append(",");
            json.append(quote(entry.getKey())).append(":").append(entry.getValue());
        }
        json.append("}");

        // Build arrays object
        json.append(",\"arrays\":{");
        int aCount = 0;
        for (Map.Entry<String, String> entry : arraysJson.entrySet()) {
            if (aCount++ > 0) json.append(",");
            json.append(quote(entry.getKey())).append(":").append(entry.getValue());
        }
        json.append("}");

        json.append("}");
        emitJson(json.toString());
    }

    private static String serializeValue(Value val, int maxStringLength) {
        if (val == null) {
            return "{\"type\":\"null\",\"value\":null}";
        }
        if (val instanceof BooleanValue) {
            return "{\"type\":\"boolean\",\"value\":" + ((BooleanValue) val).value() + "}";
        }
        if (val instanceof ByteValue || val instanceof ShortValue || val instanceof IntegerValue || val instanceof LongValue) {
            PrimitiveValue pv = (PrimitiveValue) val;
            return "{\"type\":\"" + val.type().name() + "\",\"value\":" + pv.longValue() + "}";
        }
        if (val instanceof FloatValue || val instanceof DoubleValue) {
            PrimitiveValue pv = (PrimitiveValue) val;
            double d = pv.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) {
                return "{\"type\":\"" + val.type().name() + "\",\"value\":null}";
            }
            return "{\"type\":\"" + val.type().name() + "\",\"value\":" + d + "}";
        }
        if (val instanceof CharValue) {
            char c = ((CharValue) val).value();
            return "{\"type\":\"char\",\"value\":" + quote(String.valueOf(c)) + "}";
        }
        if (val instanceof StringReference) {
            String fullStr = ((StringReference) val).value();
            boolean truncated = fullStr.length() > maxStringLength;
            String bounded = truncated ? fullStr.substring(0, maxStringLength) : fullStr;
            return "{\"type\":\"String\",\"value\":" + quote(bounded) + ",\"truncated\":" + truncated + "}";
        }
        // General ObjectReference without calling student methods
        return "{\"type\":" + quote(val.type().name()) + ",\"value\":" + quote("[" + val.type().name() + "]") + "}";
    }

    private static String serializeArray(ArrayReference ar, int maxArrayLength, int maxStringLength) {
        int length = ar.length();
        int count = Math.min(length, maxArrayLength);
        boolean truncated = length > maxArrayLength;

        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":").append(quote(ar.type().name()));
        sb.append(",\"length\":").append(length);
        sb.append(",\"truncated\":").append(truncated);
        sb.append(",\"values\":[");

        try {
            List<Value> values = ar.getValues(0, count);
            for (int i = 0; i < values.size(); i++) {
                if (i > 0) sb.append(",");
                Value el = values.get(i);
                if (el == null) {
                    sb.append("null");
                } else if (el instanceof BooleanValue) {
                    sb.append(((BooleanValue) el).value());
                } else if (el instanceof ByteValue || el instanceof ShortValue || el instanceof IntegerValue || el instanceof LongValue) {
                    sb.append(((PrimitiveValue) el).longValue());
                } else if (el instanceof FloatValue || el instanceof DoubleValue) {
                    double d = ((PrimitiveValue) el).doubleValue();
                    if (Double.isNaN(d) || Double.isInfinite(d)) sb.append("null");
                    else sb.append(d);
                } else if (el instanceof CharValue) {
                    char c = ((CharValue) el).value();
                    sb.append(quote(String.valueOf(c)));
                } else if (el instanceof StringReference) {
                    String s = ((StringReference) el).value();
                    if (s.length() > maxStringLength) s = s.substring(0, maxStringLength);
                    sb.append(quote(s));
                } else {
                    sb.append(quote("[" + el.type().name() + "]"));
                }
            }
        } catch (Exception e) {
            // Handled if array reference invalidated
        }

        sb.append("]}");
        return sb.toString();
    }

    private static void terminateProcessTree(Process process) {
        if (process == null) return;
        try {
            process.toHandle().descendants().forEach(h -> {
                try { h.destroyForcibly(); } catch (Exception ignored) {}
            });
            process.destroyForcibly();
        } catch (Exception ignored) {}
    }

    private static void deleteRecursively(Path path) {
        try {
            if (Files.isDirectory(path)) {
                try (var stream = Files.newDirectoryStream(path)) {
                    for (Path child : stream) {
                        deleteRecursively(child);
                    }
                }
            }
            Files.deleteIfExists(path);
        } catch (Exception ignored) {}
    }

    private static String buildErrorJson(String errorType, String message) {
        return buildErrorJson(errorType, message, null);
    }

    private static String buildErrorJson(String errorType, String message, String details) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"error\"");
        sb.append(",\"errorType\":").append(quote(errorType));
        sb.append(",\"message\":").append(quote(message));
        if (details != null) {
            sb.append(",\"details\":").append(quote(details));
        }
        sb.append("}");
        return sb.toString();
    }

    private static void emitJson(String json) {
        System.out.println(json);
        System.out.flush();
    }

    public static String quote(String string) {
        if (string == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < string.length(); i++) {
            char c = string.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 32) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    private static String getStackTraceString(Throwable t) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        t.printStackTrace(pw);
        return sw.toString();
    }

    private static class BoundedStreamReader implements Runnable {
        private final InputStream is;
        private final int limit;
        private final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        private boolean truncated = false;

        BoundedStreamReader(InputStream is, int limit) {
            this.is = is;
            this.limit = limit;
        }

        @Override
        public void run() {
            byte[] buf = new byte[1024];
            int read;
            try {
                while ((read = is.read(buf)) != -1) {
                    if (baos.size() + read > limit) {
                        int remaining = limit - baos.size();
                        if (remaining > 0) {
                            baos.write(buf, 0, remaining);
                        }
                        truncated = true;
                        // Continue draining stream so child process doesn't block
                    } else {
                        baos.write(buf, 0, read);
                    }
                }
            } catch (IOException ignored) {}
        }

        String getContent() {
            return baos.toString(StandardCharsets.UTF_8);
        }

        boolean isTruncated() {
            return truncated;
        }
    }
}
