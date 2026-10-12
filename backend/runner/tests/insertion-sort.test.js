// =============================================================================
// ALGOLAB — Insertion Sort Tests (Phase 9.2)
//
// Tests Insertion Sort algorithm logic, input immutability, boundary cases,
// negative numbers, educational explanation rules, and genuine Docker JDI execution.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateInsertionSortSteps,
  generateSelectionSortSteps,
  generateBubbleSortSteps
} from '../../../frontend/js/visualizer.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const INSERTION_SORT_FIXTURE = path.resolve(FIXTURES_DIR, 'InsertionSort.java');

describe('Insertion Sort Visualizer & Logic (Phase 9.2)', () => {

  test('1. Insertion Sort: sorts unsorted array correctly and terminates with sorted status', () => {
    const input = [64, 25, 12, 22, 11];
    const steps = generateInsertionSortSteps(input);

    assert.ok(steps.length > 5, 'Should produce detailed steps');
    const finalStep = steps[steps.length - 1];
    assert.deepEqual(finalStep.array, [11, 12, 22, 25, 64]);
    assert.equal(finalStep.message, 'Array is fully sorted!');
  });

  test('2. Input array immutability: does not modify caller input array', () => {
    const input = [29, 10, 14, 37, 13];
    const clone = [...input];
    generateInsertionSortSteps(input);

    assert.deepEqual(input, clone, 'Original array passed by caller must not be mutated');
  });

  test('3. Handles duplicate values correctly', () => {
    const input = [5, 2, 8, 2, 5, 1];
    const steps = generateInsertionSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [1, 2, 2, 5, 5, 8]);
  });

  test('4. Handles empty and single-element arrays safely', () => {
    const emptySteps = generateInsertionSortSteps([]);
    assert.equal(emptySteps.length, 1);
    assert.deepEqual(emptySteps[0].array, []);
    assert.equal(emptySteps[0].message, 'Array is empty.');

    const singleSteps = generateInsertionSortSteps([42]);
    assert.ok(singleSteps.length >= 1);
    const finalSingle = singleSteps[singleSteps.length - 1];
    assert.deepEqual(finalSingle.array, [42]);
  });

  test('5. Handles already sorted array with zero rightward shifts', () => {
    const input = [1, 2, 3, 4, 5];
    const steps = generateInsertionSortSteps(input);
    const shiftSteps = steps.filter(s => s.swapped);

    assert.equal(shiftSteps.length, 0, 'Already sorted array should require zero rightward element shifts');
    assert.deepEqual(steps[steps.length - 1].array, [1, 2, 3, 4, 5]);
  });

  test('6. Handles reverse-sorted array correctly with rightward shifts', () => {
    const input = [5, 4, 3, 2, 1];
    const steps = generateInsertionSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [1, 2, 3, 4, 5]);
    const shiftSteps = steps.filter(s => s.swapped);
    assert.ok(shiftSteps.length > 0, 'Reverse sorted array should perform rightward shifts');
  });

  test('7. Handles negative numbers and mixed positive/negative values correctly', () => {
    const input = [-5, 10, -20, 0, 15, -1];
    const steps = generateInsertionSortSteps(input);
    const finalStep = steps[steps.length - 1];

    assert.deepEqual(finalStep.array, [-20, -5, -1, 0, 10, 15]);
    assert.equal(finalStep.message, 'Array is fully sorted!');
  });

  test('8. Regression: existing Bubble Sort and Selection Sort generators remain intact', () => {
    const bubbleInput = [64, 34, 25, 12, 22];
    const bubbleSteps = generateBubbleSortSteps(bubbleInput);
    assert.deepEqual(bubbleSteps[bubbleSteps.length - 1].array, [12, 22, 25, 34, 64]);

    const selectionInput = [64, 25, 12, 22, 11];
    const selectionSteps = generateSelectionSortSteps(selectionInput);
    assert.deepEqual(selectionSteps[selectionSteps.length - 1].array, [11, 12, 22, 25, 64]);
  });
});

