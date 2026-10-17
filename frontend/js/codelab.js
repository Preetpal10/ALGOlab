// =====================================================
// ALGOLAB - codelab.js
// Phase 2: Code Lab Controller with Trace Playback Engine
//
// Manages the student code editor, templates, console,
// and genuine JDI execution-state playback.
// Conforms strictly to docs/TRACE_SCHEMA.md
// =====================================================

import { TracePlaybackEngine } from "./playback-engine.js";
import { generateStepExplanation } from "./explanation-engine.js";
import {
  BUBBLE_SORT_TRACE_FIXTURE,
  SINGLE_STEP_FIXTURE,
  TRUNCATED_TRACE_FIXTURE,
  TIMEOUT_ERROR_FIXTURE,
  COMPILATION_ERROR_FIXTURE,
  EMPTY_TRACE_FIXTURE
} from "./trace-fixtures.js";

document.addEventListener("DOMContentLoaded", function () {
  // Grab DOM elements
  const codeEditor = document.getElementById("code-editor");
  const lineNumbers = document.getElementById("line-numbers");
  const languageSelect = document.getElementById("language-select");
  const templateSelect = document.getElementById("template-select");
  const runBtn = document.getElementById("run-btn");
  const submitBtn = document.getElementById("submit-btn");
  const resetCodeBtn = document.getElementById("reset-code-btn");
  const clearConsoleBtn = document.getElementById("clear-console-btn");
  const stdinInput = document.getElementById("stdin-input");
  const consoleOutput = document.getElementById("console-output");
  const editorStats = document.getElementById("editor-stats");

  // Practice Arena submission elements
  const submissionStatusBox = document.getElementById("submission-status-box");
  const submissionStatusTitle = document.getElementById("submission-status-title");
  const submissionStatusDesc = document.getElementById("submission-status-desc");
  const submissionBadge = document.getElementById("submission-badge");

  // Trace Playback Controls
  const fixtureSelect = document.getElementById("fixture-select");
  const loadFixtureBtn = document.getElementById("load-fixture-btn");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const traceResetBtn = document.getElementById("trace-reset-btn");
  const traceSpeedRange = document.getElementById("trace-speed-range");
  const traceStatusLabel = document.getElementById("trace-status-label");
  const stepCounterLabel = document.getElementById("step-counter-label");
  const traceSemanticsBanner = document.getElementById("trace-semantics-banner");
  const semanticsDetails = document.getElementById("semantics-details");
  const visualizationPanel = document.getElementById("visualization-panel");
  const variablesTableBody = document.getElementById("variables-table-body");
  const traceModeBadge = document.getElementById("trace-mode-badge");

  // Step Explanation elements (Phase 8)
  const explanationCategory = document.getElementById("explanation-category");
  const explanationStepNum = document.getElementById("explanation-step-num");
  const explanationLineBadge = document.getElementById("explanation-line-badge");
  const explanationCodeText = document.getElementById("explanation-code-text");
  const explanationWhatText = document.getElementById("explanation-what-text");
  const explanationWhyText = document.getElementById("explanation-why-text");
  const explanationStateSummary = document.getElementById("explanation-state-summary");
  const explanationChips = document.getElementById("explanation-chips");
  const explanationChangeBanner = document.getElementById("explanation-change-banner");
  const explanationChangeText = document.getElementById("explanation-change-text");
  const explanationTip = document.getElementById("explanation-tip");
  const explanationTipText = document.getElementById("explanation-tip-text");

  if (!codeEditor || !lineNumbers || !consoleOutput) {
    return; // Exit if not on Code Lab page
  }

  // Active highlighted line state
  let currentActiveLine = null;

  // Starter Java templates for students
  const TEMPLATES = {
    "bubble-sort": `// ALGOLAB - Bubble Sort in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 64, 34, 25, 12, 22 };
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted array:");
        for (int val : arr) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}`,
    "selection-sort": `// ALGOLAB - Selection Sort in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 64, 25, 12, 22, 11 };
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }

        System.out.println("Sorted array:");
        for (int val : arr) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}`,
    "insertion-sort": `// ALGOLAB - Insertion Sort in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 64, 25, 12, 22, 11 };
        int n = arr.length;

        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;

            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }

        System.out.println("Sorted array:");
        for (int val : arr) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}`,
    "linear-search": `// ALGOLAB - Linear Search in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 10, 20, 30, 40, 50 };
        int target = 30;
        int foundIndex = -1;

        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found target at index: " + foundIndex);
        } else {
            System.out.println("Target not found in array");
        }
    }
}`,
    "binary-search": `// ALGOLAB - Binary Search in Java
// Note: Binary Search requires an explicitly sorted array!
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 11, 12, 22, 25, 64 };
        int target = 25;
        int low = 0;
        int high = arr.length - 1;
        int foundIndex = -1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (arr[mid] == target) {
                foundIndex = mid;
                break;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found target at index: " + foundIndex);
        } else {
            System.out.println("Target not found in array");
        }
    }
}`,
    "stack": `// ALGOLAB - Stack Data Structure (LIFO) in Java
public class Solution {
    public static void main(String[] args) {
        // Simple array-backed stack with dynamic LIFO operations
        int capacity = 5;
        int[] stack = new int[capacity];
        int top = -1;

        // 1. Check empty stack / underflow handling
        if (top == -1) {
            System.out.println("Underflow: Stack is empty");
        }

        // 2. Push elements onto stack
        top++;
        stack[top] = 10;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        top++;
        stack[top] = 20;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        top++;
        stack[top] = 30;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        // 3. Peek top element without removing
        int peeked = stack[top];
        System.out.println("PEEK: " + peeked + " (top=" + top + ")");

        // 4. Pop elements from stack
        int popped1 = stack[top];
        top--;
        System.out.println("POP: " + popped1 + " (top=" + top + ")");

        // 5. Push another element
        top++;
        stack[top] = 42;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        // 6. Pop remaining elements until empty
        while (top >= 0) {
            int val = stack[top];
            top--;
            System.out.println("POP: " + val + " (top=" + top + ")");
        }

        System.out.println("Stack operations completed successfully.");
    }
}`,
    "queue": `// ALGOLAB - Queue Data Structure (FIFO) in Java
public class Solution {
    public static void main(String[] args) {
        // Simple array-backed queue with dynamic FIFO operations
        int capacity = 5;
        int[] queue = new int[capacity];
        int front = 0;
        int rear = -1;
        int size = 0;

        // 1. Check empty queue / underflow handling
        if (size == 0) {
            System.out.println("Underflow: Queue is empty");
        }

        // 2. Enqueue elements at rear
        rear++;
        queue[rear] = 10;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        rear++;
        queue[rear] = 20;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        rear++;
        queue[rear] = 30;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        // 3. Peek front element without removing
        int peeked = queue[front];
        System.out.println("PEEK: " + peeked + " (front=" + front + ")");

        // 4. Dequeue elements from front (FIFO order)
        int dequeued1 = queue[front];
        front++;
        size--;
        System.out.println("DEQUEUE: " + dequeued1 + " (front=" + front + ", size=" + size + ")");

        // 5. Enqueue another element at rear
        rear++;
        queue[rear] = 42;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (rear=" + rear + ", size=" + size + ")");

        // 6. Dequeue remaining elements until empty
        while (size > 0) {
            int val = queue[front];
            front++;
            size--;
            System.out.println("DEQUEUE: " + val + " (size=" + size + ")");
        }

        System.out.println("Queue operations completed successfully.");
    }
}`,
    "linked-list": `// ALGOLAB - Singly Linked List in Java
public class Solution {
    static class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    public static void main(String[] args) {
        Node head = null;

        // 1. Insert at head: 20, then 10 (list becomes 10 -> 20)
        Node n1 = new Node(20);
        n1.next = head;
        head = n1;

        Node n2 = new Node(10);
        n2.next = head;
        head = n2;

        // 2. Insert at tail: 30 (list becomes 10 -> 20 -> 30)
        Node n3 = new Node(30);
        Node curr = head;
        while (curr.next != null) {
            curr = curr.next;
        }
        curr.next = n3;

        // 3. Search for value 20
        int target = 20;
        boolean found = false;
        curr = head;
        int index = 0;
        while (curr != null) {
            if (curr.data == target) {
                found = true;
                break;
            }
            curr = curr.next;
            index++;
        }
        System.out.println("Search " + target + ": found=" + found + " at index " + index);

        // 4. Traversal
        System.out.print("Linked List: ");
        curr = head;
        while (curr != null) {
            System.out.print(curr.data + " -> ");
            curr = curr.next;
        }
        System.out.println("null");
    }
}`,
    "bst": `// ALGOLAB - Binary Search Tree (BST) in Java
public class Solution {
    static class Node {
        int val;
        Node left;
        Node right;

        Node(int val) {
            this.val = val;
            this.left = null;
            this.right = null;
        }
    }

    static Node insert(Node root, int val) {
        if (root == null) {
            return new Node(val);
        }
        if (val < root.val) {
            root.left = insert(root.left, val);
        } else if (val > root.val) {
            root.right = insert(root.right, val);
        }
        return root;
    }

    static boolean search(Node root, int target) {
        if (root == null) {
            return false;
        }
        if (root.val == target) {
            return true;
        }
        if (target < root.val) {
            return search(root.left, target);
        } else {
            return search(root.right, target);
        }
    }

    static Node findMin(Node node) {
        Node curr = node;
        while (curr != null && curr.left != null) {
            curr = curr.left;
        }
        return curr;
    }

    static Node delete(Node root, int val) {
        if (root == null) {
            return null;
        }
        if (val < root.val) {
            root.left = delete(root.left, val);
        } else if (val > root.val) {
            root.right = delete(root.right, val);
        } else {
            // Case 1 & 2: Leaf or single child
            if (root.left == null) {
                return root.right;
            } else if (root.right == null) {
                return root.left;
            }
            // Case 3: Two children
            Node successor = findMin(root.right);
            root.val = successor.val;
            root.right = delete(root.right, successor.val);
        }
        return root;
    }

    static void inorder(Node root) {
        if (root != null) {
            inorder(root.left);
            System.out.print(root.val + " ");
            inorder(root.right);
        }
    }

    public static void main(String[] args) {
        Node root = null;
        int[] values = { 50, 30, 70, 20, 40, 60, 80 };

        for (int v : values) {
            root = insert(root, v);
            System.out.println("INSERT: " + v);
        }

        System.out.print("INORDER: ");
        inorder(root);
        System.out.println();

        boolean found40 = search(root, 40);
        System.out.println("SEARCH 40: " + found40);

        root = delete(root, 20);
        System.out.println("DELETED: 20");

        System.out.print("AFTER DELETION INORDER: ");
        inorder(root);
        System.out.println();

        System.out.println("BST operations completed successfully.");
    }
}`,
    "reverse-array": `// ALGOLAB - Reverse Array in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 1, 2, 3, 4, 5 };
        int start = 0;
        int end = arr.length - 1;

        while (start < end) {
            int temp = arr[start];
            arr[start] = arr[end];
            arr[end] = temp;
            start++;
            end--;
        }

        System.out.println("Reversed array:");
        for (int val : arr) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}`,
    "empty": `// ALGOLAB - Custom Java Solution
public class Solution {
    public static void main(String[] args) {
        // Write your Java algorithm here
        System.out.println("Hello from ALGOLAB Code Lab!");
    }
}`
  };

  /**
   * Updates line numbers gutter and highlights active source line.
   */
  function updateLineNumbers(activeLine = null) {
    currentActiveLine = activeLine;
    const text = codeEditor.value;
    const lines = text.split("\n");
    const count = lines.length;

    lineNumbers.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const lineDiv = document.createElement("div");
      lineDiv.className = "line-num";
      if (activeLine === i) {
        lineDiv.classList.add("active-line");
      }
      lineDiv.textContent = String(i);
      lineNumbers.appendChild(lineDiv);
    }

    if (editorStats) {
      if (activeLine) {
        editorStats.textContent = `Language: Java | Lines: ${count} | Line ${activeLine} about to execute`;
      } else {
        editorStats.textContent = `Language: Java | Lines: ${count}`;
      }
    }
  }

  /**
   * Syncs scrolling between the code textarea and the line numbers gutter.
   */
  function syncScroll() {
    lineNumbers.scrollTop = codeEditor.scrollTop;
  }

  /**
   * Loads a code template into the editor.
   */
  function loadTemplate(key) {
    const template = TEMPLATES[key] || TEMPLATES["bubble-sort"];
    codeEditor.value = template;
    updateLineNumbers(null);
    codeEditor.scrollTop = 0;
  }

  /**
   * Appends a message to the console panel safely.
   */
  function appendConsole(message, type = "normal") {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement("div");

    if (type === "info") {
      line.className = "console-info";
    } else if (type === "warn") {
      line.className = "console-warn";
    } else if (type === "error") {
      line.className = "console-error";
    } else if (type === "muted") {
      line.className = "console-muted";
    }

    line.textContent = `[${time}] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  // --- Keyboard Handling in Editor ---
  codeEditor.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const spaces = "    ";

      this.value = this.value.substring(0, start) + spaces + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + spaces.length;
      updateLineNumbers(currentActiveLine);
    }
  });

  codeEditor.addEventListener("input", () => updateLineNumbers(currentActiveLine));
  codeEditor.addEventListener("scroll", syncScroll);

  // --- Template Selector ---
  if (templateSelect) {
    templateSelect.addEventListener("change", function () {
      loadTemplate(this.value);
    });
  }

  // --- Reset Code Button ---
  if (resetCodeBtn) {
    resetCodeBtn.addEventListener("click", function () {
      const currentSelected = templateSelect ? templateSelect.value : "bubble-sort";
      loadTemplate(currentSelected);
      appendConsole("Code editor reset to starter template.", "muted");

      if (submissionStatusBox && submissionStatusTitle && submissionStatusDesc) {
        submissionStatusBox.className = "submission-status-box";
        submissionStatusTitle.textContent = "No Submission Recorded";
        submissionStatusDesc.textContent =
          'Click "Submit Solution" to evaluate your code against the Practice Arena test suite when judging is connected.';
        if (submissionBadge) {
          submissionBadge.textContent = "Judging Engine Reserved";
          submissionBadge.className = "badge badge-pending";
        }
      }
    });
  }

  // --- Clear Console Button ---
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener("click", function () {
      consoleOutput.innerHTML = "";
    });
  }

  // (Run Code button handler wired after playback engine initialization)

  // --- Submit Solution Button ---
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      appendConsole("Submitting solution to ALGOLAB Practice Arena judging service...", "info");
      appendConsole(
        "Judging Service Unavailable: Automated test suite judging service has not been implemented yet (Practice Arena milestone).",
        "warn"
      );
      appendConsole(
        "Notice: In accordance with ALGOLAB integrity principles, submission verdicts (Accepted, Wrong Answer) and test case pass rates are never fabricated without a real judging service evaluating your code.",
        "muted"
      );

      if (submissionStatusBox && submissionStatusTitle && submissionStatusDesc) {
        submissionStatusBox.className = "submission-status-box status-pending";
        submissionStatusTitle.textContent = "Judging Service Unavailable (Practice Arena Milestone)";
        submissionStatusDesc.textContent =
          "The Practice Arena automated judging service has not been implemented yet. No test cases were evaluated, and no verdict is reported. Real judging results will appear here once the backend judging engine is connected.";
        if (submissionBadge) {
          submissionBadge.textContent = "Service Unavailable";
          submissionBadge.className = "badge badge-pending";
        }
      }
    });
  }

  // =====================================================
  // TRACE PLAYBACK ENGINE INTEGRATION (PHASE 2)
  // =====================================================

  // Create playback engine instance
  const engine = new TracePlaybackEngine({
    speedMs: 800,
    onStepChange: handleStepChange,
    onStatusChange: handleStatusChange,
    onError: handleTraceError,
    onTruncated: handleTraceTruncated
  });

  /**
   * Renders the current step into the UI.
   */
  function handleStepChange(step, index, total, isFirst, isLast) {
    if (!step) {
      // Clear indicators if no active step
      updateLineNumbers(null);
      renderVariablesTable({});
      renderArrayVisualizer({});
      renderExplanationPanel(null);
      if (stepCounterLabel) stepCounterLabel.textContent = "-- / --";
      if (traceSemanticsBanner) traceSemanticsBanner.style.display = "none";
      return;
    }

    // 1. Update step counter
    if (stepCounterLabel) {
      stepCounterLabel.textContent = `${index + 1} / ${total}`;
    }

    // 2. Highlight source line in editor gutter
    if (typeof step.line === "number") {
      updateLineNumbers(step.line);
    }

    // 3. Update trace semantics banner (state_before_line_execution)
    if (traceSemanticsBanner && semanticsDetails) {
      traceSemanticsBanner.style.display = "flex";
      traceSemanticsBanner.className = "trace-semantics-banner";
      semanticsDetails.textContent = `State captured BEFORE Line ${step.line} executes. Variables and array show values prior to executing this line.`;
    }

    // 4. Update button states
    if (prevBtn) prevBtn.disabled = isFirst;
    if (nextBtn) nextBtn.disabled = isLast;
    if (playBtn) playBtn.disabled = isLast && !engine.isPlaying;

    // 5. Render Variable & State Inspector safely
    renderVariablesTable(step.variables || {}, step.method || "main");

    // 6. Render Array Snapshots safely
    renderArrayVisualizer(step.arrays || {}, step.variables || {});

    // 7. Render Step Explanation safely (Phase 8)
    const prevStep = index > 0 ? engine.steps[index - 1] : null;
    const nextStep = index < total - 1 ? engine.steps[index + 1] : null;
    const explanation = generateStepExplanation({
      step,
      prevStep,
      nextStep,
      sourceCode: codeEditor.value,
      stepIndex: index,
      totalSteps: total
    });
    renderExplanationPanel(explanation);
  }

  /**
   * Safely renders the educational explanation into the explanation card.
   */
  function renderExplanationPanel(explanation) {
    if (!explanationWhatText) return;

    if (!explanation) {
      if (explanationCategory) explanationCategory.textContent = "Inactive";
      if (explanationStepNum) explanationStepNum.textContent = "Step -- / --";
      if (explanationLineBadge) explanationLineBadge.textContent = "Line --";
      if (explanationCodeText) explanationCodeText.textContent = "// Execute Java code or load demo trace to begin stepping";
      if (explanationWhatText) explanationWhatText.textContent = 'Click "Run Code" to compile, trace, and inspect your Java program.';
      if (explanationWhyText) explanationWhyText.textContent = "Each step captures variable values and array data immediately BEFORE the highlighted line runs.";
      if (explanationStateSummary) explanationStateSummary.style.display = "none";
      if (explanationChangeBanner) explanationChangeBanner.style.display = "none";
      if (explanationTip) explanationTip.style.display = "none";
      return;
    }

    if (explanationCategory) explanationCategory.textContent = explanation.category || "Execution Step";
    if (explanationStepNum) explanationStepNum.textContent = `Step ${explanation.stepNumber} / ${engine.steps.length}`;
    if (explanationLineBadge) explanationLineBadge.textContent = `Line ${explanation.lineNumber}`;
    if (explanationCodeText) explanationCodeText.textContent = explanation.lineCode;
    if (explanationWhatText) explanationWhatText.textContent = explanation.what;
    if (explanationWhyText) explanationWhyText.textContent = explanation.why;

    // State chips
    if (explanationStateSummary && explanationChips) {
      if (Array.isArray(explanation.stateChips) && explanation.stateChips.length > 0) {
        explanationChips.innerHTML = "";
        for (const chip of explanation.stateChips) {
          const chipEl = document.createElement("span");
          chipEl.className = "state-chip" + (chip.highlight ? " highlight" : "");

          const labelStrong = document.createElement("strong");
          labelStrong.textContent = chip.label + ":";
          chipEl.appendChild(labelStrong);

          const valSpan = document.createElement("span");
          valSpan.textContent = " " + chip.value;
          chipEl.appendChild(valSpan);

          explanationChips.appendChild(chipEl);
        }
        explanationStateSummary.style.display = "block";
      } else {
        explanationStateSummary.style.display = "none";
      }
    }

    // State change banner
    if (explanationChangeBanner && explanationChangeText) {
      if (explanation.stateChange) {
        explanationChangeText.textContent = "⚡ " + explanation.stateChange;
        explanationChangeBanner.style.display = "flex";
      } else {
        explanationChangeBanner.style.display = "none";
      }
    }

    // Pedagogical learning tip
    if (explanationTip && explanationTipText) {
      if (explanation.tip) {
        explanationTipText.textContent = explanation.tip;
        explanationTip.style.display = "flex";
      } else {
        explanationTip.style.display = "none";
      }
    }
  }

  /**
   * Updates playback status badges and controls.
   */
  function handleStatusChange(status, label) {
    if (traceStatusLabel) {
      traceStatusLabel.textContent = label || status;
    }

    if (playBtn && pauseBtn) {
      if (status === "playing") {
        playBtn.disabled = true;
        pauseBtn.disabled = false;
      } else if (status === "paused" || status === "ready") {
        playBtn.disabled = engine.isAtLastStep();
        pauseBtn.disabled = true;
      } else if (status === "completed" || status === "truncated") {
        playBtn.disabled = false; // allows replay
        pauseBtn.disabled = true;
      } else if (status === "error" || status === "empty" || status === "inactive") {
        playBtn.disabled = true;
        pauseBtn.disabled = true;
      }
    }
  }

  /**
   * Handles trace error events (compilation error, timeout).
   */
  function handleTraceError(errEvent) {
    appendConsole(`Trace Error: [${errEvent.errorType || "error"}] ${errEvent.message || "Unknown error"}`, "error");
    if (errEvent.details) {
      appendConsole(errEvent.details, "error");
    }

    if (traceSemanticsBanner && semanticsDetails) {
      traceSemanticsBanner.style.display = "flex";
      traceSemanticsBanner.className = "trace-semantics-banner error";
      semanticsDetails.textContent = `Trace Error (${errEvent.errorType || "error"}): ${errEvent.message}`;
    }

    if (playBtn) playBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = true;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
  }

  /**
   * Handles trace truncation events.
   */
  function handleTraceTruncated(truncEvent) {
    appendConsole(`Trace Notification: Trace truncated by engine. Reason: ${truncEvent.reason} (limit: ${truncEvent.limit})`, "warn");
    if (traceSemanticsBanner && semanticsDetails) {
      traceSemanticsBanner.className = "trace-semantics-banner warning";
      semanticsDetails.textContent = `⚠️ Trace capped at limit (${truncEvent.limit} steps). Subsequent steps were not recorded.`;
    }
  }

  /**
   * Safely renders variables into table using textContent.
   */
  function renderVariablesTable(variables, scope = "main") {
    if (!variablesTableBody) return;
    variablesTableBody.innerHTML = "";

    const varEntries = Object.entries(variables);
    if (varEntries.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "state-empty-cell";
      cell.textContent = "No local variables initialized in current frame.";
      row.appendChild(cell);
      variablesTableBody.appendChild(row);
      return;
    }

    for (const [varName, varData] of varEntries) {
      const row = document.createElement("tr");

      // Name
      const tdName = document.createElement("td");
      tdName.style.fontWeight = "600";
      tdName.textContent = varName;
      row.appendChild(tdName);

      // Type
      const tdType = document.createElement("td");
      tdType.style.color = "var(--color-text-light)";
      tdType.textContent = (varData && varData.type) ? varData.type : "unknown";
      row.appendChild(tdType);

      // Value
      const tdVal = document.createElement("td");
      tdVal.style.fontFamily = "Consolas, monospace";
      if (varData && varData.value !== undefined && varData.value !== null) {
        tdVal.textContent = String(varData.value);
        if (varData.truncated) {
          tdVal.textContent += "… (truncated)";
        }
      } else {
        tdVal.textContent = "null";
        tdVal.style.color = "var(--color-text-light)";
      }
      row.appendChild(tdVal);

      // Scope
      const tdScope = document.createElement("td");
      tdScope.style.color = "var(--color-text-light)";
      tdScope.textContent = scope;
      row.appendChild(tdScope);

      variablesTableBody.appendChild(row);
    }
  }

  /**
   * Safely renders arrays into visualization panel.
   */
  function renderArrayVisualizer(arrays, variables = {}) {
    if (!visualizationPanel) return;
    visualizationPanel.innerHTML = "";

    const arrayEntries = Object.entries(arrays);
    if (arrayEntries.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "trace-reservation-box";
      emptyBox.style.padding = "16px";
      emptyBox.style.marginBottom = "0";

      const title = document.createElement("h4");
      title.textContent = "No Array Data at Current Step";
      const desc = document.createElement("p");
      desc.textContent = "Arrays will be displayed here as boxes with indices and values as they are allocated.";

      emptyBox.appendChild(title);
      emptyBox.appendChild(desc);
      visualizationPanel.appendChild(emptyBox);
      return;
    }

    for (const [arrName, arrData] of arrayEntries) {
      const card = document.createElement("div");
      card.className = "array-viz-card";

      // Card Header
      const header = document.createElement("div");
      header.className = "array-viz-header";

      const titleSpan = document.createElement("strong");
      titleSpan.textContent = `${arrName} (${arrData.type || "array"}, length: ${arrData.length})`;
      header.appendChild(titleSpan);

      if (arrData.truncated) {
        const truncBadge = document.createElement("span");
        truncBadge.className = "badge badge-pending";
        truncBadge.textContent = "⚠️ Array Bounded";
        header.appendChild(truncBadge);
      }

      card.appendChild(header);

      // Array Cells Container
      const cellsContainer = document.createElement("div");
      cellsContainer.className = "array-viz-cells";

      const values = arrData.values || [];
      values.forEach((val, idx) => {
        const box = document.createElement("div");
        box.className = "array-cell-box";

        // Highlight cells corresponding to active variable indices (e.g., j or j+1 in Bubble Sort)
        if (
          (variables.j !== undefined && variables.j.value === idx) ||
          (variables.j !== undefined && variables.j.value + 1 === idx)
        ) {
          box.classList.add("highlight");
        }

        const valSpan = document.createElement("span");
        valSpan.className = "array-cell-val";
        valSpan.textContent = (val !== null && val !== undefined) ? String(val) : "null";
        box.appendChild(valSpan);

        const idxSpan = document.createElement("span");
        idxSpan.className = "array-cell-idx";
        idxSpan.textContent = `[${idx}]`;
        box.appendChild(idxSpan);

        cellsContainer.appendChild(box);
      });

      card.appendChild(cellsContainer);
      visualizationPanel.appendChild(card);
    }
  }

  // =====================================================
  // REAL JAVA EXECUTION BRIDGE (PHASE 7)
  // =====================================================

  const API_EXECUTE_URL = "http://127.0.0.1:3001/api/execute";
  let isExecuting = false;
  let currentExecutionId = 0;

  /**
   * Auto-detects public class name from student Java source.
   */
  function detectMainClass(source) {
    const match = source.match(/public\s+class\s+([A-Za-z_]\w*)/);
    return match ? match[1] : "Solution";
  }

  // --- Run Code Button ---
  if (runBtn) {
    runBtn.addEventListener("click", async function () {
      if (isExecuting) return;

      const code = codeEditor.value;
      if (!code || code.trim().length === 0) {
        appendConsole("Cannot run empty code. Please write Java code before running.", "warn");
        return;
      }

      const stdin = (stdinInput && stdinInput.value) ? stdinInput.value : "";
      const mainClass = detectMainClass(code);

      // Stop any current playback
      engine.pause();

      // UI Loading / Running State
      isExecuting = true;
      const executionId = ++currentExecutionId;
      runBtn.disabled = true;
      runBtn.textContent = "Running...";

      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = true;
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (traceResetBtn) traceResetBtn.disabled = true;

      if (traceModeBadge) {
        traceModeBadge.textContent = "Executing in isolated Docker sandbox...";
        traceModeBadge.className = "badge badge-pending";
      }
      if (traceStatusLabel) {
        traceStatusLabel.textContent = "Executing...";
      }
      if (stepCounterLabel) {
        stepCounterLabel.textContent = "-- / --";
      }
      if (traceSemanticsBanner) {
        traceSemanticsBanner.style.display = "none";
      }

      updateLineNumbers(null);
      appendConsole(`Submitting ${mainClass}.java to ALGOLAB execution service (Docker)...`, "info");

      try {
        const response = await fetch(API_EXECUTE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code,
            mainClass,
            stdin: stdin.length > 0 ? stdin : undefined
          })
        });

        // Guard against stale responses
        if (executionId !== currentExecutionId) return;

        let data = null;
        try {
          data = await response.json();
        } catch (_) {
          data = null;
        }

        if (!response.ok) {
          handleApiError(response.status, data);
          return;
        }

        handleExecutionSuccess(data, mainClass);

      } catch (err) {
        if (executionId !== currentExecutionId) return;

        appendConsole("Cannot connect to the Java execution server. Start the backend and try again.", "error");
        appendConsole("Hint: Run 'npm start' in backend/runner to start the API server on http://127.0.0.1:3001.", "muted");

        if (traceModeBadge) {
          traceModeBadge.textContent = "Execution Service Offline";
          traceModeBadge.className = "badge badge-error";
        }
        if (traceStatusLabel) {
          traceStatusLabel.textContent = "Connection Failed";
        }
        engine.loadTrace([]);
      } finally {
        if (executionId === currentExecutionId) {
          isExecuting = false;
          runBtn.disabled = false;
          runBtn.textContent = "Run Code";
        }
      }
    });
  }

  function handleApiError(status, data) {
    engine.loadTrace([]);

    if (status === 429) {
      appendConsole("Server Busy: Maximum concurrent container executions reached. Please try again shortly.", "warn");
      if (traceModeBadge) {
        traceModeBadge.textContent = "Server Busy (429)";
        traceModeBadge.className = "badge badge-pending";
      }
    } else if (status === 413) {
      appendConsole("Payload Too Large: Program code exceeds allowed submission size.", "error");
      if (traceModeBadge) {
        traceModeBadge.textContent = "Code Too Large (413)";
        traceModeBadge.className = "badge badge-error";
      }
    } else if (status === 503 || data?.outcome === "docker_unavailable") {
      appendConsole("Docker Service Unavailable: Ensure Docker Desktop is running and algolab-runner image is built.", "error");
      if (traceModeBadge) {
        traceModeBadge.textContent = "Docker Unavailable";
        traceModeBadge.className = "badge badge-error";
      }
    } else {
      appendConsole(`Execution Error (${status}): ${data?.error || "Unknown server error"}`, "error");
      if (traceModeBadge) {
        traceModeBadge.textContent = "Execution Error";
        traceModeBadge.className = "badge badge-error";
      }
    }

    if (traceStatusLabel) {
      traceStatusLabel.textContent = "Error";
    }
  }

  function handleExecutionSuccess(data, mainClass) {
    if (!data || typeof data !== "object") {
      appendConsole("Error: Invalid response format from execution service.", "error");
      engine.loadTrace([]);
      return;
    }

    switch (data.outcome) {
      case "compilation_error":
        engine.loadTrace([]);
        if (traceModeBadge) {
          traceModeBadge.textContent = "Compilation Error";
          traceModeBadge.className = "badge badge-error";
        }
        if (traceStatusLabel) {
          traceStatusLabel.textContent = "Compilation Error";
        }
        appendConsole("--- Compilation Failed ---", "error");
        if (data.errorEvent && data.errorEvent.message) {
          appendConsole(data.errorEvent.message, "error");
        }
        if (data.stderr) {
          appendConsole(data.stderr, "error");
        }

        // Highlight line if compiler diagnostic includes line number
        const compileLineMatch = (data.errorEvent?.message || data.stderr || "").match(/:(\d+):\s*error:/);
        if (compileLineMatch) {
          updateLineNumbers(parseInt(compileLineMatch[1], 10));
        }

        if (traceSemanticsBanner && semanticsDetails) {
          traceSemanticsBanner.style.display = "flex";
          traceSemanticsBanner.className = "trace-semantics-banner error";
          semanticsDetails.textContent = "Compilation Error: Code contains syntax errors. Fix errors before execution tracing.";
        }
        break;

      case "timeout":
        engine.loadTrace([]);
        if (traceModeBadge) {
          traceModeBadge.textContent = "Execution Timed Out";
          traceModeBadge.className = "badge badge-error";
        }
        if (traceStatusLabel) {
          traceStatusLabel.textContent = "Timed Out";
        }
        appendConsole("--- Execution Timed Out ---", "error");
        appendConsole("Execution exceeded safety time limit (potential infinite loop or excessive computation). Process was terminated.", "error");

        if (traceSemanticsBanner && semanticsDetails) {
          traceSemanticsBanner.style.display = "flex";
          traceSemanticsBanner.className = "trace-semantics-banner error";
          semanticsDetails.textContent = "Execution Timed Out: Execution was terminated by safety watchdog.";
        }
        break;

      case "runtime_error":
        engine.loadTrace([]);
        if (traceModeBadge) {
          traceModeBadge.textContent = "Runtime Error";
          traceModeBadge.className = "badge badge-error";
        }
        if (traceStatusLabel) {
          traceStatusLabel.textContent = "Runtime Error";
        }
        appendConsole("--- Runtime Error ---", "error");
        if (data.errorEvent && data.errorEvent.message) {
          appendConsole(data.errorEvent.message, "error");
        }
        if (data.stderr) {
          appendConsole(data.stderr, "error");
        }
        break;

      case "success":
      default:
        // 1. Display stdout
        if (data.exitEvent && typeof data.exitEvent.stdout === "string" && data.exitEvent.stdout.length > 0) {
          appendConsole("--- Program Output (stdout) ---", "muted");
          appendConsole(data.exitEvent.stdout, "info");
        } else {
          appendConsole("--- Program Output (stdout) --- [No output produced]", "muted");
        }

        if (data.stdoutTruncated) {
          appendConsole("⚠️ Program standard output exceeded maximum buffer and was truncated.", "warn");
        }

        appendConsole(`Execution complete (exit code ${data.containerExitCode}). Captured ${data.stepCount} genuine execution steps.`, "info");

        // 2. Update Trace Mode Badge
        if (traceModeBadge) {
          traceModeBadge.textContent = "Live Execution Trace (Genuine JDI)";
          traceModeBadge.className = "badge badge-success";
        }

        // 3. Enable playback controls
        if (traceResetBtn) traceResetBtn.disabled = false;
        if (traceSpeedRange) traceSpeedRange.disabled = false;

        // 4. Load genuine trace events into playback engine
        engine.loadTrace(data.events || []);
        break;
    }
  }

  // --- Fixture Loader Button ---
  if (loadFixtureBtn && fixtureSelect) {
    loadFixtureBtn.addEventListener("click", function () {
      const selected = fixtureSelect.value;
      let fixtureData = BUBBLE_SORT_TRACE_FIXTURE;
      let label = "Bubble Sort JDI Trace";

      if (selected === "bubble-sort") {
        fixtureData = BUBBLE_SORT_TRACE_FIXTURE;
        label = "Bubble Sort (Genuine JDI Trace - 72 steps)";
        loadTemplate("bubble-sort");
      } else if (selected === "single-step") {
        fixtureData = SINGLE_STEP_FIXTURE;
        label = "Single Step Trace (1 step)";
      } else if (selected === "truncated") {
        fixtureData = TRUNCATED_TRACE_FIXTURE;
        label = "Truncated Trace (5 steps)";
      } else if (selected === "timeout-error") {
        fixtureData = TIMEOUT_ERROR_FIXTURE;
        label = "Timeout Error Trace";
      } else if (selected === "compilation-error") {
        fixtureData = COMPILATION_ERROR_FIXTURE;
        label = "Compilation Error Trace";
      } else if (selected === "empty") {
        fixtureData = EMPTY_TRACE_FIXTURE;
        label = "Empty Trace";
      }

      appendConsole(`Loading pre-recorded test fixture: ${label}...`, "info");
      appendConsole("Note: This is a pre-recorded JDI test fixture for playback evaluation. It does not represent live code execution.", "muted");

      // Enable playback controls
      if (traceResetBtn) traceResetBtn.disabled = false;
      if (traceSpeedRange) traceSpeedRange.disabled = false;
      if (traceModeBadge) {
        traceModeBadge.textContent = "Pre-recorded JDI Test Fixture";
        traceModeBadge.className = "badge badge-info";
      }

      // Load trace into engine
      engine.loadTrace(fixtureData);
    });
  }

  // --- Wire Playback Controls ---
  if (playBtn) {
    playBtn.addEventListener("click", () => engine.play());
  }
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => engine.pause());
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => engine.stepPrev());
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => engine.stepNext());
  }
  if (traceResetBtn) {
    traceResetBtn.addEventListener("click", () => engine.reset());
  }
  if (traceSpeedRange) {
    traceSpeedRange.addEventListener("input", function () {
      engine.setSpeed(Number(this.value));
    });
  }

  // --- Initial Page Setup ---
  loadTemplate("bubble-sort");
  appendConsole("ALGOLAB Code Lab initialized. Ready for editing.", "info");
  appendConsole("Select a template or write your custom Java code.", "muted");
  appendConsole("Tip: Click 'Load Demo Trace' to evaluate the Phase 2 Trace Playback Engine with pre-recorded JDI events.", "info");
});
