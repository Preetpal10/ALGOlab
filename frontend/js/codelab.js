// =====================================================
// ALGOLAB - codelab.js
// Phase 1: Code Lab UI Controller
//
// Manages the student code editor, templates, console,
// and honest feedback states (no fabricated execution).
// =====================================================

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

  if (!codeEditor || !lineNumbers || !consoleOutput) {
    return; // Exit if not on Code Lab page
  }

  // Starter Java templates for students
  const TEMPLATES = {
    "bubble-sort": `// ALGOLAB - Bubble Sort in Java
public class Solution {
    public static void main(String[] args) {
        int[] arr = { 64, 34, 25, 12, 22, 11, 90 };
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
   * Updates line numbers gutter based on current textarea text.
   */
  function updateLineNumbers() {
    const text = codeEditor.value;
    const lines = text.split("\n");
    const count = lines.length;

    let numbersHtml = "";
    for (let i = 1; i <= count; i++) {
      numbersHtml += i + "\n";
    }
    lineNumbers.textContent = numbersHtml;

    if (editorStats) {
      editorStats.textContent = `Language: Java | Lines: ${count}`;
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
    updateLineNumbers();
    codeEditor.scrollTop = 0;
  }

  /**
   * Appends a message to the console panel.
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
    // Handle Tab key for clean indentation (4 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const spaces = "    ";

      this.value = this.value.substring(0, start) + spaces + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + spaces.length;
      updateLineNumbers();
    }
  });

  codeEditor.addEventListener("input", updateLineNumbers);
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

      // Reset submission status area to initial state
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

  // --- Run Code Button ---
  // In Phase 1, no execution backend exists.
  // Real Java execution requires the Phase 3 backend execution service.
  // We explicitly inform the user without fabricating fake output.
  if (runBtn) {
    runBtn.addEventListener("click", function () {
      appendConsole("Submitting Java program for execution...", "info");
      appendConsole(
        "Execution Service Unavailable: Java backend execution service has not been implemented yet (Phase 1 UI Milestone).",
        "warn"
      );
      appendConsole(
        "Notice: A real sandboxed Java runner is required to compile and execute student code. In accordance with ALGOLAB principles, execution results and runtime traces are not fabricated.",
        "muted"
      );
    });
  }

  // --- Submit Solution Button ---
  // Intended for submitting code to the future ALGOLAB Practice Arena judging service.
  // In Phase 1, the judging engine and backend evaluation service have not been built.
  // We provide honest status feedback without fabricating verdicts or test outcomes.
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      appendConsole("Submitting solution to ALGOLAB Practice Arena judging service...", "info");
      appendConsole(
        "Judging Service Unavailable: Automated test suite judging service has not been implemented yet (Practice Arena milestone).",
        "warn"
      );
      appendConsole(
        "Notice: In accordance with ALGOLAB integrity principles, submission verdicts (Accepted, Wrong Answer, Time Limit Exceeded) and test case pass rates are never fabricated without a real judging service evaluating your code.",
        "muted"
      );

      if (submissionStatusBox && submissionStatusTitle && submissionStatusDesc) {
        submissionStatusBox.className = "submission-status-box status-pending";
        submissionStatusTitle.textContent = "Judging Service Unavailable (Practice Arena Milestone)";
        submissionStatusDesc.textContent =
          "The Practice Arena automated judging service has not been implemented yet. No test cases were evaluated, and no verdict (Accepted / Wrong Answer) is reported. Real judging results will appear here once the backend judging engine is connected.";
        if (submissionBadge) {
          submissionBadge.textContent = "Service Unavailable";
          submissionBadge.className = "badge badge-pending";
        }
      }
    });
  }

  // --- Initial Page Setup ---
  loadTemplate("bubble-sort");
  appendConsole("ALGOLAB Code Lab initialized. Ready for editing.", "info");
  appendConsole("Select a template or write your custom Java code.", "muted");
});
