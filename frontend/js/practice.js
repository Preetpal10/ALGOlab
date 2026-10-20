// =============================================================================
// ALGOLAB — Practice Arena Frontend Controller (Phase 14)
//
// Manages problem catalog rendering, filtering, Java code editing, sample test
// execution, and automated submission evaluation against the backend judging engine.
// =============================================================================

import { resolveApiConfig, checkBackendHealth } from './api-config.js';

export const CODE_TRANSFER_KEY = 'algolab_codelab_transfer';

/**
 * Prepares a structured payload for transferring code and problem context
 * from Practice Arena to Code Lab.
 */
export function prepareCodeTransfer(code, problem = null) {
  if (typeof code !== 'string') return null;
  return {
    code,
    problemId: problem?.id || null,
    problemTitle: problem?.title || null,
    timestamp: Date.now()
  };
}

/**
 * Safely saves code transfer data to the specified web storage instance.
 */
export function saveCodeTransferToStorage(storage, code, problem = null) {
  try {
    if (!storage) return false;
    const payload = prepareCodeTransfer(code, problem);
    if (!payload) return false;
    storage.setItem(CODE_TRANSFER_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to save code transfer to storage:', err);
    return false;
  }
}

/**
 * Gets storage key for problem draft.
 */
export function getPracticeDraftKey(problemId) {
  return `algolab_practice_draft_${problemId}`;
}

/**
 * Saves a separate code draft for a specific problem.
 */
export function savePracticeDraft(storage, problemId, code) {
  try {
    if (!storage || !problemId || typeof code !== 'string') return false;
    storage.setItem(getPracticeDraftKey(problemId), code);
    return true;
  } catch (err) {
    console.warn('Failed to save practice draft:', err);
    return false;
  }
}

/**
 * Loads a saved code draft for a specific problem.
 */
export function loadPracticeDraft(storage, problemId) {
  try {
    if (!storage || !problemId) return null;
    return storage.getItem(getPracticeDraftKey(problemId));
  } catch (_) {
    return null;
  }
}

/**
 * Clears saved code draft for a specific problem.
 */
export function clearPracticeDraft(storage, problemId) {
  try {
    if (!storage || !problemId) return false;
    storage.removeItem(getPracticeDraftKey(problemId));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Restores starter code for a specific problem, updates editor, and clears problem draft.
 */
export function resetPracticeProblem(storage, problem, editorElement = null) {
  if (!problem) return null;
  const starterCode = problem.starterCode || '';
  if (editorElement) {
    editorElement.value = starterCode;
  }
  if (storage) {
    clearPracticeDraft(storage, problem.id);
  }
  return starterCode;
}

/**
 * Derives user-facing judge status text, CSS badge classes, and reachability.
 */
export function getJudgeStatusDescriptor(healthResult, apiConfig) {
  if (!apiConfig || !apiConfig.healthUrl || apiConfig.mode === 'offline-demo') {
    return {
      text: 'Offline Mode',
      className: 'status-badge badge-pending',
      online: false,
      details: 'No backend API configured. Running in offline demo mode.'
    };
  }
  if (healthResult === null || healthResult === undefined) {
    return {
      text: 'Checking...',
      className: 'status-badge badge-pending',
      online: false,
      details: 'Checking execution service availability...'
    };
  }
  if (healthResult.ok) {
    return {
      text: 'Judge Online',
      className: 'status-badge badge-settled',
      online: true,
      details: 'Backend execution service reachable.'
    };
  }
  const isTimeout = healthResult.error && /time/i.test(healthResult.error);
  const isDockerErr = healthResult.status === 503 || (healthResult.data && healthResult.data.outcome === 'docker_unavailable');
  return {
    text: isDockerErr ? 'Judge Unavailable' : (isTimeout ? 'Backend Timeout' : 'Backend Offline'),
    className: 'status-badge badge-empty',
    online: false,
    details: healthResult.error || `HTTP ${healthResult.status || 'Offline'}`
  };
}

// Fallback public problem definitions (contains only visible sample test cases)
const LOCAL_PUBLIC_PROBLEMS = [
  {
    id: 'reverse-array',
    title: 'Reverse an Array',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array of integers, reverse the array in-place or print the elements in reverse order separated by spaces.',
    constraints: [
      '1 <= N <= 1000 (Number of elements)',
      '-10^5 <= arr[i] <= 10^5'
    ],
    inputFormat:
      'Line 1: An integer N representing the size of the array.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the N reversed elements on a single line separated by space.',
    sampleCases: [
      {
        id: 1,
        input: '5\n1 2 3 4 5',
        expectedOutput: '5 4 3 2 1',
        explanation: 'The reverse of [1, 2, 3, 4, 5] is [5, 4, 3, 2, 1].'
      },
      {
        id: 2,
        input: '3\n10 20 30',
        expectedOutput: '30 20 10',
        explanation: 'The reverse of [10, 20, 30] is [30, 20, 10].'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Print the reversed array elements separated by spaces

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },
  {
    id: 'find-largest',
    title: 'Find Largest Element',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array of integers, find and print the maximum element present in the array.',
    constraints: [
      '1 <= N <= 1000',
      '-10^6 <= arr[i] <= 10^6'
    ],
    inputFormat:
      'Line 1: An integer N representing the array size.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the single maximum integer value.',
    sampleCases: [
      {
        id: 1,
        input: '5\n3 9 1 7 4',
        expectedOutput: '9',
        explanation: '9 is the largest element among 3, 9, 1, 7, 4.'
      },
      {
        id: 2,
        input: '3\n15 8 15',
        expectedOutput: '15',
        explanation: '15 is the maximum value.'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Find and print the maximum value in arr

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },
  {
    id: 'linear-search',
    title: 'Linear Search',
    difficulty: 'Easy',
    topic: 'Searching',
    description:
      'Given an array of N integers and a target value K, find the 0-based index of the first occurrence of K. If K is not present in the array, print -1.',
    constraints: [
      '1 <= N <= 1000',
      '-10^5 <= arr[i], K <= 10^5'
    ],
    inputFormat:
      'Line 1: Two integers N and K.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the 0-based index of K, or -1 if K is absent.',
    sampleCases: [
      {
        id: 1,
        input: '5 7\n2 4 7 9 1',
        expectedOutput: '2',
        explanation: 'Value 7 is located at index 2.'
      },
      {
        id: 2,
        input: '4 10\n1 3 5 7',
        expectedOutput: '-1',
        explanation: 'Value 10 is not found in the array.'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Scan sequentially to find target and print its first 0-based index or -1

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    topic: 'Searching',
    description:
      'Given an array of N distinct integers sorted in ascending order and a target value K, find the 0-based index of K using binary search. If K does not exist, print -1.',
    constraints: [
      '1 <= N <= 1000',
      'Array elements are strictly ascending: arr[0] < arr[1] < ... < arr[N-1]',
      '-10^5 <= arr[i], K <= 10^5'
    ],
    inputFormat:
      'Line 1: Two integers N and K.\nLine 2: N space-separated integers in sorted order.',
    outputFormat:
      'Print the 0-based index of K, or -1 if not found.',
    sampleCases: [
      {
        id: 1,
        input: '6 12\n2 5 8 12 16 23',
        expectedOutput: '3',
        explanation: '12 is at index 3.'
      },
      {
        id: 2,
        input: '5 9\n1 3 5 7 11',
        expectedOutput: '-1',
        explanation: '9 is not present in the array.'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Use binary search (low <= high) to find target in O(log N)

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },
  {
    id: 'move-zeros',
    title: 'Move Zeros to End',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    description:
      'Given an array of integers, move all 0s to the end of the array while maintaining the relative order of the non-zero elements. Print the resulting array.',
    constraints: [
      '1 <= N <= 1000',
      '-10^4 <= arr[i] <= 10^4'
    ],
    inputFormat:
      'Line 1: An integer N.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the transformed array elements separated by space.',
    sampleCases: [
      {
        id: 1,
        input: '5\n0 1 0 3 12',
        expectedOutput: '1 3 12 0 0',
        explanation: 'All zeros are shifted to the end; non-zero [1, 3, 12] retain their order.'
      },
      {
        id: 2,
        input: '3\n0 0 1',
        expectedOutput: '1 0 0',
        explanation: 'The non-zero 1 moves to the front, followed by two zeros.'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Shift all zeros to the end while preserving order of non-zeros

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  }
];

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const topicFilter = document.getElementById('topic-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const problemList = document.getElementById('problem-list');

    const problemTitle = document.getElementById('problem-title');
    const problemTopicBadge = document.getElementById('problem-topic-badge');
    const problemDifficultyBadge = document.getElementById('problem-difficulty-badge');
    const problemDesc = document.getElementById('problem-desc');
    const problemInputFormat = document.getElementById('problem-input-format');
    const problemOutputFormat = document.getElementById('problem-output-format');
    const problemConstraints = document.getElementById('problem-constraints');
    const problemSampleCases = document.getElementById('problem-sample-cases');
    const openInCodelabBtn = document.getElementById('open-in-codelab-btn');

    const solutionEditor = document.getElementById('solution-editor');
    const resetCodeBtn = document.getElementById('reset-code-btn');
    const runSamplesBtn = document.getElementById('run-samples-btn');
    const submitSolutionBtn = document.getElementById('submit-solution-btn');
    const backendStatusIndicator = document.getElementById('backend-status-indicator');

    const verdictBanner = document.getElementById('verdict-banner');
    const verdictBadge = document.getElementById('verdict-badge');
    const verdictTime = document.getElementById('verdict-time');
    const verdictTitle = document.getElementById('verdict-title');
    const verdictMessage = document.getElementById('verdict-message');
    const testCasesDetails = document.getElementById('test-cases-details');

    let apiConfig = resolveApiConfig();
    let currentProblems = LOCAL_PUBLIC_PROBLEMS;
    let selectedProblem = currentProblems[0];
    let isEvaluating = false;

    let isCheckingHealth = false;

    // Check backend health
    async function updateBackendStatus() {
      if (!backendStatusIndicator) return;
      if (!apiConfig.judgeUrl || apiConfig.mode === 'offline-demo') {
        const desc = getJudgeStatusDescriptor(null, apiConfig);
        backendStatusIndicator.textContent = desc.text;
        backendStatusIndicator.className = desc.className;
        return;
      }

      if (isCheckingHealth) return;
      isCheckingHealth = true;

      const checkingDesc = getJudgeStatusDescriptor(null, apiConfig);
      backendStatusIndicator.textContent = checkingDesc.text;
      backendStatusIndicator.className = checkingDesc.className;

      try {
        const health = await checkBackendHealth(apiConfig.healthUrl);
        const desc = getJudgeStatusDescriptor(health, apiConfig);
        backendStatusIndicator.textContent = desc.text;
        backendStatusIndicator.className = desc.className;
      } catch (err) {
        backendStatusIndicator.textContent = 'Backend Offline';
        backendStatusIndicator.className = 'status-badge badge-empty';
      } finally {
        isCheckingHealth = false;
      }
    }

    // Try to fetch latest public problems from backend
    async function loadProblems() {
      if (apiConfig.problemsUrl) {
        try {
          const res = await fetch(apiConfig.problemsUrl);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.problems) && data.problems.length > 0) {
              currentProblems = data.problems;
            }
          }
        } catch (_) {
          // Fallback to local catalog
        }
      }

      // Check URL search params for ?problem=id
      const params = new URLSearchParams(window.location.search);
      const urlProblemId = params.get('problem');
      const found = currentProblems.find(p => p.id === urlProblemId);
      if (found) {
        selectedProblem = found;
      } else {
        selectedProblem = currentProblems[0];
      }

      renderProblemList();
      renderSelectedProblem();
    }

    // Render problem selection cards
    function renderProblemList() {
      if (!problemList) return;
      const topic = topicFilter?.value || 'all';
      const diff = difficultyFilter?.value || 'all';

      const filtered = currentProblems.filter(p => {
        if (topic !== 'all' && p.topic !== topic) return false;
        if (diff !== 'all' && p.difficulty !== diff) return false;
        return true;
      });

      if (filtered.length === 0) {
        problemList.innerHTML = '<div style="padding: 10px; color: #94a3b8; font-size: 0.85rem; font-style: italic;">No problems match selected filters.</div>';
        return;
      }

      let html = '';
      for (const p of filtered) {
        const isSelected = p.id === selectedProblem.id;
        const diffBadgeClass = p.difficulty === 'Easy' ? 'badge-easy' : 'badge-medium';
        html += `
          <div class="problem-card ${isSelected ? 'active' : ''}" data-id="${p.id}">
            <div class="problem-card-title">${p.title}</div>
            <div class="problem-card-meta">
              <span class="problem-topic-tag">${p.topic}</span>
              <span class="status-badge ${diffBadgeClass}">${p.difficulty}</span>
            </div>
          </div>
        `;
      }
      problemList.innerHTML = html;

      // Add click handlers
      problemList.querySelectorAll('.problem-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          const p = currentProblems.find(item => item.id === id);
          if (p && p.id !== selectedProblem.id) {
            // Save outgoing problem draft before switching only if modified
            if (solutionEditor && selectedProblem) {
              const currentVal = solutionEditor.value;
              const storage = typeof window !== 'undefined' ? window.localStorage : null;
              if (currentVal === selectedProblem.starterCode) {
                // If code is unchanged from starter code, ensure draft stays cleared
                clearPracticeDraft(storage, selectedProblem.id);
              } else {
                savePracticeDraft(storage, selectedProblem.id, currentVal);
              }
            }
            selectedProblem = p;
            renderProblemList();
            renderSelectedProblem();
          }
        });
      });
    }

    // Render detailed problem statement in left card
    function renderSelectedProblem() {
      if (!selectedProblem) return;

      if (problemTitle) problemTitle.textContent = selectedProblem.title;
      if (problemTopicBadge) problemTopicBadge.textContent = selectedProblem.topic;
      if (problemDifficultyBadge) {
        problemDifficultyBadge.textContent = selectedProblem.difficulty;
        problemDifficultyBadge.className = `status-badge ${selectedProblem.difficulty === 'Easy' ? 'badge-easy' : 'badge-medium'}`;
      }
      if (problemDesc) problemDesc.textContent = selectedProblem.description;
      if (problemInputFormat) problemInputFormat.textContent = selectedProblem.inputFormat;
      if (problemOutputFormat) problemOutputFormat.textContent = selectedProblem.outputFormat;

      if (problemConstraints) {
        problemConstraints.innerHTML = selectedProblem.constraints
          .map(c => `<li><code>${c}</code></li>`)
          .join('');
      }

      if (problemSampleCases) {
        let html = '';
        for (const sc of selectedProblem.sampleCases) {
          html += `
            <div class="sample-case-box">
              <div style="font-weight: 700; font-size: 0.8rem; color: #475569; margin-bottom: 4px;">Sample Case #${sc.id}:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--color-text-light); font-weight: 600;">Input:</label>
                  <pre class="format-pre" style="margin: 0; padding: 6px;">${sc.input}</pre>
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--color-text-light); font-weight: 600;">Output:</label>
                  <pre class="format-pre" style="margin: 0; padding: 6px;">${sc.expectedOutput}</pre>
                </div>
              </div>
              ${sc.explanation ? `<div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;"><em>Explanation:</em> ${sc.explanation}</div>` : ''}
            </div>
          `;
        }
        problemSampleCases.innerHTML = html;
      }

      if (openInCodelabBtn) {
        openInCodelabBtn.href = `codelab.html?problem=${selectedProblem.id}`;
      }

      // Populate draft or starter code in editor
      if (solutionEditor) {
        const savedDraft = loadPracticeDraft(typeof window !== 'undefined' ? window.localStorage : null, selectedProblem.id);
        if (typeof savedDraft === 'string' && savedDraft.trim().length > 0) {
          solutionEditor.value = savedDraft;
        } else {
          solutionEditor.value = selectedProblem.starterCode;
        }
      }

      // Reset verdict banner
      resetVerdict();
    }

    function resetVerdict() {
      if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-idle';
      if (verdictBadge) {
        verdictBadge.textContent = 'No Submission';
        verdictBadge.className = 'status-badge badge-empty';
      }
      if (verdictTime) verdictTime.textContent = '—';
      if (verdictTitle) verdictTitle.textContent = 'Ready for Evaluation';
      if (verdictMessage) {
        verdictMessage.textContent = 'Click Run Sample Tests to verify visible examples, or Submit Solution to judge your code against all test cases.';
      }
      if (testCasesDetails) testCasesDetails.innerHTML = '';
    }

    function setEvaluatingState(modeText) {
      isEvaluating = true;
      if (runSamplesBtn) runSamplesBtn.disabled = true;
      if (submitSolutionBtn) submitSolutionBtn.disabled = true;
      if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-running';
      if (verdictBadge) {
        verdictBadge.textContent = 'Evaluating...';
        verdictBadge.className = 'status-badge badge-pending';
      }
      if (verdictTime) verdictTime.textContent = 'Running...';
      if (verdictTitle) verdictTitle.textContent = `${modeText} in Progress`;
      if (verdictMessage) verdictMessage.textContent = 'Executing solution in isolated Docker container...';
      if (testCasesDetails) testCasesDetails.innerHTML = '';
    }

    function clearEvaluatingState() {
      isEvaluating = false;
      if (runSamplesBtn) runSamplesBtn.disabled = false;
      if (submitSolutionBtn) submitSolutionBtn.disabled = false;
    }

    // Run Sample Tests Handler
    if (runSamplesBtn) {
      runSamplesBtn.addEventListener('click', async () => {
        if (isEvaluating) return;
        const code = solutionEditor?.value || '';
        if (!code.trim()) {
          alert('Solution code cannot be empty.');
          return;
        }

        if (!apiConfig.judgeUrl) {
          alert('Judge service is unavailable in Offline Demo Mode. Run local backend with "npm start" in backend/runner.');
          return;
        }

        setEvaluatingState('Sample Test Evaluation');

        try {
          const res = await fetch(apiConfig.judgeUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              problemId: selectedProblem.id,
              code,
              mode: 'sample'
            })
          });

          if (res.status === 503 && backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Judge Unavailable';
            backendStatusIndicator.className = 'status-badge badge-empty';
          } else if (res.ok && backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Judge Online';
            backendStatusIndicator.className = 'status-badge badge-settled';
          }

          const data = await res.json();
          renderSampleResults(data);
        } catch (err) {
          renderErrorBanner(`Connection to judging service failed: ${err.message}`);
          if (backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Backend Offline';
            backendStatusIndicator.className = 'status-badge badge-empty';
          }
        } finally {
          clearEvaluatingState();
        }
      });
    }

    // Submit Solution Handler
    if (submitSolutionBtn) {
      submitSolutionBtn.addEventListener('click', async () => {
        if (isEvaluating) return;
        const code = solutionEditor?.value || '';
        if (!code.trim()) {
          alert('Solution code cannot be empty.');
          return;
        }

        if (!apiConfig.judgeUrl) {
          alert('Judge service is unavailable in Offline Demo Mode. Run local backend with "npm start" in backend/runner.');
          return;
        }

        setEvaluatingState('Full Submission Judging');

        try {
          const res = await fetch(apiConfig.judgeUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              problemId: selectedProblem.id,
              code,
              mode: 'submit'
            })
          });

          if (res.status === 503 && backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Judge Unavailable';
            backendStatusIndicator.className = 'status-badge badge-empty';
          } else if (res.ok && backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Judge Online';
            backendStatusIndicator.className = 'status-badge badge-settled';
          }

          const data = await res.json();
          renderSubmissionResults(data);
        } catch (err) {
          renderErrorBanner(`Connection to judging service failed: ${err.message}`);
          if (backendStatusIndicator) {
            backendStatusIndicator.textContent = 'Backend Offline';
            backendStatusIndicator.className = 'status-badge badge-empty';
          }
        } finally {
          clearEvaluatingState();
        }
      });
    }

    // Render results from sample test execution
    function renderSampleResults(data) {
      if (!data || data.verdict === 'Judging Error') {
        renderErrorBanner(data?.error || 'Judging error occurred.');
        return;
      }

      const allPassed = data.passedCount === data.totalCount && data.verdict === 'Accepted';
      if (verdictBanner) {
        verdictBanner.className = `verdict-banner ${allPassed ? 'verdict-accepted' : 'verdict-failed'}`;
      }
      if (verdictBadge) {
        verdictBadge.textContent = data.verdict;
        verdictBadge.className = `status-badge ${allPassed ? 'badge-settled' : 'badge-empty'}`;
      }
      if (verdictTime) {
        verdictTime.textContent = `${data.executionTimeMs || 0} ms`;
      }
      if (verdictTitle) {
        verdictTitle.textContent = allPassed
          ? 'All Sample Tests Passed!'
          : `Sample Tests: ${data.passedCount} / ${data.totalCount} Passed`;
      }
      if (verdictMessage) {
        verdictMessage.textContent = allPassed
          ? 'Your solution produced the expected output for all visible sample cases. Ready to submit!'
          : (data.error || 'One or more sample test cases failed. Inspect the inputs and outputs below.');
      }

      // Render each sample case detail
      if (testCasesDetails && Array.isArray(data.sampleResults)) {
        let html = '<div class="sample-results-list">';
        for (const sr of data.sampleResults) {
          const passed = sr.passed;
          html += `
            <div class="sample-result-card ${passed ? 'card-passed' : 'card-failed'}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.85rem;">Sample Case #${sr.testNumber}</strong>
                <span class="status-badge ${passed ? 'badge-settled' : 'badge-empty'}">${passed ? 'Passed' : 'Failed'}</span>
              </div>
              <div style="font-size: 0.78rem; font-family: Consolas, monospace; background: #ffffff; padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                <div><span style="color: #64748b;">Input:</span> <code>${sr.input}</code></div>
                <div><span style="color: #64748b;">Expected:</span> <code>${sr.expectedOutput}</code></div>
                <div><span style="color: #64748b;">Actual:</span> <code style="color: ${passed ? '#15803d' : '#b91c1c'}; font-weight: 700;">${sr.actualOutput || '(no output)'}</code></div>
              </div>
            </div>
          `;
        }
        html += '</div>';
        testCasesDetails.innerHTML = html;
      }
    }

    // Render results from full submission judging
    function renderSubmissionResults(data) {
      if (!data || data.verdict === 'Judging Error') {
        renderErrorBanner(data?.error || 'Judging error occurred.');
        return;
      }

      const isAccepted = data.verdict === 'Accepted';
      if (verdictBanner) {
        verdictBanner.className = `verdict-banner ${isAccepted ? 'verdict-accepted' : 'verdict-failed'}`;
      }
      if (verdictBadge) {
        verdictBadge.textContent = data.verdict;
        verdictBadge.className = `status-badge ${isAccepted ? 'badge-settled' : 'badge-empty'}`;
      }
      if (verdictTime) {
        verdictTime.textContent = `${data.executionTimeMs || 0} ms`;
      }
      if (verdictTitle) {
        verdictTitle.textContent = isAccepted
          ? 'Accepted — All Tests Passed!'
          : `${data.verdict} (Test #${data.failedTestCase || 1})`;
      }
      if (verdictMessage) {
        if (isAccepted) {
          verdictMessage.textContent = `Excellent! Your solution passed all ${data.totalCount} test cases (visible samples and hidden evaluation tests).`;
        } else {
          verdictMessage.textContent = data.error || `Failed on test case ${data.failedTestCase}. Passed: ${data.passedCount} / ${data.totalCount}`;
        }
      }

      if (testCasesDetails) {
        if (isAccepted) {
          testCasesDetails.innerHTML = `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; font-size: 0.88rem; color: #166534;">
              <strong>Summary:</strong> Passed 100% of test cases (${data.totalCount}/${data.totalCount}). Time: ${data.executionTimeMs}ms.
            </div>
          `;
        } else {
          testCasesDetails.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; font-size: 0.85rem; color: #991b1b;">
              <div style="font-weight: 700; margin-bottom: 4px;">Verdict Details:</div>
              <div>Failed on Test Case #${data.failedTestCase || 1}</div>
              <div style="margin-top: 4px;"><strong>Tests Passed:</strong> ${data.passedCount} / ${data.totalCount}</div>
              ${data.input && data.input !== '[Hidden Test Case]' ? `
                <div style="margin-top: 6px; font-family: Consolas, monospace; font-size: 0.8rem;">
                  <div>Input: ${data.input}</div>
                  <div>Expected: ${data.expectedOutput}</div>
                  <div>Actual: ${data.actualOutput}</div>
                </div>
              ` : `
                <div style="margin-top: 6px; font-style: italic; color: #b91c1c; font-size: 0.8rem;">
                  Note: Failed test details are hidden to maintain integrity and prevent hardcoded solutions.
                </div>
              `}
            </div>
          `;
        }
      }
    }

    function renderErrorBanner(errorMessage) {
      if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-failed';
      if (verdictBadge) {
        verdictBadge.textContent = 'Judging Error';
        verdictBadge.className = 'status-badge badge-empty';
      }
      if (verdictTime) verdictTime.textContent = '—';
      if (verdictTitle) verdictTitle.textContent = 'Evaluation Error';
      if (verdictMessage) verdictMessage.textContent = errorMessage;
      if (testCasesDetails) testCasesDetails.innerHTML = '';
    }

    // Input listener to auto-persist drafts per problem
    if (solutionEditor) {
      solutionEditor.addEventListener('input', () => {
        if (selectedProblem) {
          savePracticeDraft(typeof window !== 'undefined' ? window.localStorage : null, selectedProblem.id, solutionEditor.value);
        }
      });
    }

    // Reset code button
    if (resetCodeBtn) {
      resetCodeBtn.addEventListener('click', () => {
        const confirmed = typeof window === 'undefined' || typeof window.confirm !== 'function'
          ? true
          : window.confirm('Reset editor to original starter code? Any unsaved edits will be lost.');
        if (confirmed) {
          if (solutionEditor && selectedProblem) {
            resetPracticeProblem(
              typeof window !== 'undefined' ? window.localStorage : null,
              selectedProblem,
              solutionEditor
            );
            resetVerdict();
          }
        }
      });
    }

    // Open in Code Lab transfer handler
    if (openInCodelabBtn) {
      openInCodelabBtn.addEventListener('click', () => {
        const currentCode = solutionEditor ? solutionEditor.value : (selectedProblem?.starterCode || '');
        if (selectedProblem) {
          savePracticeDraft(typeof window !== 'undefined' ? window.localStorage : null, selectedProblem.id, currentCode);
        }
        saveCodeTransferToStorage(sessionStorage, currentCode, selectedProblem);
      });
    }

    // Filter listeners
    if (topicFilter) topicFilter.addEventListener('change', renderProblemList);
    if (difficultyFilter) difficultyFilter.addEventListener('change', renderProblemList);

    // Initial boot
    await updateBackendStatus();
    await loadProblems();
  });
}
