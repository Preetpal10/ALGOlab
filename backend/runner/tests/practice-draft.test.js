import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPracticeDraftKey,
  savePracticeDraft,
  loadPracticeDraft,
  clearPracticeDraft,
  resetPracticeProblem,
  getJudgeStatusDescriptor,
  prepareCodeTransfer,
  saveCodeTransferToStorage,
  CODE_TRANSFER_KEY
} from '../../../frontend/js/practice.js';

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
}

describe('Practice Arena Per-Problem Draft Persistence & Reset (Phase 18B)', () => {
  test('1. Preserves separate, independent code drafts for different problems', () => {
    const storage = new MockStorage();

    const codeProblem1 = '// Solution for reverse-array\nSystem.out.println("Reversed");';
    const codeProblem2 = '// Solution for find-largest\nint max = Integer.MIN_VALUE;';

    savePracticeDraft(storage, 'reverse-array', codeProblem1);
    savePracticeDraft(storage, 'find-largest', codeProblem2);

    const loaded1 = loadPracticeDraft(storage, 'reverse-array');
    const loaded2 = loadPracticeDraft(storage, 'find-largest');

    assert.equal(loaded1, codeProblem1);
    assert.equal(loaded2, codeProblem2);
    assert.notEqual(loaded1, loaded2);
  });

  test('2. Restores saved draft on reload and does not wipe to starter code', () => {
    const storage = new MockStorage();
    const customCode = 'class Solution { /* custom student logic */ }';

    savePracticeDraft(storage, 'linear-search', customCode);

    const restored = loadPracticeDraft(storage, 'linear-search');
    assert.equal(restored, customCode);

    // Problem with no draft returns null
    const nonExistent = loadPracticeDraft(storage, 'binary-search');
    assert.equal(nonExistent, null);
  });

  test('3. Resetting a problem clears its draft cleanly without affecting other problems', () => {
    const storage = new MockStorage();

    savePracticeDraft(storage, 'move-zeros', 'code A');
    savePracticeDraft(storage, 'find-largest', 'code B');

    clearPracticeDraft(storage, 'move-zeros');

    assert.equal(loadPracticeDraft(storage, 'move-zeros'), null);
    assert.equal(loadPracticeDraft(storage, 'find-largest'), 'code B');
  });

  test('4. Graceful handling of null/empty storage instances', () => {
    assert.equal(savePracticeDraft(null, 'prob1', 'code'), false);
    assert.equal(loadPracticeDraft(null, 'prob1'), null);
    assert.equal(clearPracticeDraft(null, 'prob1'), false);
    assert.equal(resetPracticeProblem(null, null), null);
  });

  test('5. resetPracticeProblem restores starter code and immediately updates editor element', () => {
    const storage = new MockStorage();
    const problem = {
      id: 'reverse-array',
      title: 'Reverse an Array',
      starterCode: 'public class Solution { public static void main(String[] args) {} }'
    };
    const mockEditor = { value: 'int x = 999; // student modification' };

    // Save initial dirty draft
    savePracticeDraft(storage, problem.id, mockEditor.value);
    assert.equal(loadPracticeDraft(storage, problem.id), mockEditor.value);

    // Perform Reset
    const restoredCode = resetPracticeProblem(storage, problem, mockEditor);

    // Verifications:
    // a. Starter code restored
    assert.equal(restoredCode, problem.starterCode);
    // b. Editor element value immediately updated
    assert.equal(mockEditor.value, problem.starterCode);
    // c. Saved draft for this problem is cleared
    assert.equal(loadPracticeDraft(storage, problem.id), null);
  });

  test('6. Resetting problem A preserves problem B draft and code transfer integrity', () => {
    const storage = new MockStorage();
    const probA = { id: 'prob-a', starterCode: 'starter A' };
    const probB = { id: 'prob-b', starterCode: 'starter B' };

    savePracticeDraft(storage, probA.id, 'modified A');
    savePracticeDraft(storage, probB.id, 'modified B');

    const editor = { value: 'modified A' };
    resetPracticeProblem(storage, probA, editor);

    // Problem A draft cleared & editor reset
    assert.equal(editor.value, 'starter A');
    assert.equal(loadPracticeDraft(storage, probA.id), null);

    // Problem B draft remains intact
    assert.equal(loadPracticeDraft(storage, probB.id), 'modified B');

    // Code transfer logic remains operational
    const transferPayload = prepareCodeTransfer(editor.value, probA);
    assert.equal(transferPayload.code, 'starter A');
    assert.equal(transferPayload.problemId, 'prob-a');

    const transferSaved = saveCodeTransferToStorage(storage, editor.value, probA);
    assert.equal(transferSaved, true);
    const rawTransfer = storage.getItem(CODE_TRANSFER_KEY);
    assert.ok(rawTransfer);
    const parsedTransfer = JSON.parse(rawTransfer);
    assert.equal(parsedTransfer.problemId, 'prob-a');
    assert.equal(parsedTransfer.code, 'starter A');
  });

  test('7. Problem switching after reset does not re-persist old draft or overwrite reset code', () => {
    const storage = new MockStorage();
    const prob1 = { id: 'p1', starterCode: 'starter 1' };
    const prob2 = { id: 'p2', starterCode: 'starter 2' };

    const editor = { value: 'dirty edit 1' };
    savePracticeDraft(storage, prob1.id, editor.value);

    // Reset prob1
    resetPracticeProblem(storage, prob1, editor);
    assert.equal(editor.value, prob1.starterCode);
    assert.equal(loadPracticeDraft(storage, prob1.id), null);

    // Simulate problem switch: if editor.value === starterCode, draft stays cleared
    if (editor.value === prob1.starterCode) {
      clearPracticeDraft(storage, prob1.id);
    } else {
      savePracticeDraft(storage, prob1.id, editor.value);
    }

    assert.equal(loadPracticeDraft(storage, prob1.id), null, 'Draft should remain null after switching away from reset problem');

    // Load prob2
    editor.value = prob2.starterCode;
    // Switch back to prob1: draft restoration falls back to starterCode
    const restoredProb1 = loadPracticeDraft(storage, prob1.id) || prob1.starterCode;
    assert.equal(restoredProb1, prob1.starterCode);
  });
});

