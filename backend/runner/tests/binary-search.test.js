// =============================================================================
// ALGOLAB — Binary Search Tests (Phase 9.4)
//
// Tests Binary Search algorithm logic, input immutability, boundary cases,
// negative numbers, duplicates, educational explanation rules, and genuine Docker JDI execution.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateBinarySearchSteps,
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
const BINARY_SEARCH_FIXTURE = path.resolve(FIXTURES_DIR, 'BinarySearch.java');

describe('Binary Search Visualizer & Logic (Phase 9.4)', () => {

  test('1. Binary Search: finds target in sorted array and reports correct index', () => {
    const input = [11, 12, 22, 25, 64];
    const steps = generateBinarySearchSteps(input, 25);

    assert.ok(steps.length >= 3, 'Should produce detailed search steps');
    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 3);
    assert.ok(finalStep.message.includes('located at index 3'));
  });

  test('2. Input array immutability: does not modify caller input array', () => {
    const input = [64, 25, 12, 22, 11];
    const clone = [...input];
    generateBinarySearchSteps(input, 22);

    assert.deepEqual(input, clone, 'Original array passed by caller must not be mutated');
  });

  test('3. Unsorted input array: sorts working copy, notifies student, and finds target', () => {
    const unsorted = [64, 25, 12, 22, 11];
    const steps = generateBinarySearchSteps(unsorted, 25);

    // Initial step explains working copy was sorted
    assert.ok(steps[0].message.includes('automatically sorted'));
    assert.deepEqual(steps[0].array, [11, 12, 22, 25, 64]);
    // Finds 25 at index 3 of sorted array
    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 3);
  });

  test('4. Target at first position (index 0): finds target and updates pointers correctly', () => {
    const input = [10, 20, 30, 40, 50];
    const steps = generateBinarySearchSteps(input, 10);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 0);
    assert.ok(finalStep.message.includes('located at index 0'));
  });

  test('5. Target at last position (index n - 1): finds target and advances low pointer', () => {
    const input = [10, 20, 30, 40, 50];
    const steps = generateBinarySearchSteps(input, 50);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 4);
    assert.ok(finalStep.message.includes('located at index 4'));
  });

  test('6. Target in middle position (initial midpoint): terminates on first comparison in O(1)', () => {
    const input = [10, 20, 30, 40, 50];
    const steps = generateBinarySearchSteps(input, 30);

    // Initial step + examine mid + match found + final step = 4 steps
    assert.equal(steps.length, 4);
    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 2);
    assert.ok(finalStep.message.includes('located at index 2'));
  });

  test('7. Target absent from array: narrows interval until low > high and reports not-found', () => {
    const input = [10, 20, 30, 40, 50];
    const steps = generateBinarySearchSteps(input, 35);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, null);
    assert.ok(finalStep.message.includes('not found'));
    assert.ok(finalStep.message.includes('Interval empty'));
  });

  test('8. Handles empty array safely', () => {
    const steps = generateBinarySearchSteps([], 42);
    assert.equal(steps.length, 1);
    assert.deepEqual(steps[0].array, []);
    assert.equal(steps[0].foundIndex, null);
    assert.ok(steps[0].message.includes('empty'));
  });

  test('9. Handles single-element array (target present vs absent)', () => {
    const matchSteps = generateBinarySearchSteps([42], 42);
    assert.equal(matchSteps[matchSteps.length - 1].foundIndex, 0);

    const absentSteps = generateBinarySearchSteps([42], 99);
    assert.equal(absentSteps[absentSteps.length - 1].foundIndex, null);
    assert.ok(absentSteps[absentSteps.length - 1].message.includes('not found'));
  });

  test('10. Duplicate values: finds a valid occurrence of target', () => {
    const input = [10, 20, 20, 20, 30];
    const steps = generateBinarySearchSteps(input, 20);

    const finalStep = steps[steps.length - 1];
    assert.ok(finalStep.foundIndex >= 1 && finalStep.foundIndex <= 3);
    assert.equal(finalStep.array[finalStep.foundIndex], 20);
  });

  test('11. Negative numbers and mixed positive/negative values', () => {
    const input = [-30, -10, 0, 15, 45];
    const steps = generateBinarySearchSteps(input, -10);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.foundIndex, 1);
    assert.ok(finalStep.message.includes('located at index 1'));
  });

  test('12. Regression: Bubble, Selection, Insertion Sort, and Linear Search remain intact', () => {
    assert.deepEqual(generateBubbleSortSteps([3, 1, 2]).slice(-1)[0].array, [1, 2, 3]);
    assert.deepEqual(generateSelectionSortSteps([3, 1, 2]).slice(-1)[0].array, [1, 2, 3]);
    assert.deepEqual(generateInsertionSortSteps([3, 1, 2]).slice(-1)[0].array, [1, 2, 3]);
    assert.equal(generateLinearSearchSteps([10, 20, 30], 20).slice(-1)[0].foundIndex, 1);
  });
});

