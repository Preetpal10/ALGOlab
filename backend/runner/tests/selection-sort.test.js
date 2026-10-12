// =============================================================================
// ALGOLAB — Selection Sort Tests (Phase 9.1)
//
// Tests Selection Sort algorithm logic, input immutability, boundary cases,
// educational explanation rules, and genuine Docker JDI execution.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateSelectionSortSteps,
  generateBubbleSortSteps
} from '../../../frontend/js/visualizer.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const SELECTION_SORT_FIXTURE = path.resolve(FIXTURES_DIR, 'SelectionSort.java');

describe('Selection Sort Visualizer & Logic (Phase 9.1)', () => {

  test('1. Selection Sort: sorts unsorted array correctly and terminates with sorted status', () => {
    const input = [64, 25, 12, 22, 11];
    const steps = generateSelectionSortSteps(input);

    assert.ok(steps.length > 5, 'Should produce detailed steps');
    const finalStep = steps[steps.length - 1];
    assert.deepEqual(finalStep.array, [11, 12, 22, 25, 64]);
    assert.equal(finalStep.message, 'Array is fully sorted!');
  });

  test('2. Input array immutability: does not modify caller input array', () => {
    const input = [29, 10, 14, 37, 13];
    const clone = [...input];
    generateSelectionSortSteps(input);

    assert.deepEqual(input, clone, 'Original array passed by caller must not be mutated');
  });

  test('3. Handles duplicate values correctly', () => {
    const input = [5, 2, 8, 2, 5, 1];
    const steps = generateSelectionSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [1, 2, 2, 5, 5, 8]);
  });

  test('4. Handles empty and single-element arrays safely', () => {
    const emptySteps = generateSelectionSortSteps([]);
    assert.equal(emptySteps.length, 1);
    assert.deepEqual(emptySteps[0].array, []);
    assert.equal(emptySteps[0].message, 'Array is empty.');

    const singleSteps = generateSelectionSortSteps([42]);
    assert.ok(singleSteps.length >= 1);
    const finalSingle = singleSteps[singleSteps.length - 1];
    assert.deepEqual(finalSingle.array, [42]);
  });

  test('5. Handles already sorted array with zero swaps', () => {
    const input = [1, 2, 3, 4, 5];
    const steps = generateSelectionSortSteps(input);
    const swapSteps = steps.filter(s => s.swapped);

    assert.equal(swapSteps.length, 0, 'Already sorted array should require zero element swaps');
    assert.deepEqual(steps[steps.length - 1].array, [1, 2, 3, 4, 5]);
  });

  test('6. Handles reverse-sorted array correctly', () => {
    const input = [5, 4, 3, 2, 1];
    const steps = generateSelectionSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [1, 2, 3, 4, 5]);
    const swapSteps = steps.filter(s => s.swapped);
    assert.ok(swapSteps.length > 0, 'Reverse sorted array should perform swaps');
  });

  test('7. Bubble Sort regression: existing Bubble Sort generator remains intact', () => {
    const input = [64, 34, 25, 12, 22];
    const steps = generateBubbleSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [12, 22, 25, 34, 64]);
    assert.equal(finalStep.message, 'Array is fully sorted!');
  });
});

describe('Selection Sort Educational Explanation Rules (Phase 9.1)', () => {

  const SELECTION_SORT_JAVA = `public class SelectionSort {
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
    }
}`;

  test('8. Minimum index initialization: explains assuming first unsorted element is minimum', () => {
    const step = {
      stepIndex: 4,
      line: 6, // int minIdx = i;
      method: 'main',
      variables: { i: { type: 'int', value: 0 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 4, totalSteps: 20 });
    assert.equal(exp.category, 'Minimum Tracking (Initialize)');
    assert.ok(exp.what.includes('minIdx'));
    assert.ok(exp.why.includes('minimum candidate'));
  });

  test('9. Candidate comparison (TRUE): detects smaller candidate and explains update will occur', () => {
    const step = {
      stepIndex: 6,
      line: 8, // if (arr[j] < arr[minIdx])
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 1 }, minIdx: { type: 'int', value: 0 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 6, totalSteps: 20 });
    assert.equal(exp.category, 'Minimum Comparison');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('smaller element was found'));
  });

  test('10. Candidate comparison (FALSE): detects larger candidate and explains minimum remains unchanged', () => {
    const step = {
      stepIndex: 10,
      line: 8, // if (arr[j] < arr[minIdx])
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 3 }, minIdx: { type: 'int', value: 2 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } } // arr[3]=22, arr[minIdx=2]=12
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 10, totalSteps: 20 });
    assert.equal(exp.category, 'Minimum Comparison');
    assert.ok(exp.what.includes('FALSE'));
    assert.ok(exp.why.includes('remains unchanged'));
  });

  test('11. Minimum index update: explains saving position of new minimum', () => {
    const step = {
      stepIndex: 7,
      line: 9, // minIdx = j;
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 1 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 7, totalSteps: 20 });
    assert.equal(exp.category, 'Update Minimum Index');
    assert.ok(exp.what.includes('Updating \'minIdx\''));
    assert.ok(exp.why.includes('smaller element was detected'));
  });

  test('12. Suffix scan inner loop: explains scanning remaining unsorted elements', () => {
    const step = {
      stepIndex: 5,
      line: 7, // for (int j = i + 1; j < n; j++)
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 1 }, n: { type: 'int', value: 5 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 5, totalSteps: 20 });
    assert.equal(exp.category, 'Inner Loop Header (Scan Suffix)');
    assert.ok(exp.why.includes('unsorted elements'));
  });

  test('13. Swap restoration: explains placing smallest item into sorted prefix', () => {
    const step = {
      stepIndex: 15,
      line: 14, // arr[i] = temp;
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, temp: { type: 'int', value: 11 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: SELECTION_SORT_JAVA, stepIndex: 15, totalSteps: 20 });
    assert.equal(exp.category, 'Swap Step 3 (Restore)');
    assert.ok(exp.what.includes('arr[0]'));
    assert.ok(exp.why.includes('Completes the swap'));
  });
});

describe('Selection Sort Docker Execution Integration (Phase 9.1)', () => {

  test('14. Selection Sort Java code runs in isolated Docker container and returns genuine trace', async () => {
    const code = await fs.readFile(SELECTION_SORT_FIXTURE, 'utf-8');
    const result = await runInContainer({
      code,
      mainClass: 'SelectionSort'
    });

    assert.equal(result.outcome, 'success');
    assert.equal(result.containerExitCode, 0);
    assert.ok(result.exitEvent, 'Must contain exit event');
    assert.ok(result.exitEvent.stdout.includes('Sorted array:'), 'Must produce standard output banner');
    assert.ok(result.exitEvent.stdout.includes('11 12 22 25 64'), 'Must print sorted array in output');

    assert.ok(Array.isArray(result.events), 'Must return parsed trace events');
    assert.ok(result.events.length > 20, 'Selection sort trace should contain multiple step events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length > 0, 'Must contain step events');

    // Verify presence of Selection Sort variables and array snapshots
    const hasMinIdx = stepEvents.some(e => e.variables && 'minIdx' in e.variables);
    assert.ok(hasMinIdx, 'Trace must capture minIdx variable during execution');

    const hasArraySnapshot = stepEvents.some(e => e.arrays && e.arrays.arr && Array.isArray(e.arrays.arr.values));
    assert.ok(hasArraySnapshot, 'Trace must capture arr snapshots during execution');
  });
});