describe('Practice Arena Judge Availability Status Scenarios (Phase 18B)', () => {
  const dummyConfig = {
    mode: 'local',
    configured: true,
    healthUrl: 'http://127.0.0.1:3001/api/health',
    judgeUrl: 'http://127.0.0.1:3001/api/judge'
  };

  test('Scenario A: Backend running and healthy -> Status becomes Judge Online', () => {
    const health = { ok: true, status: 200, data: { status: 'ok', service: 'algolab-runner' } };
    const desc = getJudgeStatusDescriptor(health, dummyConfig);
    assert.equal(desc.text, 'Judge Online');
    assert.equal(desc.className, 'status-badge badge-settled');
    assert.equal(desc.online, true);
  });

  test('Scenario B: Backend stopped / unreachable -> Status becomes Backend Offline', () => {
    const health = { ok: false, status: 0, error: 'Network unreachable' };
    const desc = getJudgeStatusDescriptor(health, dummyConfig);
    assert.equal(desc.text, 'Backend Offline');
    assert.equal(desc.className, 'status-badge badge-empty');
    assert.equal(desc.online, false);
  });

  test('Scenario C: Backend error / Docker unavailable (503) -> Status becomes Judge Unavailable', () => {
    const health503 = {
      ok: false,
      status: 503,
      data: { outcome: 'docker_unavailable' },
      error: 'Health check returned HTTP 503'
    };
    const desc = getJudgeStatusDescriptor(health503, dummyConfig);
    assert.equal(desc.text, 'Judge Unavailable');
    assert.equal(desc.className, 'status-badge badge-empty');
    assert.equal(desc.online, false);
  });

  test('Scenario D: Network timeout -> Status becomes Backend Timeout', () => {
    const healthTimeout = { ok: false, status: 0, error: 'Health check timed out' };
    const desc = getJudgeStatusDescriptor(healthTimeout, dummyConfig);
    assert.equal(desc.text, 'Backend Timeout');
    assert.equal(desc.className, 'status-badge badge-empty');
    assert.equal(desc.online, false);
  });

  test('Scenario E: Backend restarts -> Status transitions from Offline to Checking to Online', () => {
    // Initially offline
    let desc = getJudgeStatusDescriptor({ ok: false, status: 0, error: 'Connection refused' }, dummyConfig);
    assert.equal(desc.text, 'Backend Offline');
    assert.equal(desc.online, false);

    // Initiating health check
    desc = getJudgeStatusDescriptor(null, dummyConfig);
    assert.equal(desc.text, 'Checking...');
    assert.equal(desc.className, 'status-badge badge-pending');
    assert.equal(desc.online, false);

    // Backend successfully recovers
    desc = getJudgeStatusDescriptor({ ok: true, status: 200, data: { status: 'ok' } }, dummyConfig);
    assert.equal(desc.text, 'Judge Online');
    assert.equal(desc.className, 'status-badge badge-settled');
    assert.equal(desc.online, true);
  });

  test('Offline Demo mode returns Offline Mode status', () => {
    const offlineConfig = { mode: 'offline-demo', healthUrl: null, judgeUrl: null };
    const desc = getJudgeStatusDescriptor(null, offlineConfig);
    assert.equal(desc.text, 'Offline Mode');
    assert.equal(desc.className, 'status-badge badge-pending');
    assert.equal(desc.online, false);
  });
});