describe('Binary Search Educational Explanation Rules (Phase 9.4)', () => {

  const BINARY_SEARCH_JAVA = `public class BinarySearch {
    public static void main(String[] args) {
        int[] arr = { 11, 12, 22, 25, 64 };
        int target = 25;
        int low = 0;
        int high = arr.length - 1;
        int foundIndex = -1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (arr[mid] == target) {
                foundIndex = mid;
                break;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found target at index: " + foundIndex);
        } else {
            System.out.println("Target not found in array");
        }
    }
}`;

  test('13. Interval initialization (low = 0): explains setting left search boundary', () => {
    const step = {
      stepIndex: 4,
      line: 5, // int low = 0;
      method: 'main',
      variables: { target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 4, totalSteps: 20 });
    assert.equal(exp.category, 'Interval Initialization (Low)');
    assert.ok(exp.what.includes('low'));
    assert.ok(exp.why.includes('index 0'));
  });

  test('14. Interval initialization (high = arr.length - 1): explains setting right search boundary', () => {
    const step = {
      stepIndex: 5,
      line: 6, // int high = arr.length - 1;
      method: 'main',
      variables: { low: { type: 'int', value: 0 }, target: { type: 'int', value: 25 }, high: { type: 'int', value: 4 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 5, totalSteps: 20 });
    assert.equal(exp.category, 'Interval Initialization (High)');
    assert.ok(exp.what.includes('high'));
    assert.ok(exp.why.includes('last element'));
  });

  test('15. While loop header (low <= high): explains evaluating active search space', () => {
    const step = {
      stepIndex: 7,
      line: 9, // while (low <= high)
      method: 'main',
      variables: { low: { type: 'int', value: 0 }, high: { type: 'int', value: 4 }, target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 7, totalSteps: 20 });
    assert.equal(exp.category, 'Binary Search Loop Header');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('valid and non-empty'));
  });

  test('16. Midpoint calculation: explains calculating mid with overflow protection', () => {
    const step = {
      stepIndex: 8,
      line: 10, // int mid = low + (high - low) / 2;
      method: 'main',
      variables: { low: { type: 'int', value: 0 }, high: { type: 'int', value: 4 }, target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 8, totalSteps: 20 });
    assert.equal(exp.category, 'Midpoint Calculation');
    assert.ok(exp.what.includes('mid = 0 + (4 - 0) / 2 = 2'));
    assert.ok(exp.why.includes('overflow'));
  });

  test('17. Midpoint comparison (Search Right): explains arr[mid] < target eliminating left half', () => {
    const step = {
      stepIndex: 10,
      line: 15, // } else if (arr[mid] < target) {
      method: 'main',
      variables: { low: { type: 'int', value: 0 }, high: { type: 'int', value: 4 }, mid: { type: 'int', value: 2 }, target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } } // arr[2]=22 < target=25
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 10, totalSteps: 20 });
    assert.equal(exp.category, 'Midpoint Comparison (Search Right)');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('right half'));
  });

  test('18. Update low pointer: explains updating low to mid + 1', () => {
    const step = {
      stepIndex: 11,
      line: 16, // low = mid + 1;
      method: 'main',
      variables: { low: { type: 'int', value: 0 }, high: { type: 'int', value: 4 }, mid: { type: 'int', value: 2 }, target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 11, totalSteps: 20 });
    assert.equal(exp.category, 'Update Low Pointer');
    assert.ok(exp.what.includes('mid + 1 (3)'));
    assert.ok(exp.why.includes('Eliminates the entire left half'));
  });

  test('19. Midpoint comparison (Match Found): explains arr[mid] == target', () => {
    const step = {
      stepIndex: 14,
      line: 12, // if (arr[mid] == target) {
      method: 'main',
      variables: { low: { type: 'int', value: 3 }, high: { type: 'int', value: 4 }, mid: { type: 'int', value: 3 }, target: { type: 'int', value: 25 } },
      arrays: { arr: { length: 5, values: [11, 12, 22, 25, 64] } } // arr[3]=25 == target=25
    };

    const exp = generateStepExplanation({ step, sourceCode: BINARY_SEARCH_JAVA, stepIndex: 14, totalSteps: 20 });
    assert.equal(exp.category, 'Target Match Found');
    assert.ok(exp.what.includes('TRUE'));
    assert.ok(exp.why.includes('Target found at midpoint index 3'));
  });
});

describe('Binary Search Docker Execution Integration (Phase 9.4)', () => {

  test('20. Binary Search Java code runs in isolated Docker container and returns genuine trace', { timeout: 35_000 }, async () => {
    const code = await fs.readFile(BINARY_SEARCH_FIXTURE, 'utf-8');
    const result = await runInContainer({
      code,
      mainClass: 'BinarySearch',
      limits: { timeoutMs: 30_000 }
    });

    assert.equal(result.outcome, 'success');
    assert.equal(result.containerExitCode, 0);
    assert.ok(result.exitEvent, 'Must contain exit event');
    assert.ok(result.exitEvent.stdout.includes('Found target at index: 3'), 'Must print matching index 3 in output');

    assert.ok(Array.isArray(result.events), 'Must return parsed trace events');
    assert.ok(result.events.length > 10, 'Binary search trace should contain multiple step events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length > 0, 'Must contain step events');

    // Verify presence of Binary Search variables and array snapshots
    const hasTarget = stepEvents.some(e => e.variables && 'target' in e.variables);
    assert.ok(hasTarget, 'Trace must capture target variable during execution');

    const hasLow = stepEvents.some(e => e.variables && 'low' in e.variables);
    assert.ok(hasLow, 'Trace must capture low variable during execution');

    const hasHigh = stepEvents.some(e => e.variables && 'high' in e.variables);
    assert.ok(hasHigh, 'Trace must capture high variable during execution');

    const hasMid = stepEvents.some(e => e.variables && 'mid' in e.variables);
    assert.ok(hasMid, 'Trace must capture mid variable during execution');

    const hasFoundIndex = stepEvents.some(e => e.variables && 'foundIndex' in e.variables);
    assert.ok(hasFoundIndex, 'Trace must capture foundIndex variable during execution');

    const hasArraySnapshot = stepEvents.some(e => e.arrays && e.arrays.arr && Array.isArray(e.arrays.arr.values));
    assert.ok(hasArraySnapshot, 'Trace must capture arr snapshots during execution');
  });
});
