// =============================================================================
// ALGOLAB — Educational Step Explanation Engine Tests (Phase 8)
//
// Tests pattern recognition, pedagogical explanation generation,
// state diffing, Bubble Sort swap awareness, and truthfulness guarantees.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';

describe('Step Explanation Engine (Phase 8)', () => {

  const BUBBLE_SORT_CODE = `public class BubbleSort {
    public static void main(String[] args) {
        int[] arr = { 64, 34, 25, 12, 22 };
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted array:");
    }
}`;

  // Test 1: Program Entry
  test('1. Program entry: identifies main method entrypoint', () => {
    const step = {
      stepIndex: 0,
      line: 2,
      method: 'main',
      variables: { args: { type: 'String[]', value: '[]' } },
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 0, totalSteps: 10 });
    assert.equal(exp.category, 'Program Entry');
    assert.ok(exp.what.includes('main method'));
    assert.ok(exp.why.includes('JVM'));
    assert.ok(exp.stateChips.length > 0);
  });

  // Test 2: Array initialization
  test('2. Array initialization: explains array creation and length', () => {
    const step = {
      stepIndex: 1,
      line: 3,
      method: 'main',
      variables: {},
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 1, totalSteps: 10 });
    assert.equal(exp.category, 'Array Initialization');
    assert.ok(exp.what.includes('Initializing array \'arr\''));
    assert.ok(exp.what.includes('5 elements'));
    assert.ok(exp.why.includes('contiguous'));
  });

  // Test 3: Variable declaration with initialization
  test('3. Variable declaration: explains variable n initialization', () => {
    const step = {
      stepIndex: 2,
      line: 4,
      method: 'main',
      variables: { arr: { type: 'int[]', value: '[64, 34, 25, 12, 22]' } },
      arrays: { arr: { length: 5, values: [64, 34, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 2, totalSteps: 10 });
    assert.equal(exp.category, 'Variable Declaration');
    assert.ok(exp.what.includes('variable \'n\''));
    assert.ok(exp.what.includes('arr.length'));
  });

  // Test 4: Outer Loop Header
  test('4. Loop execution: explains outer loop pass', () => {
    const step = {
      stepIndex: 3,
      line: 6,
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, n: { type: 'int', value: 5 } },
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 3, totalSteps: 10 });
    assert.equal(exp.category, 'Outer Loop Header');
    assert.ok(exp.what.includes('Outer loop'));
    assert.ok(exp.what.includes('i = 0'));
    assert.ok(exp.why.includes('pass'));
  });

  // Test 5: Inner Loop Header
  test('5. Loop execution: explains inner loop comparison pointer', () => {
    const step = {
      stepIndex: 4,
      line: 7,
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 0 }, n: { type: 'int', value: 5 } },
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 4, totalSteps: 10 });
    assert.equal(exp.category, 'Inner Loop Header');
    assert.ok(exp.what.includes('Inner loop'));
    assert.ok(exp.what.includes('j = 0'));
  });

  // Test 6: Adjacent comparison — TRUE case
  test('6. Bubble Sort comparison (TRUE): detects inverted elements requiring swap', () => {
    const step = {
      stepIndex: 5,
      line: 8,
      method: 'main',
      variables: { i: { type: 'int', value: 0 }, j: { type: 'int', value: 0 } },
      arrays: { arr: { length: 5, values: [64, 34, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 5, totalSteps: 10 });
    assert.equal(exp.category, 'Adjacent Comparison');
    assert.ok(exp.what.includes('arr[0] (64) > arr[1] (34)'));
    assert.ok(exp.what.includes('Condition is TRUE'));
    assert.ok(exp.why.includes('swapped'));
    assert.ok(exp.stateChips.some(c => c.label === 'Condition' && c.value === 'TRUE'));
  });

  // Test 7: Adjacent comparison — FALSE case
  test('7. Bubble Sort comparison (FALSE): detects ordered elements skipping swap', () => {
    const step = {
      stepIndex: 12,
      line: 8,
      method: 'main',
      variables: { i: { type: 'int', value: 1 }, j: { type: 'int', value: 2 } },
      arrays: { arr: { length: 5, values: [25, 34, 64, 12, 22] } } // arr[2] is 64, arr[3] is 12, let's test arr[0]=25, arr[1]=34 (j=0)
    };
    step.variables.j.value = 0; // 25 vs 34

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 12, totalSteps: 10 });
    assert.equal(exp.category, 'Adjacent Comparison');
    assert.ok(exp.what.includes('arr[0] (25) > arr[1] (34)'));
    assert.ok(exp.what.includes('Condition is FALSE'));
    assert.ok(exp.why.includes('no swap is performed'));
    assert.ok(exp.stateChips.some(c => c.label === 'Condition' && c.value === 'FALSE'));
  });

  // Test 8: Swap Step 1 — Preserve in temp
  test('8. Swap Step 1: explains saving arr[j] in temporary variable', () => {
    const step = {
      stepIndex: 6,
      line: 9,
      method: 'main',
      variables: { j: { type: 'int', value: 0 } },
      arrays: { arr: { length: 5, values: [64, 34, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 6, totalSteps: 10 });
    assert.equal(exp.category, 'Swap Step 1 (Preserve)');
    assert.ok(exp.what.includes('Saving arr[0] (64)'));
    assert.ok(exp.what.includes('temp'));
    assert.ok(exp.why.includes('Preserves the value'));
  });

  // Test 9: Swap Step 2 — Shift adjacent element
  test('9. Swap Step 2: explains shifting adjacent element into lower index', () => {
    const step = {
      stepIndex: 7,
      line: 10,
      method: 'main',
      variables: { j: { type: 'int', value: 0 }, temp: { type: 'int', value: 64 } },
      arrays: { arr: { length: 5, values: [64, 34, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 7, totalSteps: 10 });
    assert.equal(exp.category, 'Swap Step 2 (Shift)');
    assert.ok(exp.what.includes('Copying value from arr[1] (34) into arr[0]'));
    assert.ok(exp.why.includes('Shifts the adjacent element'));
  });

  // Test 10: Swap Step 3 — Restore saved temp
  test('10. Swap Step 3: explains writing saved temp value into second position', () => {
    const step = {
      stepIndex: 8,
      line: 11,
      method: 'main',
      variables: { j: { type: 'int', value: 0 }, temp: { type: 'int', value: 64 } },
      arrays: { arr: { length: 5, values: [34, 34, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 8, totalSteps: 10 });
    assert.equal(exp.category, 'Swap Step 3 (Restore)');
    assert.ok(exp.what.includes('Copying saved \'temp\' (64) into arr[1]'));
    assert.ok(exp.why.includes('Completes the swap'));
  });

  // Test 11: Console Output
  test('11. Output statement: explains printing to console', () => {
    const step = {
      stepIndex: 70,
      line: 16,
      method: 'main',
      variables: {},
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: BUBBLE_SORT_CODE, stepIndex: 70, totalSteps: 72 });
    assert.equal(exp.category, 'Console Output');
    assert.ok(exp.what.includes('Printing to standard output'));
  });

  // Test 12: State diffing between steps
  test('12. State change detection: diffs changes in arrays and variables', () => {
    const prev = {
      stepIndex: 8,
      line: 11,
      variables: { j: { type: 'int', value: 0 } },
      arrays: { arr: { length: 5, values: [34, 34, 25, 12, 22] } }
    };
    const curr = {
      stepIndex: 9,
      line: 7,
      variables: { j: { type: 'int', value: 1 } },
      arrays: { arr: { length: 5, values: [34, 64, 25, 12, 22] } }
    };

    const exp = generateStepExplanation({ step: curr, prevStep: prev, sourceCode: BUBBLE_SORT_CODE, stepIndex: 9, totalSteps: 72 });
    assert.ok(exp.stateChange);
    assert.ok(exp.stateChange.includes('arr[1] changed from 34 to 64'));
    assert.ok(exp.stateChange.includes('j: 0 → 1'));
  });

  // Test 13: Unknown / arbitrary source pattern (honest fallback)
  test('13. Unknown pattern: provides truthful generic explanation without fabricating algorithm', () => {
    const customCode = `class Custom { void test() { computeMatrixDeterminant(x, y); } }`;
    const step = {
      stepIndex: 0,
      line: 1,
      method: 'test',
      variables: { x: { type: 'int', value: 10 }, y: { type: 'int', value: 20 } },
      arrays: {}
    };

    const exp = generateStepExplanation({ step, sourceCode: customCode, stepIndex: 0, totalSteps: 1 });
    assert.equal(exp.category, 'Execution Step');
    assert.ok(exp.what.includes('computeMatrixDeterminant'));
    assert.ok(exp.stateChips.some(c => c.label === 'x' && c.value === '10'));
  });

  // Test 14: Null / empty step handled gracefully
  test('14. Null or empty step returns clean inactive explanation', () => {
    const exp = generateStepExplanation({ step: null });
    assert.equal(exp.category, 'Inactive');
    assert.equal(exp.stepNumber, 0);
  });
});
