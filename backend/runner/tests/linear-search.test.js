// =============================================================================
// ALGOLAB — Linear Search Tests (Phase 9.3)
//
// Tests Linear Search algorithm logic, input immutability, boundary cases,
// negative numbers, duplicates, educational explanation rules, and genuine Docker JDI execution.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateLinearSearchSteps,
  generateInsertionSortSteps,
  generateSelectionSortSteps,
  generateBubbleSortSteps
} from '../../../frontend/js/visualizer.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const LINEAR_SEARCH_FIXTURE = path.resolve(FIXTURES_DIR, 'LinearSearch.java');

describe('Linear Search Visualizer & Logic (Phase 9.3)', () => {

  test('1. Linear Search: finds target at middle index and stops searching', () => {
    const input = [10, 20, 30, 40, 50];
    const steps = generateLinearSearchSteps(input, 30);

    assert.ok(steps.length >= 3, 'Should produce detailed search steps');
    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 2);
    assert.ok(finalStep.message.includes('found at index 2'));
    assert.deepEqual(finalStep.array, [10, 20, 30, 40, 50]);
  });

  test('2. Input array immutability: does not modify caller input array', () => {
    const input = [29, 10, 14, 37, 13];
    const clone = [...input];
    generateLinearSearchSteps(input, 14);

    assert.deepEqual(input, clone, 'Original array passed by caller must not be mutated');
  });

  test('3. Target at first position (index 0): terminates immediately with O(1) comparison', () => {
    const input = [42, 10, 20, 30];
    const steps = generateLinearSearchSteps(input, 42);

    // Initial state + index 0 match + final state = 3 steps
    assert.equal(steps.length, 3);
    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 0);
    assert.ok(finalStep.message.includes('found at index 0'));
  });

  test('4. Target at last position: scans all elements and finds at index n - 1', () => {
    const input = [10, 20, 30, 99];
    const steps = generateLinearSearchSteps(input, 99);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 3);
    assert.ok(finalStep.message.includes('found at index 3'));
  });

  test('5. Target absent from array: inspects all elements and finishes with not-found state', () => {
    const input = [10, 20, 30, 40];
    const steps = generateLinearSearchSteps(input, 999);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, null);
    assert.ok(finalStep.message.includes('not found'));
  });

  test('6. Handles empty array safely', () => {
    const steps = generateLinearSearchSteps([], 42);
    assert.equal(steps.length, 1);
    assert.deepEqual(steps[0].array, []);
    assert.equal(steps[0].foundIndex, null);
    assert.ok(steps[0].message.includes('empty'));
  });

  test('7. Handles single-element array (target present vs absent)', () => {
    const matchSteps = generateLinearSearchSteps([42], 42);
    assert.equal(matchSteps[matchSteps.length - 1].foundIndex, 0);

    const absentSteps = generateLinearSearchSteps([42], 99);
    assert.equal(absentSteps[absentSteps.length - 1].foundIndex, null);
    assert.ok(absentSteps[absentSteps.length - 1].message.includes('not found'));
  });

  test('8. Duplicate values: reports the first matching index', () => {
    const input = [5, 10, 20, 10, 30];
    const steps = generateLinearSearchSteps(input, 10);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 1, 'Must report first matching index for duplicates');
  });

  test('9. Handles negative numbers and mixed positive/negative values correctly', () => {
    const input = [-20, -5, 0, 15, 30];
    const steps = generateLinearSearchSteps(input, -5);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 1);
    assert.ok(finalStep.message.includes('found at index 1'));
  });

  test('10. Regression: existing Bubble, Selection, and Insertion Sort generators remain intact', () => {
    const bubbleSteps = generateBubbleSortSteps([3, 1, 2]);
    assert.deepEqual(bubbleSteps[bubbleSteps.length - 1].array, [1, 2, 3]);

    const selectionSteps = generateSelectionSortSteps([3, 1, 2]);
    assert.deepEqual(selectionSteps[selectionSteps.length - 1].array, [1, 2, 3]);

    const insertionSteps = generateInsertionSortSteps([3, 1, 2]);
    assert.deepEqual(insertionSteps[insertionSteps.length - 1].array, [1, 2, 3]);
  });
});

