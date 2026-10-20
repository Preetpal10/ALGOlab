// =============================================================================
// ALGOLAB - queue.js
// Phase 10.2: Queue Data Structure Visualizer
//
// Interactive FIFO (First In, First Out) Queue Visualizer.
// Supports: Enqueue, Dequeue, Peek/Front, IsEmpty, Size, Clear/Reset,
// Step-by-Step Playback (Play, Pause, Prev, Next, Speed),
// and Transparent Educational State Explanations.
// =============================================================================

export const QUEUE_STORAGE_KEY = 'algolab_queue_state';

/**
 * Persists queue elements to web storage.
 */
export function saveQueueState(storage, state) {
  try {
    if (!storage || !state) return false;
    storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save queue state:', err);
    return false;
  }
}

/**
 * Loads saved queue elements from web storage.
 */
export function loadQueueState(storage) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Core Queue Data Structure Engine.
 * Operates purely on state and generates verifiable step snapshots.
 */
class QueueEngine {
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
      front: this.elements.length > 0 ? 0 : -1,
      rear: this.elements.length > 0 ? this.elements.length - 1 : -1,
      size: this.elements.length,
      isUnderflow: false,
      message: this.elements.length === 0
        ? 'Queue initialized. The queue is currently empty.'
        : `Queue initialized with ${this.elements.length} element${this.elements.length === 1 ? '' : 's'}.`,
      explanation: {
        operation: 'Initialization',
        what: this.elements.length === 0
          ? 'Created an empty Queue structure.'
          : `Created Queue with initial elements: [${this.elements.join(', ')}].`,
        why: 'In a queue, elements are added at the REAR and removed from the FRONT (FIFO: First In, First Out).',
        stateSummary: `Size: ${this.elements.length} | Front: ${this.elements.length > 0 ? 0 : -1} | Rear: ${this.elements.length > 0 ? this.elements.length - 1 : -1}`
      }
    });
  }

  /**
   * Enqueues (inserts) a new element at the rear of the queue.
   *
   * @param {number} value
   * @returns {Object} snapshot step
   */
  enqueue(value) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      throw new Error('Enqueue requires a valid numeric value.');
    }

    const numVal = Number(value);
    const prevElements = [...this.elements];

    // Add to rear of queue
    this.elements.push(numVal);
    const front = 0;
    const rear = this.elements.length - 1;
    const size = this.elements.length;

    const step = {
      operation: 'ENQUEUE',
      operand: numVal,
      prevElements,
      resultingElements: [...this.elements],
      front,
      rear,
      size,
      isUnderflow: false,
      message: `Enqueued ${numVal} at the rear (index ${rear}). Front is at index ${front}. Queue size is now ${size}.`,
      explanation: {
        operation: `ENQUEUE(${numVal})`,
        what: `Placed value ${numVal} at the rear of the queue (index ${rear}).`,
        why: `Under FIFO rules, every newly added element joins at the rear. Front remains at index ${front} (value: ${this.elements[front]}).`,
        stateSummary: `Size: ${size} | Front: ${front} | Rear: ${rear} | Front Value: ${this.elements[front]} | Rear Value: ${numVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Dequeues (removes and returns) the front element from the queue.
   * If empty, triggers a safe underflow state.
   *
   * @returns {Object} snapshot step
   */
  dequeue() {
    const prevElements = [...this.elements];

    if (this.elements.length === 0) {
      const underflowStep = {
        operation: 'DEQUEUE_UNDERFLOW',
        operand: null,
        prevElements,
        resultingElements: [],
        front: -1,
        rear: -1,
        size: 0,
        isUnderflow: true,
        message: 'Underflow Warning: Cannot DEQUEUE from an empty queue! Operation rejected.',
        explanation: {
          operation: 'DEQUEUE (Underflow)',
          what: 'Attempted to remove an element from an empty queue.',
          why: 'Queue Underflow occurs when an algorithm attempts to dequeue when size == 0. No elements exist to remove.',
          stateSummary: 'Size: 0 | Front: -1 | Rear: -1 (Empty)'
        }
      };
      this._recordStep(underflowStep);
      return underflowStep;
    }

    const dequeuedVal = this.elements.shift();
    const front = this.elements.length > 0 ? 0 : -1;
    const rear = this.elements.length > 0 ? this.elements.length - 1 : -1;
    const size = this.elements.length;

    const step = {
      operation: 'DEQUEUE',
      operand: dequeuedVal,
      prevElements,
      resultingElements: [...this.elements],
      front,
      rear,
      size,
      isUnderflow: false,
      message: `Dequeued ${dequeuedVal} from the front of the queue. Queue size is now ${size}.`,
      explanation: {
        operation: `DEQUEUE → ${dequeuedVal}`,
        what: `Removed the front element (${dequeuedVal}) from index 0.`,
        why: `FIFO guarantees that the oldest added element is always the first one served and removed.`,
        stateSummary: `Size: ${size} | Front: ${front} | Rear: ${rear}${size > 0 ? ` | New Front: ${this.elements[front]}` : ' (Empty)'}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Inspects the front element without removing it.
   * If empty, triggers a safe underflow notification.
   *
   * @returns {Object} snapshot step
   */
  peek() {
    const prevElements = [...this.elements];

    if (this.elements.length === 0) {
      const underflowStep = {
        operation: 'PEEK_UNDERFLOW',
        operand: null,
        prevElements,
        resultingElements: [],
        front: -1,
        rear: -1,
        size: 0,
        isUnderflow: true,
        message: 'Underflow Notice: Cannot PEEK an empty queue! Front is undefined.',
        explanation: {
          operation: 'PEEK (Underflow)',
          what: 'Attempted to peek at the front of an empty queue.',
          why: 'There are currently zero elements in the queue, so no front element exists to inspect.',
          stateSummary: 'Size: 0 | Front: -1 | Rear: -1 (Empty)'
        }
      };
      this._recordStep(underflowStep);
      return underflowStep;
    }

    const frontVal = this.elements[0];
    const front = 0;
    const rear = this.elements.length - 1;
    const size = this.elements.length;

    const step = {
      operation: 'PEEK',
      operand: frontVal,
      prevElements,
      resultingElements: [...this.elements],
      front,
      rear,
      size,
      isUnderflow: false,
      message: `Peeked front element: ${frontVal} at index 0. Queue remains unmodified.`,
      explanation: {
        operation: `PEEK → ${frontVal}`,
        what: `Inspected element ${frontVal} at front index 0 without modifying the queue.`,
        why: 'PEEK is an O(1) query operation that reads the front without mutating queue structure or pointers.',
        stateSummary: `Size: ${size} | Front: ${front} | Rear: ${rear} | Front Value: ${frontVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Returns whether the queue is currently empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.elements.length === 0;
  }

  /**
   * Returns current number of elements in the queue.
   *
   * @returns {number}
   */
  size() {
    return this.elements.length;
  }

  /**
   * Clears the queue completely and records the reset step.
   *
   * @returns {Object} snapshot step
   */
  clear() {
    const prevElements = [...this.elements];

    this.elements = [];
    const step = {
      operation: 'RESET',
      operand: null,
      prevElements,
      resultingElements: [],
      front: -1,
      rear: -1,
      size: 0,
      isUnderflow: false,
      message: 'Queue reset to empty.',
      explanation: {
        operation: 'RESET',
        what: `Cleared all ${prevElements.length} elements from the queue.`,
        why: 'Reset restores the queue to its initial empty state (size: 0, front: -1, rear: -1).',
        stateSummary: 'Size: 0 | Front: -1 | Rear: -1 (Empty)'
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Resets the queue and its history to start a genuinely new sequence.
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
      front: this.elements.length > 0 ? 0 : -1,
      rear: this.elements.length > 0 ? this.elements.length - 1 : -1,
      size: this.elements.length,
      isUnderflow: false,
      message: this.elements.length === 0
        ? 'Queue initialized. The queue is currently empty.'
        : `Queue initialized with ${this.elements.length} element${this.elements.length === 1 ? '' : 's'}.`,
      explanation: {
        operation: 'Initialization',
        what: this.elements.length === 0
          ? 'Created an empty Queue structure.'
          : `Created Queue with initial elements: [${this.elements.join(', ')}].`,
        why: 'In a queue, elements are added at the REAR and removed from the FRONT (FIFO: First In, First Out).',
        stateSummary: `Size: ${this.elements.length} | Front: ${this.elements.length > 0 ? 0 : -1} | Rear: ${this.elements.length > 0 ? this.elements.length - 1 : -1}`
      }
    };

    this._recordStep(initialStep);
    return initialStep;
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
   * If the first snapshot is an INITIAL state with an empty queue and operations follow,
   * the operational timeline begins at index 1.
   * If the queue was initialized with elements, index 0 is valid.
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
export { QueueEngine };

/* =====================================================
   DOM CONTROLLER & PLAYBACK ENGINE
   Active only when running in a browser document
   ===================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const queueContainer = document.getElementById('queue-container');
    if (!queueContainer) return; // Not on Queue Visualizer page

    // Input & Operations controls
    const queueInput = document.getElementById('queue-input');
    const enqueueBtn = document.getElementById('enqueue-btn');
    const dequeueBtn = document.getElementById('dequeue-btn');
    const peekBtn = document.getElementById('peek-btn');
    const resetQueueBtn = document.getElementById('reset-queue-btn');
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
    const queueSizeValue = document.getElementById('queue-size-value');
    const frontIndexValue = document.getElementById('front-index-value');
    const rearIndexValue = document.getElementById('rear-index-value');
    const frontElementValue = document.getElementById('front-element-value');
    const rearElementValue = document.getElementById('rear-element-value');
    const queueStatusValue = document.getElementById('queue-status-value');

    // Explanation panel elements
    const explanationOp = document.getElementById('explanation-op');
    const explanationWhat = document.getElementById('explanation-what');
    const explanationWhy = document.getElementById('explanation-why');
    const explanationSummary = document.getElementById('explanation-summary');

    // Initialize Queue Engine with saved elements if present
    const savedState = loadQueueState(typeof window !== 'undefined' ? window.localStorage : null);
    const initialElements = (savedState && Array.isArray(savedState.elements)) ? savedState.elements : [];
    const queue = new QueueEngine(initialElements);

    function persistCurrentQueue() {
      const state = {
        elements: [...queue.elements],
        timestamp: Date.now()
      };
      saveQueueState(typeof window !== 'undefined' ? window.localStorage : null, state);
    }

    // Auto-play interval state & generation token
    let isPlaying = false;
    let playIntervalId = null;
    let sequenceToken = 0;

    function getPlaybackSpeed() {
      // Invert range: 100ms (fast) to 1500ms (slow)
      return speedRange ? 1600 - Number(speedRange.value) : 800;
    }

    /**
     * Renders the current queue snapshot into the DOM horizontally.
     */
    function renderStep(step) {
      if (!step) return;

      const elements = step.resultingElements || [];
      const frontIdx = step.front;
      const rearIdx = step.rear;
      const size = elements.length;

      // 1. Render horizontal queue track
      queueContainer.innerHTML = '';

      if (size === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'queue-empty-indicator';
        emptyDiv.innerHTML = `
          <div class="empty-icon">&empty;</div>
          <div class="empty-title">Queue is Empty</div>
          <div class="empty-subtitle">Size: 0 | Front: -1 | Rear: -1</div>
        `;
        queueContainer.appendChild(emptyDiv);
      } else {
        // Render elements from front (index 0) to rear (index length - 1)
        for (let i = 0; i < size; i++) {
          const val = elements[i];
          const isFront = (i === 0);
          const isRear = (i === size - 1);
          const isBoth = (size === 1 && isFront && isRear);

          const itemDiv = document.createElement('div');
          itemDiv.className = 'queue-item';
          itemDiv.dataset.index = i;

          if (isBoth) {
            itemDiv.classList.add('both-ends');
          } else if (isFront) {
            itemDiv.classList.add('front-item');
          } else if (isRear) {
            itemDiv.classList.add('rear-item');
          }

          // Apply operation animation states
          if (step.operation === 'ENQUEUE' && isRear) {
            itemDiv.classList.add('enqueued-anim');
          } else if (step.operation === 'PEEK' && isFront) {
            itemDiv.classList.add('peeked-anim');
          }

          let topBadgeHtml = '';
          let bottomBadgeHtml = '';

          if (isBoth) {
            topBadgeHtml = '<div class="queue-pointer-badge badge-pointer-both">FRONT & REAR</div>';
          } else {
            if (isFront) {
              topBadgeHtml = '<div class="queue-pointer-badge badge-pointer-front">&larr; FRONT</div>';
            }
            if (isRear) {
              bottomBadgeHtml = '<div class="queue-pointer-badge badge-pointer-rear">REAR &larr;</div>';
            }
          }

          itemDiv.innerHTML = `
            <div class="queue-item-badge-top">${topBadgeHtml}</div>
            <div class="queue-item-content">
              <span class="queue-item-val">${val}</span>
              <span class="queue-item-index">[Idx ${i}]</span>
            </div>
            <div class="queue-item-badge-bottom">${bottomBadgeHtml}</div>
          `;

          queueContainer.appendChild(itemDiv);
        }
      }

      // 2. Update step message with color coding
      if (stepMessage) {
        stepMessage.textContent = step.message;
        stepMessage.className = 'step-message-box';
        if (step.isUnderflow) {
          stepMessage.classList.add('underflow');
        } else if (step.operation === 'ENQUEUE') {
          stepMessage.classList.add('enqueue');
        } else if (step.operation === 'DEQUEUE') {
          stepMessage.classList.add('dequeue');
        } else if (step.operation === 'PEEK') {
          stepMessage.classList.add('peek');
        }
      }

      // 3. Update info metrics
      const totalSteps = queue.history.length;
      const firstIndex = queue.getFirstValidStepIndex();
      const validTotal = Math.max(1, totalSteps - firstIndex);
      const validCurrent = Math.max(1, queue.currentHistoryIndex - firstIndex + 1);

      if (currentStepValue) {
        if (totalSteps <= 1 && queue.history[0]?.operation === 'INITIAL' && size === 0) {
          currentStepValue.textContent = '0 / 0';
        } else {
          currentStepValue.textContent = `${validCurrent} / ${validTotal}`;
        }
      }
      if (queueSizeValue) queueSizeValue.textContent = String(size);
      if (frontIndexValue) frontIndexValue.textContent = size > 0 ? '0' : '-1 (empty)';
      if (rearIndexValue) rearIndexValue.textContent = size > 0 ? String(size - 1) : '-1 (empty)';
      if (frontElementValue) frontElementValue.textContent = size > 0 ? String(elements[0]) : 'None';
      if (rearElementValue) rearElementValue.textContent = size > 0 ? String(elements[size - 1]) : 'None';

      if (queueStatusValue) {
        if (step.isUnderflow) {
          queueStatusValue.innerHTML = '<span class="status-badge badge-underflow">Underflow</span>';
        } else if (step.operation === 'ENQUEUE') {
          queueStatusValue.innerHTML = '<span class="status-badge badge-enqueue">Enqueue OK</span>';
        } else if (step.operation === 'DEQUEUE') {
          queueStatusValue.innerHTML = '<span class="status-badge badge-dequeue">Dequeue OK</span>';
        } else if (step.operation === 'PEEK') {
          queueStatusValue.innerHTML = '<span class="status-badge badge-peek">Peek OK</span>';
        } else if (size === 0) {
          queueStatusValue.innerHTML = '<span class="status-badge badge-empty">Empty</span>';
        } else {
          queueStatusValue.innerHTML = '<span class="status-badge badge-active">Active</span>';
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
      const isFirst = queue.currentHistoryIndex <= firstIndex;
      const isLast = queue.currentHistoryIndex >= queue.history.length - 1;
      const hasPlayableSteps = (totalSteps - firstIndex) > 1;
      const canPlay = hasPlayableSteps && !isPlaying;

      if (prevBtn) prevBtn.disabled = isFirst || isPlaying;
      if (nextBtn) nextBtn.disabled = isLast || isPlaying;
      if (playBtn) playBtn.disabled = !canPlay;
    }

    /**
     * Executes Play (auto-advance through timeline).
     * - Restarts from first valid operational step without empty-frame glitch.
     * - Guards against duplicate timers and stale sequence intervals.
     */
    function play() {
      if (isPlaying) return;
      const firstIndex = queue.getFirstValidStepIndex();
      const validSteps = queue.history.length - firstIndex;
      if (validSteps <= 1) return; // Nothing to play

      if (playIntervalId !== null) {
        clearInterval(playIntervalId);
        playIntervalId = null;
      }

      // If at or past the end of history, or before first valid step, restart from first valid step
      if (queue.currentHistoryIndex >= queue.history.length - 1 || queue.currentHistoryIndex < firstIndex) {
        const first = queue.goToStep(firstIndex);
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
        if (queue.currentHistoryIndex < queue.history.length - 1) {
          const next = queue.nextStep();
          if (next) renderStep(next);
        } else {
          // Reached final step — stop playback
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

      const firstIndex = queue.getFirstValidStepIndex();
      const validSteps = queue.history.length - firstIndex;
      const isFirst = queue.currentHistoryIndex <= firstIndex;
      const isLast = queue.currentHistoryIndex >= queue.history.length - 1;
      const canPlay = validSteps > 1;

      if (playBtn) playBtn.disabled = !canPlay;
      if (pauseBtn) pauseBtn.disabled = true;
      if (prevBtn) prevBtn.disabled = isFirst;
      if (nextBtn) nextBtn.disabled = isLast;
    }

    // --- Wire Event Handlers ---

    // ENQUEUE
    if (enqueueBtn) {
      enqueueBtn.addEventListener('click', () => {
        pause();
        const rawVal = queueInput ? queueInput.value.trim() : '';
        const numVal = (rawVal !== '' && !isNaN(Number(rawVal))) ? Number(rawVal) : Math.floor(Math.random() * 90) + 10;
        const step = queue.enqueue(numVal);
        renderStep(step);
        persistCurrentQueue();
        if (queueInput) {
          queueInput.value = Math.floor(Math.random() * 90) + 10;
        }
      });
    }

    // Enter key in input triggers enqueue
    if (queueInput) {
      queueInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (enqueueBtn) enqueueBtn.click();
        }
      });
    }

    // DEQUEUE
    if (dequeueBtn) {
      dequeueBtn.addEventListener('click', () => {
        pause();
        const step = queue.dequeue();
        renderStep(step);
        persistCurrentQueue();
      });
    }

    // PEEK
    if (peekBtn) {
      peekBtn.addEventListener('click', () => {
        pause();
        const step = queue.peek();
        renderStep(step);
      });
    }

    // RESET / CLEAR — Starts a genuinely new queue sequence
    if (resetQueueBtn) {
      resetQueueBtn.addEventListener('click', () => {
        pause();
        queue.resetSequence();
        renderStep(queue.getCurrentStep());
        persistCurrentQueue();
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
        const firstIndex = queue.getFirstValidStepIndex();
        if (queue.currentHistoryIndex > firstIndex) {
          const prev = queue.prevStep();
          if (prev) renderStep(prev);
        }
      });
    }

    // NEXT STEP
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        pause();
        if (queue.currentHistoryIndex < queue.history.length - 1) {
          const next = queue.nextStep();
          if (next) renderStep(next);
        }
      });
    }

    // RESET TIMELINE — Rewinds playback to the start of current sequence
    if (resetTimelineBtn) {
      resetTimelineBtn.addEventListener('click', () => {
        pause();
        const firstIndex = queue.getFirstValidStepIndex();
        const first = queue.goToStep(firstIndex);
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
        queue.resetSequence();

        if (scenario === 'basic') {
          queue.enqueue(10);
          queue.enqueue(20);
          queue.enqueue(30);
          queue.peek();
          queue.dequeue();
          queue.enqueue(40);
        } else if (scenario === 'underflow') {
          queue.enqueue(99);
          queue.dequeue();
          queue.dequeue(); // triggers underflow
          queue.peek(); // triggers underflow
        } else if (scenario === 'single') {
          queue.enqueue(42);
          queue.peek();
          queue.dequeue();
        } else if (scenario === 'fifo-ordering') {
          queue.enqueue(1);
          queue.enqueue(2);
          queue.enqueue(3);
          queue.dequeue(); // removes 1
          queue.dequeue(); // removes 2
          queue.enqueue(4);
          queue.enqueue(5);
        } else if (scenario === 'negatives') {
          queue.enqueue(-5);
          queue.enqueue(20);
          queue.enqueue(-42);
          queue.peek();
          queue.dequeue();
        }

        // Render initial state matching the first valid playback frame
        const firstIndex = queue.getFirstValidStepIndex();
        queue.goToStep(firstIndex);
        renderStep(queue.getCurrentStep());
      });
    }

    // Initial render
    renderStep(queue.getCurrentStep());
  });
}
