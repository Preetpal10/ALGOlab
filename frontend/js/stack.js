// =============================================================================
// ALGOLAB - stack.js
// Phase 10.1: Stack Data Structure Visualizer
//
// Interactive LIFO (Last In, First Out) Stack Visualizer.
// Supports: Push, Pop, Peek, Clear/Reset, Custom Input,
// Step-by-Step Playback (Play, Pause, Prev, Next, Speed),
// and Transparent Educational State Explanations.
// =============================================================================

export const STACK_STORAGE_KEY = 'algolab_stack_state';

/**
 * Persists stack elements to web storage.
 */
export function saveStackState(storage, state) {
  try {
    if (!storage || !state) return false;
    storage.setItem(STACK_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save stack state:', err);
    return false;
  }
}

/**
 * Loads saved stack elements from web storage.
 */
export function loadStackState(storage) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(STACK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Core Stack Data Structure Engine.
 * Operates purely on state and generates verifiable step snapshots.
 */
class StackEngine {
  constructor(initialElements = []) {
    this.elements = [];
    this.history = [];
    this.currentHistoryIndex = -1;

    // Initialize with clone of initial elements if provided
    if (Array.isArray(initialElements) && initialElements.length > 0) {
      this.elements = [...initialElements];
    }

    // Record initial step
    this._recordStep({
      operation: 'INITIAL',
      operand: null,
      prevElements: [],
      resultingElements: [...this.elements],
      prevTop: -1,
      currentTop: this.elements.length - 1,
      isUnderflow: false,
      message: this.elements.length === 0
        ? 'Stack initialized. The stack is currently empty.'
        : `Stack initialized with ${this.elements.length} element${this.elements.length === 1 ? '' : 's'}.`,
      explanation: {
        operation: 'Initialization',
        what: this.elements.length === 0
          ? 'Created an empty Stack structure.'
          : `Created Stack with initial elements: [${this.elements.join(', ')}].`,
        why: 'In a stack, elements are added and removed exclusively from the TOP (LIFO: Last In, First Out).',
        stateSummary: `Size: ${this.elements.length} | Top Index: ${this.elements.length - 1}`
      }
    });
  }

  /**
   * Pushes a new element onto the top of the stack.
   *
   * @param {number} value
   * @returns {Object} snapshot step
   */
  push(value) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      throw new Error('Push requires a valid numeric value.');
    }

    const numVal = Number(value);
    const prevElements = [...this.elements];
    const prevTop = this.elements.length - 1;

    // Add to top of stack
    this.elements.push(numVal);
    const currentTop = this.elements.length - 1;

    const step = {
      operation: 'PUSH',
      operand: numVal,
      prevElements,
      resultingElements: [...this.elements],
      prevTop,
      currentTop,
      isUnderflow: false,
      message: `Pushed ${numVal} onto the stack. Top pointer is now at index ${currentTop} (value: ${numVal}).`,
      explanation: {
        operation: `PUSH(${numVal})`,
        what: `Placed value ${numVal} at the top of the stack (index ${currentTop}).`,
        why: `Under LIFO rules, every newly added element becomes the new top. Top index advanced from ${prevTop} to ${currentTop}.`,
        stateSummary: `Size: ${this.elements.length} | Top Index: ${currentTop} | Top Value: ${numVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Pops (removes and returns) the top element from the stack.
   * If empty, triggers a safe underflow state.
   *
   * @returns {Object} snapshot step
   */
  pop() {
    const prevElements = [...this.elements];
    const prevTop = this.elements.length - 1;

    if (this.elements.length === 0) {
      const underflowStep = {
        operation: 'POP_UNDERFLOW',
        operand: null,
        prevElements,
        resultingElements: [],
        prevTop: -1,
        currentTop: -1,
        isUnderflow: true,
        message: 'Underflow Warning: Cannot POP from an empty stack! Operation rejected.',
        explanation: {
          operation: 'POP (Underflow)',
          what: 'Attempted to remove an element from an empty stack.',
          why: 'Stack Underflow occurs when an algorithm attempts to pop when size == 0. No elements exist to remove.',
          stateSummary: 'Size: 0 | Top Index: -1 (Empty)'
        }
      };
      this._recordStep(underflowStep);
      return underflowStep;
    }

    const poppedVal = this.elements.pop();
    const currentTop = this.elements.length - 1;

    const step = {
      operation: 'POP',
      operand: poppedVal,
      prevElements,
      resultingElements: [...this.elements],
      prevTop,
      currentTop,
      isUnderflow: false,
      message: `Popped ${poppedVal} from the top of the stack. Top pointer retreated to index ${currentTop}.`,
      explanation: {
        operation: `POP → ${poppedVal}`,
        what: `Removed the top element (${poppedVal}) from index ${prevTop}.`,
        why: `LIFO guarantees that the most recently added item is the first one removed. Top index retreated from ${prevTop} to ${currentTop}.`,
        stateSummary: `Size: ${this.elements.length} | Top Index: ${currentTop}${currentTop >= 0 ? ` | Top Value: ${this.elements[currentTop]}` : ' (Empty)'}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Inspects the top element without removing it.
   * If empty, triggers a safe underflow notification.
   *
   * @returns {Object} snapshot step
   */
  peek() {
    const prevElements = [...this.elements];
    const currentTop = this.elements.length - 1;

    if (this.elements.length === 0) {
      const underflowStep = {
        operation: 'PEEK_UNDERFLOW',
        operand: null,
        prevElements,
        resultingElements: [],
        prevTop: -1,
        currentTop: -1,
        isUnderflow: true,
        message: 'Underflow Notice: Cannot PEEK an empty stack! Top is undefined.',
        explanation: {
          operation: 'PEEK (Underflow)',
          what: 'Attempted to peek at the top of an empty stack.',
          why: 'There are currently zero elements in the stack, so no top element exists to inspect.',
          stateSummary: 'Size: 0 | Top Index: -1 (Empty)'
        }
      };
      this._recordStep(underflowStep);
      return underflowStep;
    }

    const topVal = this.elements[currentTop];

    const step = {
      operation: 'PEEK',
      operand: topVal,
      prevElements,
      resultingElements: [...this.elements],
      prevTop: currentTop,
      currentTop,
      isUnderflow: false,
      message: `Peeked top element: ${topVal} at index ${currentTop}. Stack remains unmodified.`,
      explanation: {
        operation: `PEEK → ${topVal}`,
        what: `Inspected element ${topVal} at top index ${currentTop} without modifying the stack.`,
        why: 'PEEK is an O(1) query operation that reads the top without mutating the stack structure or top pointer.',
        stateSummary: `Size: ${this.elements.length} | Top Index: ${currentTop} | Top Value: ${topVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Clears the stack completely and records the reset step.
   *
   * @returns {Object} snapshot step
   */
  clear() {
    const prevElements = [...this.elements];
    const prevTop = this.elements.length - 1;

    this.elements = [];
    const step = {
      operation: 'RESET',
      operand: null,
      prevElements,
      resultingElements: [],
      prevTop,
      currentTop: -1,
      isUnderflow: false,
      message: 'Stack reset to empty.',
      explanation: {
        operation: 'RESET',
        what: `Cleared all ${prevElements.length} elements from the stack.`,
        why: 'Reset restores the stack to its initial empty state (size: 0, top: -1).',
        stateSummary: 'Size: 0 | Top Index: -1 (Empty)'
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Records a snapshot step into history.
   * If current pointer is behind the latest step, branches timeline cleanly.
   *
   * @private
   */
  _recordStep(step) {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }
    this.history.push(step);
    this.currentHistoryIndex = this.history.length - 1;
  }

  /**
   * Returns the index of the first valid operational snapshot in history.
   * If the first snapshot is an INITIAL state with an empty stack and operations follow,
   * the operational timeline begins at index 1.
   * If the stack was initialized with elements, index 0 is valid.
   *
   * @returns {number}
   */
  getFirstValidStepIndex() {
    if (this.history.length === 0) return 0;
    if (this.history.length > 1 && this.history[0].operation === 'INITIAL' && this.history[0].resultingElements.length === 0) {
      return 1;
    }
    return 0;
  }

  /**
   * Resets the stack and its history to start a genuinely new sequence.
   * Completely clears previous operations so they cannot replay.
   *
   * @param {Array} initialElements Optional initial elements for new sequence
   * @returns {Object} initial snapshot step
   */
  resetSequence(initialElements = []) {
    this.elements = [];
    this.history = [];
    this.currentHistoryIndex = -1;

    if (Array.isArray(initialElements) && initialElements.length > 0) {
      this.elements = [...initialElements];
    }

    const initialStep = {
      operation: 'INITIAL',
      operand: null,
      prevElements: [],
      resultingElements: [...this.elements],
      prevTop: -1,
      currentTop: this.elements.length - 1,
      isUnderflow: false,
      message: this.elements.length === 0
        ? 'Stack initialized. The stack is currently empty.'
        : `Stack initialized with ${this.elements.length} element${this.elements.length === 1 ? '' : 's'}.`,
      explanation: {
        operation: 'Initialization',
        what: this.elements.length === 0
          ? 'Created an empty Stack structure.'
          : `Created Stack with initial elements: [${this.elements.join(', ')}].`,
        why: 'In a stack, elements are added and removed exclusively from the TOP (LIFO: Last In, First Out).',
        stateSummary: `Size: ${this.elements.length} | Top Index: ${this.elements.length - 1}`
      }
    };

    this._recordStep(initialStep);
    return initialStep;
  }

  /**
   * Returns current active step.
   */
  getCurrentStep() {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length) {
      return this.history[this.currentHistoryIndex];
    }
    return null;
  }

  /**
   * Steps to a specific index in history.
   *
   * @param {number} index
   * @returns {Object|null}
   */
  goToStep(index) {
    if (index >= 0 && index < this.history.length) {
      this.currentHistoryIndex = index;
      const step = this.history[index];
      this.elements = [...step.resultingElements];
      return step;
    }
    return null;
  }

  /**
   * Steps backward in history.
   */
  prevStep() {
    if (this.currentHistoryIndex > 0) {
      return this.goToStep(this.currentHistoryIndex - 1);
    }
    return null;
  }

  /**
   * Steps forward in history.
   */
  nextStep() {
    if (this.currentHistoryIndex < this.history.length - 1) {
      return this.goToStep(this.currentHistoryIndex + 1);
    }
    return null;
  }
}

// Export for ES modules and Node.js test runners
export { StackEngine };

/* =====================================================
   DOM CONTROLLER & PLAYBACK ENGINE
   Active only when running in a browser document
   ===================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const stackContainer = document.getElementById('stack-container');
    if (!stackContainer) return; // Not on Stack Visualizer page

    // Input & Operations controls
    const stackInput = document.getElementById('stack-input');
    const pushBtn = document.getElementById('push-btn');
    const popBtn = document.getElementById('pop-btn');
    const peekBtn = document.getElementById('peek-btn');
    const resetStackBtn = document.getElementById('reset-stack-btn');
    const scenarioSelect = document.getElementById('scenario-select');

    // Step-by-step Playback controls
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetTimelineBtn = document.getElementById('reset-timeline-btn');
    const speedRange = document.getElementById('speed-range');

    // Display elements
    const stepMessage = document.getElementById('step-message');
    const currentStepValue = document.getElementById('current-step-value');
    const stackSizeValue = document.getElementById('stack-size-value');
    const topIndexValue = document.getElementById('top-index-value');
    const topElementValue = document.getElementById('top-element-value');
    const stackStatusValue = document.getElementById('stack-status-value');

    // Explanation panel elements
    const explanationOp = document.getElementById('explanation-op');
    const explanationWhat = document.getElementById('explanation-what');
    const explanationWhy = document.getElementById('explanation-why');
    const explanationSummary = document.getElementById('explanation-summary');

    // Initialize Stack Engine with saved elements if present
    const savedState = loadStackState(typeof window !== 'undefined' ? window.localStorage : null);
    const initialElements = (savedState && Array.isArray(savedState.elements)) ? savedState.elements : [];
    const stack = new StackEngine(initialElements);

    function persistCurrentStack() {
      const state = {
        elements: [...stack.elements],
        timestamp: Date.now()
      };
      saveStackState(typeof window !== 'undefined' ? window.localStorage : null, state);
    }

    // Auto-play interval state
    let isPlaying = false;
    let playIntervalId = null;

    function getPlaybackSpeed() {
      // Invert range: 100ms (fast) to 1500ms (slow)
      return speedRange ? 1600 - Number(speedRange.value) : 800;
    }

    /**
     * Renders the current stack snapshot into the DOM vertically.
     */
    function renderStep(step) {
      if (!step) return;

      const elements = step.resultingElements || [];
      const currentTop = step.currentTop;

      // 1. Render vertical stack beaker
      stackContainer.innerHTML = '';

      if (elements.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'stack-empty-indicator';
        emptyDiv.innerHTML = `
          <div class="empty-icon">&empty;</div>
          <div class="empty-title">Stack is Empty</div>
          <div class="empty-subtitle">Size: 0 | Top: -1</div>
        `;
        stackContainer.appendChild(emptyDiv);
      } else {
        // Render elements stacked vertically.
        // We render from top (index = length - 1) down to bottom (index = 0)
        // so that the newest element appears visually at the TOP of the container!
        for (let i = elements.length - 1; i >= 0; i--) {
          const val = elements[i];
          const isTop = (i === currentTop);

          const itemDiv = document.createElement('div');
          itemDiv.className = 'stack-item';
          itemDiv.dataset.index = i;

          if (isTop) {
            itemDiv.classList.add('top-item');
          }

          // Apply operation animation states
          if (step.operation === 'PUSH' && i === currentTop) {
            itemDiv.classList.add('pushed-anim');
          } else if (step.operation === 'PEEK' && isTop) {
            itemDiv.classList.add('peeked-anim');
          }

          itemDiv.innerHTML = `
            <div class="stack-item-content">
              <span class="stack-item-val">${val}</span>
              <span class="stack-item-index">[Index ${i}]</span>
            </div>
            ${isTop ? '<div class="stack-top-badge">&larr; TOP</div>' : ''}
          `;

          stackContainer.appendChild(itemDiv);
        }
      }

      // 2. Update step message with color coding
      if (stepMessage) {
        stepMessage.textContent = step.message;
        stepMessage.className = 'step-message-box';
        if (step.isUnderflow) {
          stepMessage.classList.add('underflow');
        } else if (step.operation === 'PUSH') {
          stepMessage.classList.add('push');
        } else if (step.operation === 'POP') {
          stepMessage.classList.add('pop');
        } else if (step.operation === 'PEEK') {
          stepMessage.classList.add('peek');
        }
      }

      // 3. Update info metrics
      const totalSteps = stack.history.length;
      const firstIndex = stack.getFirstValidStepIndex();
      const validTotal = Math.max(1, totalSteps - firstIndex);
      const validCurrent = Math.max(1, stack.currentHistoryIndex - firstIndex + 1);

      if (currentStepValue) {
        if (totalSteps <= 1 && stack.history[0]?.operation === 'INITIAL' && elements.length === 0) {
          currentStepValue.textContent = '0 / 0';
        } else {
          currentStepValue.textContent = `${validCurrent} / ${validTotal}`;
        }
      }
      if (stackSizeValue) stackSizeValue.textContent = String(elements.length);
      if (topIndexValue) topIndexValue.textContent = currentTop >= 0 ? String(currentTop) : '-1 (empty)';
      if (topElementValue) topElementValue.textContent = currentTop >= 0 ? String(elements[currentTop]) : 'None';

      if (stackStatusValue) {
        if (step.isUnderflow) {
          stackStatusValue.innerHTML = '<span class="status-badge badge-underflow">Underflow</span>';
        } else if (step.operation === 'PUSH') {
          stackStatusValue.innerHTML = '<span class="status-badge badge-push">Push Success</span>';
        } else if (step.operation === 'POP') {
          stackStatusValue.innerHTML = '<span class="status-badge badge-pop">Pop Success</span>';
        } else if (step.operation === 'PEEK') {
          stackStatusValue.innerHTML = '<span class="status-badge badge-peek">Peek Success</span>';
        } else if (elements.length === 0) {
          stackStatusValue.innerHTML = '<span class="status-badge badge-empty">Empty</span>';
        } else {
          stackStatusValue.innerHTML = '<span class="status-badge badge-active">Active</span>';
        }
      }

      // 4. Update Educational Explanation
      if (step.explanation) {
        if (explanationOp) explanationOp.textContent = step.explanation.operation || step.operation;
        if (explanationWhat) explanationWhat.textContent = step.explanation.what || step.message;
        if (explanationWhy) explanationWhy.textContent = step.explanation.why || '';
        if (explanationSummary) explanationSummary.textContent = step.explanation.stateSummary || '';
      }

      // 5. Update Playback Button Disabled States
      const isFirst = stack.currentHistoryIndex <= firstIndex;
      const isLast = stack.currentHistoryIndex >= stack.history.length - 1;
      const hasPlayableSteps = (totalSteps - firstIndex) > 1;
      const canPlay = hasPlayableSteps && !isPlaying;

      if (prevBtn) prevBtn.disabled = isFirst || isPlaying;
      if (nextBtn) nextBtn.disabled = isLast || isPlaying;
      if (playBtn) playBtn.disabled = !canPlay;
    }

    // Sequence generation token to guard against stale intervals
    let sequenceToken = 0;

    /**
     * Executes Play (auto-advance through timeline).
     * - Restarts from first valid operational step without empty-frame glitch.
     * - Guards against duplicate timers and stale sequence intervals.
     */
    function play() {
      // Prevent duplicate timers
      if (isPlaying) return;
      const firstIndex = stack.getFirstValidStepIndex();
      const validSteps = stack.history.length - firstIndex;
      if (validSteps <= 1) return; // Nothing to play

      // Clear any lingering interval defensively
      if (playIntervalId !== null) {
        clearInterval(playIntervalId);
        playIntervalId = null;
      }

      // If at or past the end of history, or before first valid step, restart from first valid step
      if (stack.currentHistoryIndex >= stack.history.length - 1 || stack.currentHistoryIndex < firstIndex) {
        const first = stack.goToStep(firstIndex);
        if (first) renderStep(first);
      }

      isPlaying = true;
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;

      const currentToken = ++sequenceToken;

      playIntervalId = setInterval(() => {
        if (currentToken !== sequenceToken) {
          clearInterval(playIntervalId);
          playIntervalId = null;
          return;
        }
        if (stack.currentHistoryIndex < stack.history.length - 1) {
          const next = stack.nextStep();
          if (next) renderStep(next);
        } else {
          // Reached the final step — stop playback
          pause();
        }
      }, getPlaybackSpeed());
    }

    /**
     * Pauses auto-advance.
     */
    function pause() {
      sequenceToken++;
      if (playIntervalId !== null) {
        clearInterval(playIntervalId);
        playIntervalId = null;
      }
      if (!isPlaying) return;
      isPlaying = false;

      const firstIndex = stack.getFirstValidStepIndex();
      const validSteps = stack.history.length - firstIndex;
      const isFirst = stack.currentHistoryIndex <= firstIndex;
      const isLast = stack.currentHistoryIndex >= stack.history.length - 1;
      const canPlay = validSteps > 1;

      if (playBtn) playBtn.disabled = !canPlay;
      if (pauseBtn) pauseBtn.disabled = true;
      if (prevBtn) prevBtn.disabled = isFirst;
      if (nextBtn) nextBtn.disabled = isLast;
    }

    // --- Wire Event Handlers ---

    // PUSH
    if (pushBtn) {
      pushBtn.addEventListener('click', () => {
        pause();
        const rawVal = stackInput ? stackInput.value.trim() : '';
        const numVal = (rawVal !== '' && !isNaN(Number(rawVal))) ? Number(rawVal) : Math.floor(Math.random() * 90) + 10;
        const step = stack.push(numVal);
        renderStep(step);
        persistCurrentStack();
        if (stackInput) {
          // Prepare next suggested number
          stackInput.value = Math.floor(Math.random() * 90) + 10;
        }
      });
    }

    // Enter key in input triggers push
    if (stackInput) {
      stackInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (pushBtn) pushBtn.click();
        }
      });
    }

    // POP
    if (popBtn) {
      popBtn.addEventListener('click', () => {
        pause();
        const step = stack.pop();
        renderStep(step);
        persistCurrentStack();
      });
    }

    // PEEK
    if (peekBtn) {
      peekBtn.addEventListener('click', () => {
        pause();
        const step = stack.peek();
        renderStep(step);
      });
    }

    // RESET / CLEAR — Starts a genuinely new stack sequence
    if (resetStackBtn) {
      resetStackBtn.addEventListener('click', () => {
        pause();
        stack.resetSequence();
        renderStep(stack.getCurrentStep());
        persistCurrentStack();
      });
    }

    // PLAY
    if (playBtn) {
      playBtn.addEventListener('click', play);
    }

    // PAUSE
    if (pauseBtn) {
      pauseBtn.addEventListener('click', pause);
    }

    // PREV STEP
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        pause();
        const firstIndex = stack.getFirstValidStepIndex();
        if (stack.currentHistoryIndex > firstIndex) {
          const prev = stack.prevStep();
          if (prev) renderStep(prev);
        }
      });
    }

    // NEXT STEP
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        pause();
        if (stack.currentHistoryIndex < stack.history.length - 1) {
          const next = stack.nextStep();
          if (next) renderStep(next);
        }
      });
    }

    // RESET TIMELINE — Rewinds playback to the start of current sequence
    if (resetTimelineBtn) {
      resetTimelineBtn.addEventListener('click', () => {
        pause();
        const firstIndex = stack.getFirstValidStepIndex();
        const first = stack.goToStep(firstIndex);
        if (first) renderStep(first);
      });
    }

    // SPEED RANGE
    if (speedRange) {
      speedRange.addEventListener('input', () => {
        if (isPlaying) {
          pause();
          play();
        }
      });
    }

    // PRE-BUILT SCENARIOS — Each scenario starts a fresh sequence
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', () => {
        pause();
        const scenario = scenarioSelect.value;
        stack.resetSequence();

        if (scenario === 'basic') {
          stack.push(10);
          stack.push(20);
          stack.push(30);
          stack.peek();
          stack.pop();
          stack.push(40);
        } else if (scenario === 'underflow') {
          stack.push(99);
          stack.pop();
          stack.pop(); // triggers underflow
          stack.peek(); // triggers underflow
        } else if (scenario === 'duplicates') {
          stack.push(15);
          stack.push(15);
          stack.push(15);
          stack.pop();
        } else if (scenario === 'negatives') {
          stack.push(-5);
          stack.push(20);
          stack.push(-42);
          stack.peek();
          stack.pop();
        }

        // Render initial state matching the first valid playback frame
        const firstIndex = stack.getFirstValidStepIndex();
        stack.goToStep(firstIndex);
        renderStep(stack.getCurrentStep());
      });
    }

    // Initial render
    renderStep(stack.getCurrentStep());
  });
}
