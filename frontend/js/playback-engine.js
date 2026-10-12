// =====================================================
// ALGOLAB - playback-engine.js
// Client-side Trace Playback Engine (Phase 2)
// Conforms to docs/TRACE_SCHEMA.md
//
// Safe, deterministic state management for JDI execution traces.
// Never uses eval() or new Function(). Renders untrusted data safely.
// =====================================================

export class TracePlaybackEngine {
  constructor(options = {}) {
    this.speedMs = options.speedMs || 800; // Default playback interval
    this.events = [];
    this.steps = [];
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.intervalId = null;

    this.initEvent = null;
    this.exitEvent = null;
    this.errorEvent = null;
    this.truncationEvent = null;

    this.status = "inactive"; // inactive | ready | playing | paused | completed | error | empty

    // Event listeners
    this.onStepChange = options.onStepChange || null;
    this.onStatusChange = options.onStatusChange || null;
    this.onError = options.onError || null;
    this.onTruncated = options.onTruncated || null;
  }

  /**
   * Validates and loads a trace sequence.
   * @param {Array} rawEvents - array of event objects from JSONL trace
   * @returns {boolean} true if loaded successfully
   */
  loadTrace(rawEvents) {
    this.pause();
    this.events = [];
    this.steps = [];
    this.currentStepIndex = -1;
    this.initEvent = null;
    this.exitEvent = null;
    this.errorEvent = null;
    this.truncationEvent = null;

    // Safety check: input must be a valid array
    if (!Array.isArray(rawEvents)) {
      this._setStatus("error", "Invalid trace payload (expected array)");
      if (this.onError) {
        this.onError({ type: "error", errorType: "invalid_payload", message: "Trace data is not an array" });
      }
      return false;
    }

    // Filter and sanitize valid trace event objects
    for (const item of rawEvents) {
      if (!item || typeof item !== "object") continue;

      if (item.type === "init") {
        this.initEvent = item;
        this.events.push(item);
      } else if (item.type === "step") {
        // A valid step must have stepIndex and a numeric line number
        if (typeof item.stepIndex === "number" && typeof item.line === "number") {
          this.steps.push(item);
          this.events.push(item);
        }
      } else if (item.type === "truncation") {
        this.truncationEvent = item;
        this.events.push(item);
      } else if (item.type === "exit") {
        this.exitEvent = item;
        this.events.push(item);
      } else if (item.type === "error") {
        this.errorEvent = item;
        this.events.push(item);
      }
    }

    // Check for compilation or runtime error events
    if (this.errorEvent) {
      this._setStatus("error", `Error: ${this.errorEvent.errorType || "Trace error"}`);
      if (this.onError) {
        this.onError(this.errorEvent);
      }
      return false;
    }

    // Check if trace has zero steps
    if (this.steps.length === 0) {
      this._setStatus("empty", "No execution steps recorded");
      this._notifyStep();
      return true;
    }

    // Trace loaded with valid steps
    this.currentStepIndex = 0;
    this._setStatus("ready", "Ready for playback");

    if (this.truncationEvent && this.onTruncated) {
      this.onTruncated(this.truncationEvent);
    }

    this._notifyStep();
    return true;
  }

  /**
   * Starts automatic forward playback.
   */
  play() {
    if (this.steps.length === 0 || this.status === "error") return;

    // If at the end, restart from beginning
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
      this._notifyStep();
    }

    this.isPlaying = true;
    this._setStatus("playing", "Playing trace");

    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        this._notifyStep();
      } else {
        // Reached end of trace
        this.pause();
        const finalStatus = this.truncationEvent ? "truncated" : "completed";
        const finalLabel = this.truncationEvent ? "Trace Truncated (Limit Reached)" : "Trace Completed";
        this._setStatus(finalStatus, finalLabel);
      }
    }, this.speedMs);
  }

  /**
   * Pauses automatic playback.
   */
  pause() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.status === "playing") {
      this._setStatus("paused", "Playback paused");
    }
  }

  /**
   * Steps forward to the next recorded execution state.
   */
  stepNext() {
    if (this.steps.length === 0) return;
    if (this.isPlaying) this.pause();

    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this._setStatus("paused", "Paused at step");
      this._notifyStep();

      if (this.currentStepIndex === this.steps.length - 1) {
        const finalStatus = this.truncationEvent ? "truncated" : "completed";
        const finalLabel = this.truncationEvent ? "Trace Truncated (Limit Reached)" : "Trace Completed";
        this._setStatus(finalStatus, finalLabel);
      }
    }
  }

  /**
   * Steps backward to the previous recorded execution state.
   */
  stepPrev() {
    if (this.steps.length === 0) return;
    if (this.isPlaying) this.pause();

    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this._setStatus("paused", "Paused at step");
      this._notifyStep();
    }
  }

  /**
   * Resets playback to the initial recorded state.
   */
  reset() {
    this.pause();
    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
      this._setStatus("ready", "Reset to initial state");
      this._notifyStep();
    } else {
      this.currentStepIndex = -1;
      this._setStatus("inactive", "Inactive");
      this._notifyStep();
    }
  }

  /**
   * Adjusts playback speed in milliseconds.
   * @param {number} speedMs
   */
  setSpeed(speedMs) {
    this.speedMs = Math.max(50, Math.min(2000, Number(speedMs) || 800));
    if (this.isPlaying) {
      // Restart interval with new speed
      this.play();
    }
  }

  /**
   * Returns current active step object or null.
   */
  getCurrentStep() {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  /**
   * Returns true if execution is at the first step.
   */
  isAtFirstStep() {
    return this.currentStepIndex <= 0;
  }

  /**
   * Returns true if execution is at the final step.
   */
  isAtLastStep() {
    return this.steps.length > 0 && this.currentStepIndex >= this.steps.length - 1;
  }

  // --- Internal Helpers ---

  _setStatus(status, label) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status, label);
    }
  }

  _notifyStep() {
    if (this.onStepChange) {
      const step = this.getCurrentStep();
      const isFirst = this.isAtFirstStep();
      const isLast = this.isAtLastStep();
      this.onStepChange(step, this.currentStepIndex, this.steps.length, isFirst, isLast);
    }
  }
}

// Attach to window object for global script usage in browser
if (typeof window !== "undefined") {
  window.TracePlaybackEngine = TracePlaybackEngine;
}