describe('Insertion Sort Educational Explanation Rules (Phase 9.2)', () => {

  const INSERTION_SORT_JAVA = `public class InsertionSort {
    public static void main(String[] args) {
        int[] arr = { 64, 25, 12, 22, 11 };
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }
}`;

  test('9. Key extraction: explains saving key into variable and preserving sorted prefix', () => {
    const step = {
      stepIndex: 4,
      line: 6, // int key = arr[i];
      method: 'main',
      variables: { i: { type: 'int', value: 1 } },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 4, totalSteps: 25 });
    assert.equal(exp.category, 'Key Extraction');
    assert.ok(exp.what.includes('key'));
    assert.ok(exp.why.includes('already sorted'));
  });

  test('10. Shift condition check (TRUE): evaluates condition when preceding element is larger', () => {
    const step = {
      stepIndex: 6,
      line: 8, // while (j >= 0 && arr[j] > key)
      method: 'main',
      variables: {
        i: { type: 'int', value: 1 },
        j: { type: 'int', value: 0 },
        key: { type: 'int', value: 25 }
      },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } } // arr[0]=64 > key=25
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 6, totalSteps: 25 });
    assert.equal(exp.category, 'Shift Condition Check');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('greater than key'));
  });

  test('11. Shift condition check (FALSE): evaluates condition when preceding element is smaller or equal', () => {
    const step = {
      stepIndex: 12,
      line: 8, // while (j >= 0 && arr[j] > key)
      method: 'main',
      variables: {
        i: { type: 'int', value: 3 },
        j: { type: 'int', value: 1 },
        key: { type: 'int', value: 22 }
      },
      arrays: { arr: { length: 5, values: [12, 15, 64, 22, 11] } } // arr[1]=15 <= key=22
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 12, totalSteps: 25 });
    assert.equal(exp.category, 'Shift Condition Check');
    assert.ok(exp.what.includes('FALSE'));
    assert.ok(exp.why.includes('Found the insertion position'));
  });

  test('12. Rightward shifting: explains sliding larger element one position right into arr[j+1]', () => {
    const step = {
      stepIndex: 7,
      line: 9, // arr[j + 1] = arr[j];
      method: 'main',
      variables: {
        i: { type: 'int', value: 1 },
        j: { type: 'int', value: 0 },
        key: { type: 'int', value: 25 }
      },
      arrays: { arr: { length: 5, values: [64, 25, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 7, totalSteps: 25 });
    assert.equal(exp.category, 'Rightward Shift');
    assert.ok(exp.what.includes('Shifting element'));
    assert.ok(exp.why.includes('Vacates slot'));
  });

  test('13. Pointer decrement: explains decrementing index j to inspect next preceding element', () => {
    const step = {
      stepIndex: 8,
      line: 10, // j--;
      method: 'main',
      variables: {
        i: { type: 'int', value: 1 },
        j: { type: 'int', value: 0 },
        key: { type: 'int', value: 25 }
      },
      arrays: { arr: { length: 5, values: [64, 64, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 8, totalSteps: 25 });
    assert.equal(exp.category, 'Pointer Decrement');
    assert.ok(exp.what.includes('Decrementing index j'));
    assert.ok(exp.why.includes('Moves leftward'));
  });

  test('14. Key insertion: explains placing saved key into its determined slot arr[j+1]', () => {
    const step = {
      stepIndex: 10,
      line: 12, // arr[j + 1] = key;
      method: 'main',
      variables: {
        i: { type: 'int', value: 1 },
        j: { type: 'int', value: -1 },
        key: { type: 'int', value: 25 }
      },
      arrays: { arr: { length: 5, values: [64, 64, 12, 22, 11] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: INSERTION_SORT_JAVA, stepIndex: 10, totalSteps: 25 });
    assert.equal(exp.category, 'Key Insertion');
    assert.ok(exp.what.includes('Inserting saved key'));
    assert.ok(exp.why.includes('Completes this pass'));
  });
});

describe('Insertion Sort Docker Execution Integration (Phase 9.2)', () => {

  test('15. Insertion Sort Java code runs in isolated Docker container and returns genuine trace', { timeout: 35_000 }, async () => {
    const code = await fs.readFile(INSERTION_SORT_FIXTURE, 'utf-8');
    const result = await runInContainer({
      code,
      mainClass: 'InsertionSort',
      limits: { timeoutMs: 30_000 }
    });

    assert.equal(result.outcome, 'success');
    assert.equal(result.containerExitCode, 0);
    assert.ok(result.exitEvent, 'Must contain exit event');
    assert.ok(result.exitEvent.stdout.includes('Sorted array:'), 'Must produce standard output banner');
    assert.ok(result.exitEvent.stdout.includes('11 12 22 25 64'), 'Must print sorted array in output');

    assert.ok(Array.isArray(result.events), 'Must return parsed trace events');
    assert.ok(result.events.length > 20, 'Insertion sort trace should contain multiple step events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length > 0, 'Must contain step events');

    // Verify presence of Insertion Sort variables and array snapshots
    const hasKey = stepEvents.some(e => e.variables && 'key' in e.variables);
    assert.ok(hasKey, 'Trace must capture key variable during execution');

    const hasJ = stepEvents.some(e => e.variables && 'j' in e.variables);
    assert.ok(hasJ, 'Trace must capture j variable during execution');

    const hasArraySnapshot = stepEvents.some(e => e.arrays && e.arrays.arr && Array.isArray(e.arrays.arr.values));
    assert.ok(hasArraySnapshot, 'Trace must capture arr snapshots during execution');
  });
});