describe('Linear Search Educational Explanation Rules (Phase 9.3)', () => {

  const LINEAR_SEARCH_JAVA = `public class LinearSearch {
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
}`;

  test('11. Search initialization: explains initializing foundIndex to -1 sentinel', () => {
    const step = {
      stepIndex: 3,
      line: 5, // int foundIndex = -1;
      method: 'main',
      variables: { target: { type: 'int', value: 30 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 3, totalSteps: 20 });
    assert.equal(exp.category, 'Search Initialization');
    assert.ok(exp.what.includes('foundIndex'));
    assert.ok(exp.why.includes('-1'));
  });

  test('12. Sequential search loop: explains scanning elements sequentially', () => {
    const step = {
      stepIndex: 4,
      line: 7, // for (int i = 0; i < arr.length; i++)
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: -1 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 4, totalSteps: 20 });
    assert.equal(exp.category, 'Sequential Search Loop');
    assert.ok(exp.what.includes('i = 0'));
    assert.ok(exp.why.includes('Advances the search pointer'));
  });

  test('13. Target comparison (FALSE): explains non-matching element and advancing search', () => {
    const step = {
      stepIndex: 5,
      line: 8, // if (arr[i] == target)
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: -1 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } } // arr[0]=10 != target=30
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 5, totalSteps: 20 });
    assert.equal(exp.category, 'Target Comparison (No Match)');
    assert.ok(exp.what.includes('FALSE'));
    assert.ok(exp.why.includes('does not match target'));
  });

  test('14. Target match found (TRUE): explains matching element located at current index', () => {
    const step = {
      stepIndex: 11,
      line: 8, // if (arr[i] == target)
      method: 'main',
      variables: { i: { type: 'int', value: 2 }, target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: -1 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } } // arr[2]=30 == target=30
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 11, totalSteps: 20 });
    assert.equal(exp.category, 'Target Match Found');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('Target found at index 2'));
  });

  test('15. Record match index: explains storing current index in foundIndex', () => {
    const step = {
      stepIndex: 12,
      line: 9, // foundIndex = i;
      method: 'main',
      variables: { i: { type: 'int', value: 2 }, target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: -1 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 12, totalSteps: 20 });
    assert.equal(exp.category, 'Record Match Index');
    assert.ok(exp.what.includes('setting \'foundIndex\' to index 2'));
    assert.ok(exp.why.includes('Stores the index'));
  });

  test('16. Early termination (break): explains stopping search immediately upon match', () => {
    const step = {
      stepIndex: 13,
      line: 10, // break;
      method: 'main',
      variables: { i: { type: 'int', value: 2 }, target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: 2 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 13, totalSteps: 20 });
    assert.equal(exp.category, 'Loop Break (Early Termination)');
    assert.ok(exp.what.includes('break statement'));
    assert.ok(exp.why.includes('Target has already been found'));
  });

  test('17. Search result evaluation: explains checking if foundIndex != -1', () => {
    const step = {
      stepIndex: 14,
      line: 14, // if (foundIndex != -1)
      method: 'main',
      variables: { target: { type: 'int', value: 30 }, foundIndex: { type: 'int', value: 2 } },
      arrays: { arr: { length: 5, values: [10, 20, 30, 40, 50] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: LINEAR_SEARCH_JAVA, stepIndex: 14, totalSteps: 20 });
    assert.equal(exp.category, 'Search Result Evaluation');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('A valid match was located at index 2'));
  });
});

describe('Linear Search Docker Execution Integration (Phase 9.3)', () => {

  test('18. Linear Search Java code runs in isolated Docker container and returns genuine trace', { timeout: 35_000 }, async () => {
    const code = await fs.readFile(LINEAR_SEARCH_FIXTURE, 'utf-8');
    const result = await runInContainer({
      code,
      mainClass: 'LinearSearch',
      limits: { timeoutMs: 30_000 }
    });

    assert.equal(result.outcome, 'success');
    assert.equal(result.containerExitCode, 0);
    assert.ok(result.exitEvent, 'Must contain exit event');
    assert.ok(result.exitEvent.stdout.includes('Found target at index: 2'), 'Must print matching index 2 in output');

    assert.ok(Array.isArray(result.events), 'Must return parsed trace events');
    assert.ok(result.events.length > 10, 'Linear search trace should contain multiple step events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length > 0, 'Must contain step events');

    // Verify presence of Linear Search variables and array snapshots
    const hasTarget = stepEvents.some(e => e.variables && 'target' in e.variables);
    assert.ok(hasTarget, 'Trace must capture target variable during execution');

    const hasFoundIndex = stepEvents.some(e => e.variables && 'foundIndex' in e.variables);
    assert.ok(hasFoundIndex, 'Trace must capture foundIndex variable during execution');

    const hasI = stepEvents.some(e => e.variables && 'i' in e.variables);
    assert.ok(hasI, 'Trace must capture loop index i variable during execution');

    const hasArraySnapshot = stepEvents.some(e => e.arrays && e.arrays.arr && Array.isArray(e.arrays.arr.values));
    assert.ok(hasArraySnapshot, 'Trace must capture arr snapshots during execution');
  });
});
