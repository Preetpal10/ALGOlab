// =============================================================================
// ALGOLAB — Practice Arena -> Code Lab Transfer Test Suite
//
// Tests the complete cross-lab transfer pipeline:
//   1. prepareCodeTransfer & saveCodeTransferToStorage from Practice Arena.
//   2. readAndConsumeTransferredCode in Code Lab.
//   3. Exact preservation of multi-line formatting, indentation, and newlines.
//   4. Preserving the selected problem's metadata and starter code.
//   5. Preventing stale code replay: consumption deletes the transfer key.
//   6. Fallback to default Bubble Sort template when no transfer data exists.
//   7. Resilient error handling for storage failures or invalid payloads.
// =============================================================================

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  CODE_TRANSFER_KEY as PRACTICE_KEY,
  prepareCodeTransfer,
  saveCodeTransferToStorage
} from '../../../frontend/js/practice.js';

import {
  CODE_TRANSFER_KEY as CODELAB_KEY,
  readAndConsumeTransferredCode
} from '../../../frontend/js/codelab.js';

/**
 * In-memory Mock Storage conforming to the Web Storage API (sessionStorage/localStorage).
 */
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
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
}

describe('Practice Arena -> Code Lab Code Transfer Protocol', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  test('Keys match across Practice Arena and Code Lab', () => {
    assert.equal(PRACTICE_KEY, 'algolab_codelab_transfer');
    assert.equal(CODELAB_KEY, 'algolab_codelab_transfer');
    assert.equal(PRACTICE_KEY, CODELAB_KEY);
  });

  test('1. Transferring custom Java code from Practice Arena', () => {
    const customCode = `public class Solution {
    public static void main(String[] args) {
        System.out.println("Custom student solution");
    }
}`;
    const problem = {
      id: 'reverse-array',
      title: 'Reverse an Array'
    };

    const saved = saveCodeTransferToStorage(mockStorage, customCode, problem);
    assert.equal(saved, true);

    // Verify storage contents
    const rawInStorage = mockStorage.getItem(PRACTICE_KEY);
    assert.ok(rawInStorage);
    const parsed = JSON.parse(rawInStorage);
    assert.equal(parsed.code, customCode);
    assert.equal(parsed.problemId, 'reverse-array');
    assert.equal(parsed.problemTitle, 'Reverse an Array');

    // Code Lab reads and consumes the transferred code
    const transferred = readAndConsumeTransferredCode(mockStorage);
    assert.ok(transferred);
    assert.equal(transferred.code, customCode);
    assert.equal(transferred.problemId, 'reverse-array');
    assert.equal(transferred.problemTitle, 'Reverse an Array');
  });

  test('2. Transferring code with multiple lines preserves exact whitespace and newlines', () => {
    const complexMultiLineCode = `import java.util.Scanner;\n\npublic class Solution {\n    // Complex nested loops & spacing\n    public static void main(String[] args) {\n        int[] a = { 1, 2, 3 };\n\t\tfor (int x : a) {\n            System.out.println(x);\n        }\n    }\n}\n`;

    saveCodeTransferToStorage(mockStorage, complexMultiLineCode, { id: 'find-largest', title: 'Find Largest Element' });

    const received = readAndConsumeTransferredCode(mockStorage);
    assert.ok(received);
    assert.equal(received.code, complexMultiLineCode);
    assert.equal(received.code.includes('\n    // Complex nested loops & spacing\n'), true);
    assert.equal(received.code.includes('\t\tfor (int x : a) {'), true);
  });

  test("3. Preserving the selected problem's code and metadata across different problems", () => {
    const problems = [
      { id: 'linear-search', title: 'Linear Search', code: 'public class Solution { /* linear search */ }' },
      { id: 'binary-search', title: 'Binary Search', code: 'public class Solution { /* binary search */ }' },
      { id: 'move-zeros', title: 'Move Zeros to End', code: 'public class Solution { /* move zeros */ }' }
    ];

    for (const prob of problems) {
      saveCodeTransferToStorage(mockStorage, prob.code, prob);
      const consumed = readAndConsumeTransferredCode(mockStorage);
      assert.ok(consumed);
      assert.equal(consumed.code, prob.code);
      assert.equal(consumed.problemId, prob.id);
      assert.equal(consumed.problemTitle, prob.title);
    }
  });

  test('4. Loading the default template when no transfer exists in storage', () => {
    // Storage is completely empty
    const result = readAndConsumeTransferredCode(mockStorage);
    assert.equal(result, null);

    // Null or undefined storage object handled safely
    assert.equal(readAndConsumeTransferredCode(null), null);
    assert.equal(readAndConsumeTransferredCode(undefined), null);
  });

  test('5. Preventing stale transferred code from repeatedly overwriting new code (safe consumption)', () => {
    const code = 'public class Solution { int v = 42; }';
    saveCodeTransferToStorage(mockStorage, code, { id: 'find-largest' });

    // First visit to Code Lab consumes the code
    const firstRead = readAndConsumeTransferredCode(mockStorage);
    assert.ok(firstRead);
    assert.equal(firstRead.code, code);

    // CRITICAL: Key must be deleted from storage immediately upon consumption
    assert.equal(mockStorage.getItem(CODELAB_KEY), null);

    // Subsequent page refresh, new tab, or second visit must return null so default or current code remains
    const secondRead = readAndConsumeTransferredCode(mockStorage);
    assert.equal(secondRead, null);
  });

  test('6. Resilient fallback when raw string code was stored directly instead of JSON', () => {
    const rawStringCode = 'public class RawStringSolution { void run() {} }';
    mockStorage.setItem(CODELAB_KEY, rawStringCode);

    const consumed = readAndConsumeTransferredCode(mockStorage);
    assert.ok(consumed);
    assert.equal(consumed.code, rawStringCode);
    assert.equal(consumed.problemId, null);

    // Still consumed and removed safely
    assert.equal(mockStorage.getItem(CODELAB_KEY), null);
  });

  test('7. Safe rejection of non-string code payloads', () => {
    assert.equal(prepareCodeTransfer(null), null);
    assert.equal(prepareCodeTransfer(12345), null);
    assert.equal(prepareCodeTransfer({}), null);
    assert.equal(saveCodeTransferToStorage(mockStorage, null), false);
  });

  test('8. End-to-end simulated workflow: Practice Arena edit -> transfer -> Code Lab load', () => {
    // Step A: In Practice Arena, student selects find-largest and writes code
    const practiceEditor = { value: 'public class Solution {\n    // Solved find-largest!\n}' };
    const currentProblem = { id: 'find-largest', title: 'Find Largest Element' };

    // Student clicks 'Open in Code Lab'
    saveCodeTransferToStorage(mockStorage, practiceEditor.value, currentProblem);

    // Step B: Code Lab loads
    const codelabEditor = { value: '' };
    let activeTemplate = 'bubble-sort';
    const transferred = readAndConsumeTransferredCode(mockStorage);

    if (transferred && typeof transferred.code === 'string' && transferred.code.trim().length > 0) {
      codelabEditor.value = transferred.code;
      activeTemplate = transferred.problemId;
    } else {
      codelabEditor.value = '// Bubble sort default template';
      activeTemplate = 'bubble-sort';
    }

    // Verify Code Lab editor contains the student's transferred code, NOT Bubble Sort
    assert.equal(codelabEditor.value, practiceEditor.value);
    assert.equal(activeTemplate, 'find-largest');
    assert.equal(codelabEditor.value.includes('Bubble sort'), false);

    // Step C: Student refreshes Code Lab (F5)
    const refreshedTransferred = readAndConsumeTransferredCode(mockStorage);
    assert.equal(refreshedTransferred, null, 'Stale code must not be re-transferred upon refresh');
  });
});
