// =============================================================================
// ALGOLAB — Code Lab Draft Persistence Tests (Phase 15)
//
// Verifies saving, retrieving, and preserving student Java drafts across navigation
// and browser refreshes without overwriting by Bubble Sort default template.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CODELAB_DRAFT_KEY,
  saveCodeLabDraft,
  loadCodeLabDraft
} from '../../../frontend/js/codelab.js';

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
}

describe('Code Lab Draft Persistence Protocol (Phase 15)', () => {
  test('1. Saves student Java draft with whitespace, indentations, and metadata', () => {
    const storage = new MockStorage();
    const payload = {
      code: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Persistent Draft");\n    }\n}',
      template: 'selection-sort',
      problemId: 'find-largest',
      timestamp: Date.now()
    };

    const saved = saveCodeLabDraft(storage, payload);
    assert.equal(saved, true);

    const loaded = loadCodeLabDraft(storage);
    assert.ok(loaded);
    assert.equal(loaded.code, payload.code);
    assert.equal(loaded.template, 'selection-sort');
    assert.equal(loaded.problemId, 'find-largest');
  });

  test('2. Draft remains intact across multiple loads (not consumed like one-time transfer)', () => {
    const storage = new MockStorage();
    const payload = {
      code: 'int x = 42;',
      template: 'custom',
      problemId: null
    };

    saveCodeLabDraft(storage, payload);

    const load1 = loadCodeLabDraft(storage);
    const load2 = loadCodeLabDraft(storage);

    assert.equal(load1.code, 'int x = 42;');
    assert.equal(load2.code, 'int x = 42;');
    assert.ok(storage.getItem(CODELAB_DRAFT_KEY));
  });

  test('3. Graceful fallback on null storage or corrupted JSON', () => {
    assert.equal(saveCodeLabDraft(null, { code: 'test' }), false);
    assert.equal(loadCodeLabDraft(null), null);

    const corruptedStorage = new MockStorage();
    corruptedStorage.setItem(CODELAB_DRAFT_KEY, '{ invalid json');
    assert.equal(loadCodeLabDraft(corruptedStorage), null);
  });
});
