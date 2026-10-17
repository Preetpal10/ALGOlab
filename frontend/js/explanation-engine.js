// =============================================================================
// ALGOLAB — Educational Step Explanation Engine (Phase 8)
//
// Generates accurate, beginner-friendly explanations for each execution step
// in a Java JDI trace. Follows the strict rule of truth:
// - Strictly grounded in observed runtime state and source code.
// - Explicitly notes that state is captured BEFORE line execution.
// - Distinguishes directly observed facts from algorithmic context.
// - Never fabricates variable values, unrecorded steps, or algorithm identities.
// =============================================================================

/**
 * @typedef {Object} ExplanationResult
 * @property {number} stepNumber       - 1-based step counter
 * @property {number} lineNumber       - 1-based source code line
 * @property {string} lineCode         - Source code at current line
 * @property {string} category         - High-level category (e.g. 'Comparison', 'Array Swap', 'Loop Header')
 * @property {string} what             - Direct explanation of what the line does
 * @property {string} why              - Pedagogical purpose / why it matters
 * @property {Array<{label: string, value: string, highlight?: boolean}>} stateChips - Relevant variable/array chips
 * @property {string|null} stateChange - Changes observed since previous step
 * @property {string|null} tip         - Short learning tip when evidence supports it
 */

/**
 * Generates an educational explanation for the given trace step.
 *
 * @param {Object} options
 * @param {Object} options.step         - Current step event { stepIndex, line, method, variables, arrays }
 * @param {Object|null} [options.prevStep] - Previous step event (if any)
 * @param {Object|null} [options.nextStep] - Next step event (if any)
 * @param {string} [options.sourceCode] - Student Java source code
 * @param {number} [options.stepIndex]  - 0-based step index
 * @param {number} [options.totalSteps] - Total steps in trace
 * @returns {ExplanationResult}
 */
export function generateStepExplanation({ step, prevStep = null, nextStep = null, sourceCode = "", stepIndex = 0, totalSteps = 1 }) {
  if (!step || typeof step !== 'object') {
    return createEmptyExplanation();
  }

  const stepNumber = (typeof stepIndex === 'number' ? stepIndex : step.stepIndex ?? 0) + 1;
  const lineNumber = step.line ?? 0;
  const lines = (sourceCode || '').split(/\r?\n/);
  const rawLine = (lineNumber > 0 && lineNumber <= lines.length) ? lines[lineNumber - 1].trim() : '';

  const variables = step.variables || {};
  const arrays = step.arrays || {};

  // Build state difference compared to previous step
  const stateChange = detectStateChange(prevStep, step);

  // Analyze line pattern and runtime state
  const analysis = analyzeStepOperation({
    rawLine,
    lineNumber,
    step,
    prevStep,
    nextStep,
    variables,
    arrays,
  });

  return {
    stepNumber,
    lineNumber,
    lineCode: rawLine || `// Line ${lineNumber}`,
    category: analysis.category,
    what: analysis.what,
    why: analysis.why,
    stateChips: analysis.stateChips,
    stateChange,
    tip: analysis.tip || null,
  };
}

// ---------------------------------------------------------------------------
// Step Operation Analysis Rules
// ---------------------------------------------------------------------------

function analyzeStepOperation({ rawLine, lineNumber, step, prevStep, nextStep, variables, arrays }) {
  // 1. Method entry / signature
  if (/^public\s+static\s+void\s+main\s*\(/i.test(rawLine)) {
    return {
      category: 'Program Entry',
      what: 'Entering the main method, the starting point of the Java program.',
      why: 'The Java Virtual Machine (JVM) launches execution here when the program begins.',
      stateChips: buildVariableChips(variables, ['args']),
      tip: 'In Java, execution always begins with public static void main(String[] args).',
    };
  }

  // 2. Array Comparison: if (arr[j] > arr[j + 1]) or if (arr[j] < arr[minIdx])
  const ifAdjacentMatch = rawLine.match(/^if\s*\(\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*(>|<|>=|<=|==|!=)\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*\)/);
  if (ifAdjacentMatch) {
    const [, arr1Name, idx1Expr, op, arr2Name, idx2Expr] = ifAdjacentMatch;
    const idx1 = resolveIndexExpression(idx1Expr, variables);
    const idx2 = resolveIndexExpression(idx2Expr, variables);

    const val1 = getArrayElement(arrays, arr1Name, idx1);
    const val2 = getArrayElement(arrays, arr2Name, idx2);

    const chips = [];
    if (idx1 !== null && val1 !== null) chips.push({ label: `${arr1Name}[${idx1}]`, value: String(val1), highlight: true });
    if (idx2 !== null && val2 !== null) chips.push({ label: `${arr2Name}[${idx2}]`, value: String(val2), highlight: true });

    let condEval = null;
    if (val1 !== null && val2 !== null) {
      condEval = evaluateComparison(val1, op, val2);
      chips.push({ label: 'Condition', value: condEval ? 'TRUE' : 'FALSE' });
    }

    // Check if this is a Selection Sort minimum candidate comparison
    const isMinComparison = /min/i.test(idx1Expr) || /min/i.test(idx2Expr);
    if (isMinComparison) {
      let what = `Comparing candidate ${arr1Name}[${idx1 ?? idx1Expr}] with current minimum ${arr2Name}[${idx2 ?? idx2Expr}].`;
      let why = 'Determines if a smaller element has been found in the unsorted suffix.';
      let tip = 'Selection Sort scans the remaining elements to identify the smallest value.';

      if (val1 !== null && val2 !== null) {
        if (condEval === true) {
          what = `Comparing ${arr1Name}[${idx1}] (${val1}) ${op} ${arr2Name}[${idx2}] (${val2}) → Condition is TRUE.`;
          why = `Because ${val1} ${op} ${val2}, a smaller element was found! This candidate will become the new minimum.`;
          tip = 'A new minimum is discovered; its index will be recorded for the rest of this pass.';
        } else if (condEval === false) {
          what = `Comparing ${arr1Name}[${idx1}] (${val1}) ${op} ${arr2Name}[${idx2}] (${val2}) → Condition is FALSE.`;
          why = `Because ${val1} is not smaller than ${val2}, the current minimum at index ${idx2} (${val2}) remains unchanged.`;
          tip = 'The candidate is not smaller than the current minimum, so scanning continues.';
        }
      }

      return { category: 'Minimum Comparison', what, why, stateChips: chips, tip };
    }

    let what = `Comparing adjacent elements: ${arr1Name}[${idx1 ?? idx1Expr}] and ${arr2Name}[${idx2 ?? idx2Expr}].`;
    let why = 'Checks whether these two elements are out of sorted order.';
    let tip = 'Adjacent comparisons move larger values toward the end of the array one position at a time.';

    if (val1 !== null && val2 !== null) {
      if (condEval === true) {
        what = `Comparing ${arr1Name}[${idx1}] (${val1}) ${op} ${arr2Name}[${idx2}] (${val2}) → Condition is TRUE.`;
        why = `Because ${val1} ${op} ${val2}, these adjacent elements are out of order and must be swapped.`;
        tip = 'When adjacent elements are inverted, an exchange is required to bubble the larger item rightward.';
      } else if (condEval === false) {
        what = `Comparing ${arr1Name}[${idx1}] (${val1}) ${op} ${arr2Name}[${idx2}] (${val2}) → Condition is FALSE.`;
        why = `Because ${val1} is already in correct relative order with ${val2}, no swap is performed for this pair.`;
        tip = 'If adjacent elements are already ordered, the algorithm leaves them untouched and moves to the next pair.';
      }
    }

    return { category: 'Adjacent Comparison', what, why, stateChips: chips, tip };
  }

  // 3. Array Element to Target Comparison: if (arr[i] == target) or } else if (arr[mid] < target)
  const ifArrayScalarMatch = rawLine.match(/^(?:\}\s*)?(?:else\s+)?if\s*\(\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*(==|!=|<|>|<=|>=)\s*([a-zA-Z_]\w*|\d+)\s*\)/);
  if (ifArrayScalarMatch) {
    const [, arrName, idxExpr, op, targetExpr] = ifArrayScalarMatch;
    const idx = resolveIndexExpression(idxExpr, variables);
    const arrVal = getArrayElement(arrays, arrName, idx);
    const targetVal = variables[targetExpr] !== undefined
      ? variables[targetExpr]?.value
      : (!isNaN(Number(targetExpr)) ? Number(targetExpr) : null);

    const chips = [];
    if (idx !== null && arrVal !== null) chips.push({ label: `${arrName}[${idx}]`, value: String(arrVal), highlight: true });
    if (targetVal !== null) chips.push({ label: targetExpr, value: String(targetVal) });

    let condEval = null;
    if (arrVal !== null && targetVal !== null) {
      condEval = evaluateComparison(arrVal, op, targetVal);
      chips.push({ label: 'Condition', value: condEval ? 'TRUE' : 'FALSE' });
    }

    const isMidpoint = idxExpr.trim().toLowerCase() === 'mid';

    if (condEval === true) {
      if (isMidpoint) {
        if (op === '==') {
          return {
            category: 'Target Match Found',
            what: `Comparing ${arrName}[mid=${idx}] (${arrVal}) == ${targetExpr} (${targetVal}) → Condition is TRUE.`,
            why: `Target found at midpoint index ${idx}! The search succeeds.`,
            stateChips: chips,
            tip: 'Binary Search finds the target at the midpoint in O(1) best-case time.',
          };
        } else if (op === '<') {
          return {
            category: 'Midpoint Comparison (Search Right)',
            what: `Comparing ${arrName}[mid=${idx}] (${arrVal}) < ${targetExpr} (${targetVal}) → Condition is TRUE.`,
            why: `Midpoint value (${arrVal}) is less than target (${targetVal}). Because the array is sorted, target must lie in the right half. Low pointer will advance to mid + 1.`,
            stateChips: chips,
            tip: 'Discarding the left half cuts the remaining search space in half.',
          };
        } else if (op === '>') {
          return {
            category: 'Midpoint Comparison (Search Left)',
            what: `Comparing ${arrName}[mid=${idx}] (${arrVal}) > ${targetExpr} (${targetVal}) → Condition is TRUE.`,
            why: `Midpoint value (${arrVal}) is greater than target (${targetVal}). Because the array is sorted, target must lie in the left half. High pointer will retreat to mid - 1.`,
            stateChips: chips,
            tip: 'Discarding the right half cuts the remaining search space in half.',
          };
        }
      }

      return {
        category: 'Target Match Found',
        what: `Comparing ${arrName}[${idx ?? idxExpr}] (${arrVal ?? 'element'}) ${op} ${targetExpr} (${targetVal ?? 'target'}) → Condition is TRUE.`,
        why: `Target found at index ${idx ?? idxExpr}! The element matches the search value.`,
        stateChips: chips,
        tip: 'Linear Search stops scanning as soon as the first matching element is encountered.',
      };
    } else if (condEval === false) {
      if (isMidpoint && op === '==') {
        return {
          category: 'Midpoint Comparison',
          what: `Comparing ${arrName}[mid=${idx}] (${arrVal}) == ${targetExpr} (${targetVal}) → Condition is FALSE.`,
          why: `Midpoint element (${arrVal}) does not match target (${targetVal}). Continuing to check if target is in the left or right half.`,
          stateChips: chips,
          tip: 'When the midpoint does not match, Binary Search checks whether to search left or right.',
        };
      }
      return {
        category: 'Target Comparison (No Match)',
        what: `Comparing ${arrName}[${idx ?? idxExpr}] (${arrVal ?? 'element'}) ${op} ${targetExpr} (${targetVal ?? 'target'}) → Condition is FALSE.`,
        why: `Element at index ${idx ?? idxExpr} (${arrVal}) does not match target (${targetVal}). Search continues to next index.`,
        stateChips: chips,
        tip: 'When elements do not match, the loop increments the index to inspect the next slot.',
      };
    }

    return {
      category: 'Target Comparison',
      what: `Comparing array element ${arrName}[${idx ?? idxExpr}] ${op} target '${targetExpr}'.`,
      why: 'Evaluates whether the current element matches the search target.',
      stateChips: chips,
      tip: 'Each iteration examines one element sequentially.',
    };
  }

  // 3. Selection Sort: Minimum Index Initialization or Update: minIdx = i or minIdx = j
  const minIdxAssignMatch = rawLine.match(/^(?:int\s+)?(minIdx|min_idx|minIndex|min)\s*=\s*([a-zA-Z_]\w*)\s*;/i);
  if (minIdxAssignMatch) {
    const [, minVar, srcExpr] = minIdxAssignMatch;
    const srcVal = variables[srcExpr]?.value ?? resolveIndexExpression(srcExpr, variables);
    const chips = [
      { label: minVar, value: srcVal !== null && srcVal !== undefined ? String(srcVal) : srcExpr, highlight: true }
    ];

    if (/^i$/i.test(srcExpr) || (prevStep && !prevStep.variables?.[minVar])) {
      return {
        category: 'Minimum Tracking (Initialize)',
        what: `Initializing '${minVar}' to index ${srcVal ?? srcExpr} at the start of pass.`,
        why: 'Selection Sort assumes the first element of the unsorted subarray is the minimum candidate for this pass.',
        stateChips: chips,
        tip: 'Each pass begins by assuming the first unsorted position holds the minimum value.',
      };
    } else {
      return {
        category: 'Update Minimum Index',
        what: `Updating '${minVar}' to new minimum index ${srcVal ?? srcExpr}.`,
        why: 'A smaller element was detected! The algorithm records its index so it can be swapped at the end of the pass.',
        stateChips: chips,
        tip: 'The algorithm only remembers the index of the smallest element rather than swapping immediately.',
      };
    }
  }

  // 4. Insertion Sort: Key Extraction: int key = arr[i]; or key = arr[i];
  const keyExtractionMatch = rawLine.match(/^(?:int\s+)?key\s*=\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*;/i);
  if (keyExtractionMatch) {
    const [, arrName, idxExpr] = keyExtractionMatch;
    const idx = resolveIndexExpression(idxExpr, variables);
    const keyVal = getArrayElement(arrays, arrName, idx);
    const chips = [];
    if (idx !== null) chips.push({ label: 'Index i', value: String(idx) });
    if (keyVal !== null) chips.push({ label: 'key', value: String(keyVal), highlight: true });

    return {
      category: 'Key Extraction',
      what: `Extracting element ${arrName}[${idx ?? idxExpr}] (${keyVal ?? 'item'}) as 'key' to insert into the sorted prefix.`,
      why: `Prefix ${arrName}[0 ... ${(idx !== null ? idx - 1 : 'i - 1')}] is already sorted. Saving this element in 'key' allows preceding larger elements to shift rightward without overwriting it.`,
      stateChips: chips,
      tip: 'Insertion Sort picks the next element and shifts larger items rightward to open its sorted insertion slot.',
    };
  }

  // Stack element read: int peeked = stack[top]; or int popped = stack[top]; or int val = stack[top];
  const stackReadMatch = rawLine.match(/^(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*(?:stack|data)\s*\[\s*(?:top|top--)\s*\]\s*;/i);
  if (stackReadMatch) {
    const [, targetVar] = stackReadMatch;
    const topVal = variables['top']?.value;
    const stackArr = arrays['stack']?.values || arrays['data']?.values;
    const topElement = (stackArr && topVal !== undefined && topVal >= 0 && topVal < stackArr.length) ? stackArr[topVal] : null;
    const isPeek = targetVar.toLowerCase().includes('peek');
    const chips = [];
    if (topVal !== undefined) chips.push({ label: 'top', value: String(topVal) });
    if (topElement !== null) chips.push({ label: targetVar, value: String(topElement), highlight: true });

    if (isPeek) {
      return {
        category: 'Stack Peek (Inspect Top)',
        what: `Reading element at top index ${topVal !== undefined ? topVal : 'top'} (${topElement !== null ? topElement : 'element'}) into '${targetVar}' without modifying stack.`,
        why: 'PEEK inspects the most recently added item without altering the top pointer or stack contents.',
        stateChips: chips,
        tip: 'Peek operation has O(1) time complexity and produces zero side effects on the stack.',
      };
    } else {
      return {
        category: 'Stack Pop (Retrieve Top)',
        what: `Retrieving top element ${topElement !== null ? topElement : 'item'} from index ${topVal !== undefined ? topVal : 'top'} into '${targetVar}'.`,
        why: 'POP accesses the most recently added item before retreating the top pointer in LIFO order.',
        stateChips: chips,
        tip: 'In a stack, removing an element is always performed from the top.',
      };
    }
  }

  // Queue element read: int peeked = queue[front]; or int dequeued = queue[front]; or int val = queue[front];
  const queueReadMatch = rawLine.match(/^(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*(?:queue|q)\s*\[\s*(?:front|front\+\+)\s*\]\s*;/i);
  if (queueReadMatch) {
    const [, targetVar] = queueReadMatch;
    const frontVal = variables['front']?.value ?? 0;
    const queueArr = arrays['queue']?.values || arrays['q']?.values;
    const frontElement = (queueArr && frontVal !== undefined && frontVal >= 0 && frontVal < queueArr.length) ? queueArr[frontVal] : null;
    const isPeek = targetVar.toLowerCase().includes('peek');
    const chips = [];
    if (frontVal !== undefined) chips.push({ label: 'front', value: String(frontVal) });
    if (frontElement !== null) chips.push({ label: targetVar, value: String(frontElement), highlight: true });

    if (isPeek) {
      return {
        category: 'Queue Peek (Inspect Front)',
        what: `Reading element at front index ${frontVal !== undefined ? frontVal : 'front'} (${frontElement !== null ? frontElement : 'element'}) into '${targetVar}' without modifying queue.`,
        why: 'PEEK inspects the oldest added element at the front of the queue without removing it or advancing the front pointer under FIFO rules.',
        stateChips: chips,
        tip: 'Peek operation has O(1) time complexity and allows inspecting the next element in line with zero side effects.',
      };
    } else {
      return {
        category: 'Queue Dequeue (Retrieve Front)',
        what: `Retrieving front element ${frontElement !== null ? frontElement : 'item'} from index ${frontVal !== undefined ? frontVal : 'front'} into '${targetVar}'.`,
        why: 'DEQUEUE accesses the oldest added element (First-In, First-Out) before advancing the front pointer to remove it from the active queue.',
        stateChips: chips,
        tip: 'In a queue, removal is strictly performed from the FRONT in FIFO order.',
      };
    }
  }

  // 5. Swap Step 1: int temp = arr[j]; or temp = arr[minIdx];
  const swapStep1Match = rawLine.match(/^(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*;/);
  if (swapStep1Match) {
    const [, tempVar, arrName, idxExpr] = swapStep1Match;
    const idx = resolveIndexExpression(idxExpr, variables);
    const val = getArrayElement(arrays, arrName, idx);

    const chips = [];
    if (idx !== null && val !== null) chips.push({ label: `${arrName}[${idx}]`, value: String(val) });
    if (val !== null) chips.push({ label: `Saved to ${tempVar}`, value: String(val), highlight: true });

    return {
      category: 'Swap Step 1 (Preserve)',
      what: `Step 1 of swap: Saving ${arrName}[${idx ?? idxExpr}] (${val ?? 'element'}) into helper variable '${tempVar}'.`,
      why: 'Preserves the value before overwriting the array slot so data is not lost.',
      stateChips: chips,
      tip: 'Swapping two values in memory requires a temporary location to avoid overwriting data.',
    };
  }

  // 6. Swap Step 2 or Rightward Shift: arr[j] = arr[j + 1]; or arr[j + 1] = arr[j];
  const swapStep2Match = rawLine.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*;/);
  if (swapStep2Match) {
    const [, arr1Name, idx1Expr, arr2Name, idx2Expr] = swapStep2Match;
    const idx1 = resolveIndexExpression(idx1Expr, variables);
    const idx2 = resolveIndexExpression(idx2Expr, variables);
    const val2 = getArrayElement(arrays, arr2Name, idx2);

    const chips = [];
    if (idx2 !== null && val2 !== null) chips.push({ label: `Source ${arr2Name}[${idx2}]`, value: String(val2) });
    if (idx1 !== null) chips.push({ label: `Destination ${arr1Name}[${idx1}]`, value: val2 !== null ? `Will receive ${val2}` : 'Overwriting', highlight: true });

    // Check if this is an Insertion Sort rightward shift: arr[j + 1] = arr[j];
    const isRightwardShift = (idx1Expr.replace(/\s+/g, '') === 'j+1' || idx1Expr.replace(/\s+/g, '') === 'j+1') && idx2Expr.trim() === 'j';
    if (isRightwardShift) {
      return {
        category: 'Rightward Shift',
        what: `Shifting element ${arr2Name}[${idx2 ?? idx2Expr}] (${val2 ?? 'item'}) one position rightward into ${arr1Name}[${idx1 ?? idx1Expr}].`,
        why: `Vacates slot ${idx2 ?? 'j'} so the smaller key can slide closer to its sorted position in the prefix.`,
        stateChips: chips,
        tip: 'Preceding elements strictly greater than key slide to the right one position at a time.',
      };
    }

    const isAdjacent = rawLine.includes('j + 1') || rawLine.includes('+ 1') || rawLine.includes('+1');
    return {
      category: 'Swap Step 2 (Shift)',
      what: `Step 2 of swap: Copying value from ${arr2Name}[${idx2 ?? idx2Expr}] (${val2 ?? 'item'}) into ${arr1Name}[${idx1 ?? idx1Expr}].`,
      why: isAdjacent ? 'Shifts the adjacent element into the lower index slot.' : 'Shifts the element into the destination slot.',
      stateChips: chips,
      tip: 'After this step, both slots momentarily hold the same value; temp holds the preserved element.',
    };
  }

  // 7. Swap Step 3 or Key Insertion: arr[j + 1] = temp; or arr[j + 1] = key;
  const swapStep3Match = rawLine.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*([a-zA-Z_]\w*)\s*;/);
  if (swapStep3Match && !rawLine.includes('[')) {
    // handled elsewhere
  } else if (swapStep3Match) {
    const [, arrName, idxExpr, tempVar] = swapStep3Match;
    const idx = resolveIndexExpression(idxExpr, variables);
    const tempVal = variables[tempVar]?.value;

    const chips = [];
    if (tempVal !== undefined) chips.push({ label: tempVar, value: String(tempVal) });
    if (idx !== null) chips.push({ label: `${arrName}[${idx}]`, value: tempVal !== undefined ? `Updated to ${tempVal}` : 'Updated', highlight: true });

    if (tempVar.toLowerCase() === 'key') {
      return {
        category: 'Key Insertion',
        what: `Inserting saved key (${tempVal ?? 'value'}) into its sorted location at ${arrName}[${idx ?? idxExpr}].`,
        why: 'Completes this pass! All elements in prefix 0 through i are now in sorted relative order.',
        stateChips: chips,
        tip: 'With key placed in its sorted spot, the sorted prefix expands by one element.',
      };
    }

    return {
      category: 'Swap Step 3 (Restore)',
      what: `Step 3 of swap: Copying saved '${tempVar}' (${tempVal ?? 'value'}) into ${arrName}[${idx ?? idxExpr}].`,
      why: 'Completes the swap! The elements have now fully exchanged positions.',
      stateChips: chips,
      tip: 'The swapped elements are now positioned correctly in the array.',
    };
  }

  // 6. Array literal declaration: int[] arr = { 64, 34, ... };
  const arrayLiteralMatch = rawLine.match(/^(?:[a-zA-Z_]\w*\[\s*\])\s+([a-zA-Z_]\w*)\s*=\s*\{([^}]*)\}\s*;/);
  if (arrayLiteralMatch) {
    const [, arrName, elementsStr] = arrayLiteralMatch;
    const elements = elementsStr.split(',').map(s => s.trim()).filter(Boolean);
    const chips = [
      { label: 'Array', value: arrName },
      { label: 'Length', value: String(elements.length), highlight: true },
    ];
    return {
      category: 'Array Initialization',
      what: `Initializing array '${arrName}' with ${elements.length} elements: [${elementsStr}].`,
      why: 'Allocates contiguous storage in memory so items can be indexed sequentially starting at 0.',
      stateChips: chips,
      tip: 'In Java, arrays are fixed-size and zero-indexed. The first item is at index 0 and the last is at length - 1.',
    };
  }

  // 7. Array instantiation: int[] arr = new int[n];
  const arrayNewMatch = rawLine.match(/^(?:[a-zA-Z_]\w*\[\s*\])\s+([a-zA-Z_]\w*)\s*=\s*new\s+[a-zA-Z_]\w*\[([^\]]+)\]\s*;/);
  if (arrayNewMatch) {
    const [, arrName, lenExpr] = arrayNewMatch;
    return {
      category: 'Array Allocation',
      what: `Allocating new array '${arrName}' of size ${lenExpr}.`,
      why: 'Reserves a contiguous memory block with default initialized values.',
      stateChips: [{ label: 'Array', value: arrName }, { label: 'Size', value: lenExpr }],
      tip: 'Numeric arrays in Java are automatically default-initialized to 0.',
    };
  }

  // Stack Push element write: stack[top] = val; or data[top] = val;
  const stackPushMatch = rawLine.match(/^(?:stack|data)\s*\[\s*(?:top|\+\+top)\s*\]\s*=\s*(.+?);/i);
  if (stackPushMatch) {
    const [, valExpr] = stackPushMatch;
    const topVal = variables['top']?.value;
    const chips = [];
    if (topVal !== undefined) chips.push({ label: 'top', value: String(topVal) });
    chips.push({ label: 'Value', value: valExpr.trim(), highlight: true });
    return {
      category: 'Stack Push (Element Assignment)',
      what: `Writing value ${valExpr.trim()} into stack at top index ${topVal !== undefined ? topVal : 'top'}.`,
      why: 'Stores the newly pushed item at the top of the stack under LIFO rules.',
      stateChips: chips,
      tip: 'Every pushed element resides at the current top index, becoming the first item that will be popped.',
    };
  }

  // Queue Enqueue element write: queue[rear] = val; or q[rear] = val;
  const queueEnqueueMatch = rawLine.match(/^(?:queue|q)\s*\[\s*(?:rear|\+\+rear)\s*\]\s*=\s*(.+?);/i);
  if (queueEnqueueMatch) {
    const [, valExpr] = queueEnqueueMatch;
    const rearVal = variables['rear']?.value;
    const chips = [];
    if (rearVal !== undefined) chips.push({ label: 'rear', value: String(rearVal) });
    chips.push({ label: 'Value', value: valExpr.trim(), highlight: true });
    return {
      category: 'Queue Enqueue (Element Placement)',
      what: `Writing value ${valExpr.trim()} into the rear of the queue at index ${rearVal !== undefined ? rearVal : 'rear'}.`,
      why: 'Inserts the newly enqueued item at the rear of the queue under FIFO rules.',
      stateChips: chips,
      tip: 'Every enqueued item joins at the rear of the line and waits until all preceding elements have been dequeued.',
    };
  }

  // 8. General Array Write: arr[i] = expr;
  const arrayWriteMatch = rawLine.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*(.+?);/);
  if (arrayWriteMatch) {
    const [, arrName, idxExpr, valExpr] = arrayWriteMatch;
    const idx = resolveIndexExpression(idxExpr, variables);
    const chips = [
      { label: 'Target', value: `${arrName}[${idx ?? idxExpr}]`, highlight: true },
    ];
    return {
      category: 'Array Write',
      what: `Writing new value into array '${arrName}' at index [${idx ?? idxExpr}].`,
      why: 'Modifies the array element in place without reallocating memory.',
      stateChips: chips,
      tip: 'Writing to an array by index is an O(1) constant-time memory update.',
    };
  }

  // 9. For loop header: for (int i = 0; i < n - 1; i++)
  const forLoopMatch = rawLine.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/);
  if (forLoopMatch) {
    const [, loopVar, initExpr, condExpr, stepExpr] = forLoopMatch;
    const currentVarVal = variables[loopVar]?.value;

    const chips = [];
    if (currentVarVal !== undefined) {
      chips.push({ label: loopVar, value: String(currentVarVal), highlight: true });
    }

    let isInnerLoop = loopVar === 'j' || rawLine.includes('n - i') || rawLine.includes('- i') || rawLine.includes('i + 1');
    if (isInnerLoop) {
      const isSuffixScan = rawLine.includes('i + 1');
      return {
        category: isSuffixScan ? 'Inner Loop Header (Scan Suffix)' : 'Inner Loop Header',
        what: `Inner loop check: ${loopVar} = ${currentVarVal ?? initExpr}. Evaluating: ${condExpr}.`,
        why: isSuffixScan
          ? 'Scans the remaining unsorted elements to search for a candidate smaller than the current minimum.'
          : 'Controls the pointer for comparing adjacent elements in the current pass.',
        stateChips: chips,
        tip: isSuffixScan
          ? 'Each iteration examines one unsorted element to see if it is smaller than the current minimum.'
          : 'Each inner loop step examines one adjacent pair in the unsorted portion of the array.',
      };
    }

    if (rawLine.includes('.length') || rawLine.includes('length')) {
      return {
        category: 'Sequential Search Loop',
        what: `Search loop check: ${loopVar} = ${currentVarVal ?? initExpr}. Evaluating: ${condExpr}.`,
        why: 'Advances the search pointer to inspect the next element in the array.',
        stateChips: chips,
        tip: 'Linear Search visits elements in sequential index order from index 0 to length - 1.',
      };
    }

    return {
      category: 'Outer Loop Header',
      what: `Outer loop check: ${loopVar} = ${currentVarVal ?? initExpr}. Evaluating: ${condExpr}.`,
      why: 'Tracks the pass number. Each completed pass places the next element into its final sorted position.',
      stateChips: chips,
      tip: 'The outer loop repeats until all positions in the array are sorted.',
    };
  }

  // 10. Insertion Sort: While Shift Loop: while (j >= 0 && arr[j] > key)
  const whileShiftMatch = rawLine.match(/^while\s*\(\s*j\s*>=\s*0\s*&&\s*([a-zA-Z_]\w*)\s*\[\s*j\s*\]\s*>\s*key\s*\)/i);
  if (whileShiftMatch) {
    const [, arrName] = whileShiftMatch;
    const jVal = variables['j']?.value;
    const keyVal = variables['key']?.value;
    const valJ = (jVal !== undefined && jVal !== null) ? getArrayElement(arrays, arrName, jVal) : null;

    const chips = [];
    if (jVal !== undefined) chips.push({ label: 'j', value: String(jVal) });
    if (keyVal !== undefined) chips.push({ label: 'key', value: String(keyVal) });
    if (valJ !== null) chips.push({ label: `${arrName}[${jVal}]`, value: String(valJ) });

    let isShiftTrue = null;
    if (jVal !== undefined && jVal !== null && keyVal !== undefined && valJ !== null) {
      isShiftTrue = jVal >= 0 && valJ > keyVal;
      chips.push({ label: 'Condition', value: isShiftTrue ? 'TRUE' : 'FALSE', highlight: true });
    }

    if (isShiftTrue === true) {
      return {
        category: 'Shift Condition Check',
        what: `Evaluating shift condition: j (${jVal}) >= 0 is TRUE and ${arrName}[${jVal}] (${valJ}) > key (${keyVal}) → Condition is TRUE.`,
        why: `Because ${arrName}[${jVal}] (${valJ}) is greater than key (${keyVal}), it must shift rightward to make room.`,
        stateChips: chips,
        tip: 'The while loop continues shifting preceding elements rightward as long as they are strictly larger than key.',
      };
    } else if (isShiftTrue === false) {
      return {
        category: 'Shift Condition Check',
        what: `Evaluating shift condition: condition is FALSE (either j < 0 or ${arrName}[${jVal}] <= key).`,
        why: `Found the insertion position for key! Shifting stops at index ${(jVal !== undefined ? jVal + 1 : 'j + 1')}.`,
        stateChips: chips,
        tip: 'When a preceding element is less than or equal to key (or index drops below 0), shifting terminates.',
      };
    }

    return {
      category: 'Shift Condition Check',
      what: `Checking while condition: while (j >= 0 && ${arrName}[j] > key).`,
      why: 'Controls whether preceding elements continue shifting rightward.',
      stateChips: chips,
      tip: 'The while loop terminates when the proper insertion position for key is reached.',
    };
  }

  // Binary Search: While Loop Header: while (low <= high)
  const whileBinarySearchMatch = rawLine.match(/^while\s*\(\s*low\s*<=\s*high\s*\)/i);
  if (whileBinarySearchMatch) {
    const lowVal = variables['low']?.value;
    const highVal = variables['high']?.value;
    const chips = [];
    if (lowVal !== undefined) chips.push({ label: 'low', value: String(lowVal) });
    if (highVal !== undefined) chips.push({ label: 'high', value: String(highVal) });

    const isValid = (lowVal !== undefined && highVal !== undefined) ? lowVal <= highVal : null;
    if (isValid !== null) {
      chips.push({ label: 'Condition', value: isValid ? 'TRUE' : 'FALSE', highlight: true });
    }

    if (isValid === true) {
      return {
        category: 'Binary Search Loop Header',
        what: `Evaluating search loop: low (${lowVal}) <= high (${highVal}) → Condition is TRUE.`,
        why: 'The search space is valid and non-empty. Next iteration will inspect the midpoint.',
        stateChips: chips,
        tip: 'The while loop continues as long as at least one element remains in the search interval.',
      };
    } else if (isValid === false) {
      return {
        category: 'Binary Search Loop Header',
        what: `Evaluating search loop: low (${lowVal}) <= high (${highVal}) → Condition is FALSE.`,
        why: `low (${lowVal}) has exceeded high (${highVal}): the search interval is empty! Target was not found.`,
        stateChips: chips,
        tip: 'When low > high, all possible positions have been examined and the loop terminates.',
      };
    }

    return {
      category: 'Binary Search Loop Header',
      what: 'Evaluating search loop: while (low <= high).',
      why: 'Checks whether elements remain in the active search interval.',
      stateChips: chips,
      tip: 'The search space halves with each iteration.',
    };
  }

  // Stack Draining Loop: while (top >= 0)
  const stackWhileLoopMatch = rawLine.match(/^while\s*\(\s*top\s*>=\s*0\s*\)/i);
  if (stackWhileLoopMatch) {
    const curTop = variables['top']?.value;
    const hasElements = curTop !== undefined ? curTop >= 0 : null;
    const chips = [];
    if (curTop !== undefined) chips.push({ label: 'top', value: String(curTop) });
    if (hasElements !== null) chips.push({ label: 'Condition', value: hasElements ? 'TRUE (Non-Empty)' : 'FALSE (Empty)', highlight: true });
    return {
      category: 'Stack Draining Loop',
      what: `Evaluating: while (top >= 0). Current top = ${curTop !== undefined ? curTop : 'top'}.`,
      why: 'Loops to process or drain remaining elements as long as the stack is not empty (top >= 0).',
      stateChips: chips,
      tip: 'When top reaches -1, the stack is completely empty and the loop terminates.',
    };
  }

  // Queue Draining Loop: while (size > 0)
  const queueWhileLoopMatch = rawLine.match(/^while\s*\(\s*size\s*>\s*0\s*\)/i);
  if (queueWhileLoopMatch) {
    const curSize = variables['size']?.value;
    const hasElements = curSize !== undefined ? curSize > 0 : null;
    const chips = [];
    if (curSize !== undefined) chips.push({ label: 'size', value: String(curSize) });
    if (hasElements !== null) chips.push({ label: 'Condition', value: hasElements ? 'TRUE (Non-Empty)' : 'FALSE (Empty)', highlight: true });
    return {
      category: 'Queue Draining Loop',
      what: `Evaluating: while (size > 0). Current size = ${curSize !== undefined ? curSize : 'size'}.`,
      why: 'Loops to process or drain remaining elements as long as the queue is not empty (size > 0).',
      stateChips: chips,
      tip: 'When size reaches 0, the queue is completely drained and the loop terminates.',
    };
  }

  // Linked List Traversal Loop: while (curr != null) or while (current != null)
  const llWhileLoopMatch = rawLine.match(/^while\s*\(\s*(curr|current|node)\s*!=\s*null\s*\)/i);
  if (llWhileLoopMatch) {
    const [, ptrVar] = llWhileLoopMatch;
    const ptrVal = variables[ptrVar]?.value;
    return {
      category: 'Linked List Traversal Loop',
      what: `Evaluating traversal loop: while (${ptrVar} != null). Pointer ${ptrVar} is currently ${ptrVal !== undefined ? (ptrVal === null ? 'null (End of list)' : 'pointing to a node') : 'active'}.`,
      why: 'Loops through sequentially linked nodes until reaching null at the end of the list.',
      stateChips: [{ label: ptrVar, value: ptrVal !== null ? 'Node' : 'null', highlight: true }],
      tip: 'In a singly linked list, traversal stops when the pointer encounters the terminal null reference.',
    };
  }

  // 11. While loop header: while (cond)
  const whileLoopMatch = rawLine.match(/^while\s*\(\s*(.+)\s*\)/);
  if (whileLoopMatch) {
    const [, condExpr] = whileLoopMatch;
    return {
      category: 'While Loop',
      what: `Evaluating while-loop condition: (${condExpr}).`,
      why: 'If the condition evaluates to true, the loop body executes; otherwise, the loop terminates.',
      stateChips: buildVariableChips(variables),
      tip: 'Make sure loop variables are updated inside the body so the loop eventually terminates.',
    };
  }

  // Stack Empty Check: if (top == -1)
  const stackEmptyCheckMatch = rawLine.match(/^if\s*\(\s*top\s*==\s*-1\s*\)/i);
  if (stackEmptyCheckMatch) {
    const curTop = variables['top']?.value;
    const isEmpty = curTop !== undefined ? curTop === -1 : null;
    const chips = [];
    if (curTop !== undefined) chips.push({ label: 'top', value: String(curTop) });
    if (isEmpty !== null) chips.push({ label: 'Is Empty', value: isEmpty ? 'TRUE (Underflow)' : 'FALSE', highlight: true });
    return {
      category: 'Empty Stack Check (Underflow Protection)',
      what: `Checking if stack is empty: top (${curTop !== undefined ? curTop : 'top'}) == -1 → ${isEmpty !== null ? (isEmpty ? 'TRUE' : 'FALSE') : 'Evaluating'}.`,
      why: 'Prevents Underflow errors by checking if elements exist before attempting to pop or peek.',
      stateChips: chips,
      tip: 'Popping or peeking an empty stack causes an underflow error; always check if empty first.',
    };
  }

  // Queue Empty Check: if (size == 0) or if (front > rear)
  const queueEmptyCheckMatch = rawLine.match(/^if\s*\(\s*(size\s*==\s*0|front\s*>\s*rear)\s*\)/i);
  if (queueEmptyCheckMatch) {
    const sizeVal = variables['size']?.value;
    const frontVal = variables['front']?.value;
    const rearVal = variables['rear']?.value;
    const isEmpty = sizeVal !== undefined ? sizeVal === 0 : (frontVal !== undefined && rearVal !== undefined ? frontVal > rearVal : true);
    return {
      category: 'Empty Queue Check (Underflow Protection)',
      what: `Evaluating empty queue condition: ${rawLine.slice(3, -1).trim()} → ${isEmpty ? 'TRUE (Queue is empty)' : 'FALSE (Queue has elements)'}.`,
      why: 'Prevents queue underflow by checking whether elements exist before attempting a dequeue or peek.',
      stateChips: [
        ...(sizeVal !== undefined ? [{ label: 'size', value: String(sizeVal) }] : []),
        ...(frontVal !== undefined ? [{ label: 'front', value: String(frontVal) }] : []),
        ...(rearVal !== undefined ? [{ label: 'rear', value: String(rearVal) }] : []),
        { label: 'Result', value: isEmpty ? 'EMPTY' : 'NOT EMPTY', highlight: true }
      ],
      tip: 'Attempting to dequeue from an empty queue triggers underflow, so checking size == 0 guards against runtime errors.',
    };
  }

  // Linear Search: Evaluation of search result if (foundIndex != -1)
  const foundCheckMatch = rawLine.match(/^if\s*\(\s*(foundIndex|found_idx|found)\s*(==|!=)\s*(-1|\w+)\s*\)/i);
  if (foundCheckMatch) {
    const [, foundVar, op, cmpVal] = foundCheckMatch;
    const foundVal = variables[foundVar]?.value;
    const isFound = foundVal !== undefined && foundVal !== null && foundVal !== -1;
    const condTrue = op === '!=' ? isFound : !isFound;
    const chips = [];
    if (foundVal !== undefined) chips.push({ label: foundVar, value: String(foundVal), highlight: true });
    chips.push({ label: 'Condition', value: condTrue ? 'TRUE' : 'FALSE' });
    return {
      category: 'Search Result Evaluation',
      what: `Evaluating search outcome: ${foundVar} (${foundVal ?? 'index'}) ${op} ${cmpVal} → ${condTrue ? 'TRUE' : 'FALSE'}.`,
      why: isFound
        ? `A valid match was located at index ${foundVal}. The program proceeds to report the found position.`
        : 'Target was not located during the scan. The program proceeds to report that the item is absent.',
      stateChips: chips,
      tip: 'The foundIndex value determines whether the target found or not found branch executes.',
    };
  }

  // BST: Base Case Null Check: if (root == null)
  const bstNullCheckMatch = rawLine.match(/if\s*\(\s*([a-zA-Z_]\w*)\s*==\s*null\s*\)/i);
  if (bstNullCheckMatch) {
    const [, nodeVar] = bstNullCheckMatch;
    return {
      category: 'BST Null Check (Base Case)',
      what: `Checking if '${nodeVar}' reference is null.`,
      why: 'Base case for recursive operations: indicates an empty subtree or end of branch.',
      stateChips: [{ label: nodeVar, value: 'null check', highlight: true }],
      tip: 'In recursion, base cases prevent infinite recursion and signal the point where a new node is inserted or search terminates.',
    };
  }

  // 12. Conditional if statement (general): if (cond)
  const ifGeneralMatch = rawLine.match(/^if\s*\(\s*(.+)\s*\)/);
  if (ifGeneralMatch) {
    const [, condExpr] = ifGeneralMatch;
    return {
      category: 'Conditional Branch',
      what: `Evaluating conditional branch: if (${condExpr}).`,
      why: 'Controls execution direction based on runtime boolean evaluation.',
      stateChips: buildVariableChips(variables),
      tip: 'The line following an if-statement only runs if the boolean condition evaluates to true.',
    };
  }

  // 13. Else statement
  if (/^else\b/.test(rawLine)) {
    return {
      category: 'Alternative Branch',
      what: 'Entering the else branch because the preceding condition was false.',
      why: 'Provides alternative instructions when the tested condition is not met.',
      stateChips: buildVariableChips(variables),
      tip: 'An else block guarantees an alternative action executes when the if-condition fails.',
    };
  }

  // Binary Search: Interval Setup (low / high initialization)
  const intervalInitMatch = rawLine.match(/^(?:int\s+)?(low|high)\s*=\s*(0|[a-zA-Z_]\w*\.length\s*-\s*1|n\s*-\s*1)\s*;/i);
  if (intervalInitMatch) {
    const [, ptr, expr] = intervalInitMatch;
    const isLow = ptr.toLowerCase() === 'low';
    const val = isLow ? 0 : (variables['high']?.value ?? expr);
    return {
      category: isLow ? 'Interval Initialization (Low)' : 'Interval Initialization (High)',
      what: `Initializing '${ptr}' to ${val} to establish the initial search bounds.`,
      why: isLow
        ? 'Sets the left boundary of the search interval to index 0 (first element).'
        : 'Sets the right boundary of the search interval to the last element of the array.',
      stateChips: [{ label: ptr, value: String(val), highlight: true }],
      tip: 'Binary Search initially covers the entire array from index 0 to length - 1.',
    };
  }

  // Binary Search: Midpoint calculation: int mid = low + (high - low) / 2;
  const midCalcMatch = rawLine.match(/^(?:int\s+)?mid\s*=\s*(.+?);/i);
  if (midCalcMatch) {
    const [, expr] = midCalcMatch;
    const lowVal = variables['low']?.value;
    const highVal = variables['high']?.value;
    const midVal = (lowVal !== undefined && highVal !== undefined)
      ? lowVal + Math.floor((highVal - lowVal) / 2)
      : (variables['mid']?.value ?? null);

    const chips = [];
    if (lowVal !== undefined) chips.push({ label: 'low', value: String(lowVal) });
    if (highVal !== undefined) chips.push({ label: 'high', value: String(highVal) });
    if (midVal !== null) chips.push({ label: 'mid', value: String(midVal), highlight: true });

    return {
      category: 'Midpoint Calculation',
      what: `Calculating search midpoint: mid = ${lowVal ?? 'low'} + (${highVal ?? 'high'} - ${lowVal ?? 'low'}) / 2 = ${midVal ?? 'mid'}.`,
      why: 'Divides the active search interval in half. Using low + (high - low) / 2 avoids integer overflow for large indices.',
      stateChips: chips,
      tip: 'The calculated midpoint divides the remaining candidate search space into two equal halves.',
    };
  }

  // Binary Search: Pointer updates: low = mid + 1; or high = mid - 1;
  const pointerUpdateMatch = rawLine.match(/^(low|high)\s*=\s*mid\s*([+-])\s*1\s*;/i);
  if (pointerUpdateMatch) {
    const [, ptr, sign] = pointerUpdateMatch;
    const midVal = variables['mid']?.value;
    const newVal = midVal !== undefined ? (sign === '+' ? midVal + 1 : midVal - 1) : null;
    const chips = [];
    if (midVal !== undefined) chips.push({ label: 'mid', value: String(midVal) });
    if (newVal !== null) chips.push({ label: ptr, value: String(newVal), highlight: true });

    if (ptr.toLowerCase() === 'low') {
      return {
        category: 'Update Low Pointer',
        what: `Updating low pointer to mid + 1 (${newVal ?? 'mid + 1'}).`,
        why: 'Eliminates the entire left half including mid. The new search space is [' + (newVal ?? 'mid+1') + ', high].',
        stateChips: chips,
        tip: 'Advancing low narrows the search window to elements strictly to the right of mid.',
      };
    } else {
      return {
        category: 'Update High Pointer',
        what: `Updating high pointer to mid - 1 (${newVal ?? 'mid - 1'}).`,
        why: 'Eliminates the entire right half including mid. The new search space is [low, ' + (newVal ?? 'mid-1') + '].',
        stateChips: chips,
        tip: 'Retreating high narrows the search window to elements strictly to the left of mid.',
      };
    }
  }

  // Linear Search: foundIndex assignment / initialization
  const foundIdxMatch = rawLine.match(/^(?:int\s+)?(foundIndex|found_idx|found)\s*=\s*(.+?);/i);
  if (foundIdxMatch) {
    const [, foundVar, valExpr] = foundIdxMatch;
    const isInit = valExpr.trim() === '-1';
    const chips = [{ label: foundVar, value: valExpr.trim(), highlight: true }];
    if (isInit) {
      return {
        category: 'Search Initialization',
        what: `Initializing '${foundVar}' to -1 before searching begins.`,
        why: 'In Java, index -1 conventionally represents that the target has not yet been located.',
        stateChips: chips,
        tip: 'Using -1 as a sentinel flag distinguishes "not found" from index 0.',
      };
    }
    const val = variables[valExpr]?.value ?? resolveIndexExpression(valExpr, variables) ?? valExpr;
    return {
      category: 'Record Match Index',
      what: `Recording match position: setting '${foundVar}' to index ${val}.`,
      why: 'Stores the index of the matching element so it can be reported after exiting the loop.',
      stateChips: [{ label: foundVar, value: String(val), highlight: true }],
      tip: 'Saving the match index captures where the target occurred in the array.',
    };
  }

  // Stack Pointer Initialization: int top = -1;
  const stackPointerInitMatch = rawLine.match(/^(?:int\s+)?top\s*=\s*(-1)\s*;/i);
  if (stackPointerInitMatch) {
    return {
      category: 'Stack Initialization (Top Pointer)',
      what: 'Initializing stack pointer top = -1 to represent an empty stack.',
      why: 'In a 0-indexed array stack, top = -1 indicates that zero elements currently exist.',
      stateChips: [{ label: 'top', value: '-1', highlight: true }],
      tip: 'An empty stack is conventionally tracked with top pointer set to -1.',
    };
  }

  // Queue Pointer Initialization: int front = 0; int rear = -1;
  if (rawLine.includes('front') || rawLine.includes('rear')) {
    const hasFront = /(?:int\s+)?front\s*=\s*0/i.test(rawLine);
    const hasRear = /(?:int\s+)?rear\s*=\s*-1/i.test(rawLine);
    if (hasFront || hasRear) {
      const isBoth = hasFront && hasRear;
      return {
        category: isBoth ? 'Queue Initialization' : (hasFront ? 'Queue Initialization (Front Pointer)' : 'Queue Initialization (Rear Pointer)'),
        what: isBoth
          ? 'Initializing front pointer (0) and rear pointer (-1) to establish empty queue state.'
          : (hasFront
            ? 'Initializing front pointer front = 0 to establish the start index of the queue.'
            : 'Initializing rear pointer rear = -1 to represent an empty queue with zero elements.'),
        why: 'In an array-backed queue, front points to the head element while rear tracks the tail (rear = -1 indicates empty under FIFO rules).',
        stateChips: [
          ...(hasFront ? [{ label: 'front', value: '0', highlight: true }] : []),
          ...(hasRear ? [{ label: 'rear', value: '-1', highlight: true }] : []),
        ],
        tip: 'When rear < front (e.g. front = 0, rear = -1), the queue has size 0 and is completely empty.',
      };
    }
  }

  // 14. Variable declaration with initialization: int n = arr.length;
  const varDeclMatch = rawLine.match(/^(?:int|double|float|long|boolean|char|String)\s+([a-zA-Z_]\w*)\s*=\s*(.+?);/);
  if (varDeclMatch) {
    const [, varName, initExpr] = varDeclMatch;
    const chips = [{ label: 'Variable', value: varName, highlight: true }];
    return {
      category: 'Variable Declaration',
      what: `Declaring variable '${varName}' and initializing it with '${initExpr}'.`,
      why: 'Reserves local storage for tracking numbers or intermediate results.',
      stateChips: chips,
      tip: 'Local variables are scoped to the block where they are declared.',
    };
  }

  // Stack Pointer Increment: top++;
  const stackPointerIncMatch = rawLine.match(/^top\s*(\+\+|\+=\s*1|\s*=\s*top\s*\+\s*1)\s*;/i);
  if (stackPointerIncMatch) {
    const curTop = variables['top']?.value;
    const nextTop = curTop !== undefined ? curTop + 1 : 'top + 1';
    return {
      category: 'Stack Pointer Increment',
      what: `Advancing top pointer from ${curTop !== undefined ? curTop : 'current'} to ${nextTop}.`,
      why: 'Prepares an empty slot at the new top index to receive the next pushed element.',
      stateChips: [{ label: 'top', value: `${curTop ?? ''} → ${nextTop}`, highlight: true }],
      tip: 'Pushing an element increases the stack size and advances the top pointer by 1.',
    };
  }

  // Stack Pointer Decrement: top--;
  const stackPointerDecMatch = rawLine.match(/^top\s*(--|-=\s*1|\s*=\s*top\s*-\s*1)\s*;/i);
  if (stackPointerDecMatch) {
    const curTop = variables['top']?.value;
    const nextTop = curTop !== undefined ? curTop - 1 : 'top - 1';
    return {
      category: 'Stack Pointer Decrement',
      what: `Decrementing top pointer from ${curTop !== undefined ? curTop : 'current'} to ${nextTop}.`,
      why: 'Retreats the top pointer to the preceding element after popping, reducing stack size by 1.',
      stateChips: [{ label: 'top', value: `${curTop ?? ''} → ${nextTop}`, highlight: true }],
      tip: 'Popping an element decreases the stack size and moves the top pointer down by 1.',
    };
  }

  // Queue Rear Pointer Increment: rear++;
  const queueRearIncMatch = rawLine.match(/^rear\s*(\+\+|\+=\s*1|\s*=\s*rear\s*\+\s*1)\s*;/i);
  if (queueRearIncMatch) {
    const curRear = variables['rear']?.value;
    const nextRear = curRear !== undefined ? curRear + 1 : 'rear + 1';
    return {
      category: 'Queue Rear Pointer Increment',
      what: `Advancing rear pointer from ${curRear !== undefined ? curRear : 'current'} to ${nextRear}.`,
      why: 'Prepares the next available slot at the rear of the queue to receive an incoming enqueued element.',
      stateChips: [{ label: 'rear', value: `${curRear ?? ''} → ${nextRear}`, highlight: true }],
      tip: 'Enqueueing advances the rear pointer by 1 as the queue expands.',
    };
  }

  // Queue Front Pointer Increment: front++;
  const queueFrontIncMatch = rawLine.match(/^front\s*(\+\+|\+=\s*1|\s*=\s*front\s*\+\s*1)\s*;/i);
  if (queueFrontIncMatch) {
    const curFront = variables['front']?.value;
    const nextFront = curFront !== undefined ? curFront + 1 : 'front + 1';
    return {
      category: 'Queue Front Pointer Increment',
      what: `Advancing front pointer from ${curFront !== undefined ? curFront : 'current'} to ${nextFront}.`,
      why: 'Moves the front of the queue forward by 1, effectively removing the served element under FIFO rules.',
      stateChips: [{ label: 'front', value: `${curFront ?? ''} → ${nextFront}`, highlight: true }],
      tip: 'Dequeuing advances the front pointer to the next element waiting in line.',
    };
  }

  // Linked List: Node Instantiation: Node newNode = new Node(data);
  const llNodeNewMatch = rawLine.match(/(?:Node\s+)?([a-zA-Z_]\w*)\s*=\s*new\s+Node\(([^)]*)\);/i);
  if (llNodeNewMatch) {
    const [, nodeVar, dataExpr] = llNodeNewMatch;
    return {
      category: 'Linked List Node Creation',
      what: `Creating new Node '${nodeVar}' with data value (${dataExpr.trim()}).`,
      why: 'Allocates a new node dynamically with its data field initialized and next reference set to null.',
      stateChips: [{ label: 'Node', value: nodeVar, highlight: true }, { label: 'Data', value: dataExpr.trim() }],
      tip: 'Each linked list node stores data and a pointer reference to the next node in the sequence.',
    };
  }

  // Linked List: Connect New Node to Head: newNode.next = head;
  const llConnectHeadMatch = rawLine.match(/([a-zA-Z_]\w*)\.next\s*=\s*head\s*;/i);
  if (llConnectHeadMatch) {
    const [, nodeVar] = llConnectHeadMatch;
    return {
      category: 'Connect Node to Head',
      what: `Setting ${nodeVar}.next = head to point to the current start of the list.`,
      why: 'Links the newly created node so that the existing chain follows behind it.',
      stateChips: [{ label: `${nodeVar}.next`, value: 'head', highlight: true }],
      tip: 'Pointing next to head preserves the rest of the list before moving the head pointer.',
    };
  }

  // Linked List: Update Head Pointer: head = newNode;
  const llUpdateHeadMatch = rawLine.match(/^head\s*=\s*([a-zA-Z_]\w*)\s*;/i);
  if (llUpdateHeadMatch) {
    const [, nodeVar] = llUpdateHeadMatch;
    return {
      category: 'Update Head Pointer',
      what: `Updating head pointer to point to '${nodeVar}'.`,
      why: 'Designates the new node as the first node in the linked list.',
      stateChips: [{ label: 'head', value: nodeVar, highlight: true }],
      tip: 'Insertion at the head is an O(1) constant-time operation because no traversal is required.',
    };
  }

  // Linked List: Unlink node (Skip Deleted Node): curr.next = curr.next.next;
  const llUnlinkMatch = rawLine.match(/([a-zA-Z_]\w*)\.next\s*=\s*\1\.next\.next\s*;/i);
  if (llUnlinkMatch) {
    const [, ptrVar] = llUnlinkMatch;
    return {
      category: 'Unlink Node (Deletion)',
      what: `Bypassing target node: setting ${ptrVar}.next = ${ptrVar}.next.next.`,
      why: 'Removes the node from the chain by pointing directly to the successor node.',
      stateChips: [{ label: `${ptrVar}.next`, value: 'next.next', highlight: true }],
      tip: 'Deleting a node in a singly linked list requires updating the predecessor node next pointer.',
    };
  }

  // Linked List: Reverse Pointer Link: curr.next = prev;
  const llReverseLinkMatch = rawLine.match(/([a-zA-Z_]\w*)\.next\s*=\s*prev\s*;/i);
  if (llReverseLinkMatch) {
    const [, ptrVar] = llReverseLinkMatch;
    return {
      category: 'Reverse Pointer Link',
      what: `Reversing link: setting ${ptrVar}.next = prev.`,
      why: 'Flips the directional arrow of the current node to point to its predecessor instead of its successor.',
      stateChips: [{ label: `${ptrVar}.next`, value: 'prev', highlight: true }],
      tip: 'Iterative reversal updates next pointers node-by-node using three tracking pointers (prev, curr, next).',
    };
  }

  // Linked List: Connect Node to Next (Tail/Insertion): curr.next = newNode;
  const llConnectNextMatch = rawLine.match(/([a-zA-Z_]\w*)\.next\s*=\s*([a-zA-Z_]\w*)\s*;/i);
  if (llConnectNextMatch) {
    const [, currVar, nextVar] = llConnectNextMatch;
    return {
      category: 'Link Node (Update Next Reference)',
      what: `Linking ${currVar}.next = ${nextVar}.`,
      why: 'Attaches the node to the successor in the chain.',
      stateChips: [{ label: `${currVar}.next`, value: nextVar, highlight: true }],
      tip: 'Modifying the next reference extends or splices the linked list sequence.',
    };
  }

  // Linked List: Advance Traversal Pointer: curr = curr.next;
  const llAdvancePtrMatch = rawLine.match(/([a-zA-Z_]\w*)\s*=\s*\1\.next\s*;/i);
  if (llAdvancePtrMatch) {
    const [, ptrVar] = llAdvancePtrMatch;
    return {
      category: 'Advance Traversal Pointer',
      what: `Advancing ${ptrVar} to ${ptrVar}.next.`,
      why: 'Moves the inspection pointer to the next consecutive node along the chain.',
      stateChips: [{ label: ptrVar, value: 'next node', highlight: true }],
      tip: 'Linked lists do not support index-based random access; finding an element requires sequential traversal.',
    };
  }

  // Linked List: Initialize Traversal Pointer: Node curr = head;
  const llInitPtrMatch = rawLine.match(/(?:Node\s+)?([a-zA-Z_]\w*)\s*=\s*head\s*;/i);
  if (llInitPtrMatch) {
    const [, ptrVar] = llInitPtrMatch;
    return {
      category: 'Initialize Traversal Pointer',
      what: `Initializing traversal pointer '${ptrVar}' to start at head.`,
      why: 'Begins sequential scan from the first node of the list.',
      stateChips: [{ label: ptrVar, value: 'head', highlight: true }],
      tip: 'All standard linked list traversals start at the head pointer.',
    };
  }

  // BST: Node Creation Return: return new Node(val);
  const bstNewNodeMatch = rawLine.match(/return\s+new\s+Node\(([^)]*)\);/i);
  if (bstNewNodeMatch) {
    const [, valExpr] = bstNewNodeMatch;
    return {
      category: 'BST Node Creation',
      what: `Creating and returning a new BST leaf node with value (${valExpr.trim()}).`,
      why: 'Allocates a new node dynamically with left and right children initialized to null.',
      stateChips: [{ label: 'Node', value: `Node(${valExpr.trim()})`, highlight: true }],
      tip: 'In a Binary Search Tree, new keys are always inserted as leaves at the appropriate null position.',
    };
  }

  // BST: Recursive Child Subtree Updates: root.left = insert(root.left, val); / root.right = ...
  const bstChildAssignMatch = rawLine.match(/([a-zA-Z_]\w*)\.(left|right)\s*=\s*([a-zA-Z_]\w*)\(([^)]*)\);/i);
  if (bstChildAssignMatch) {
    const [, rootVar, childSide, funcName, argsExpr] = bstChildAssignMatch;
    const sideName = childSide.toLowerCase() === 'left' ? 'left' : 'right';
    return {
      category: `BST ${sideName.charAt(0).toUpperCase() + sideName.slice(1)} Subtree Update`,
      what: `Setting ${rootVar}.${sideName} to the result of ${funcName}(${argsExpr}).`,
      why: `Re-links the ${sideName} child reference after recursively processing the ${sideName} subtree.`,
      stateChips: [{ label: `${rootVar}.${sideName}`, value: `${funcName}()`, highlight: true }],
      tip: `BST recursively descends ${sideName === 'left' ? 'left for smaller values' : 'right for larger values'} and reconstructs child pointers on return.`,
    };
  }

  // BST: Inorder Successor Replacement: root.val = successor.val;
  const bstSuccessorAssignMatch = rawLine.match(/([a-zA-Z_]\w*)\.val\s*=\s*([a-zA-Z_]\w*)\.val\s*;/i);
  if (bstSuccessorAssignMatch) {
    const [, targetNode, succNode] = bstSuccessorAssignMatch;
    return {
      category: 'BST Successor Replacement',
      what: `Replacing ${targetNode}.val with ${succNode}.val (Inorder Successor).`,
      why: 'Preserves the Binary Search Tree invariant when deleting a node with two children.',
      stateChips: [{ label: `${targetNode}.val`, value: `${succNode}.val`, highlight: true }],
      tip: 'The inorder successor is the smallest value in the right subtree; it is greater than all left descendants and smaller than all remaining right descendants.',
    };
  }

  // BST: Traversal Recursive Calls: inorder(root.left); / preorder(...) / postorder(...)
  const bstTraversalCallMatch = rawLine.match(/(inorder|preorder|postorder)\s*\(\s*([a-zA-Z_]\w*)\.(left|right)\s*\)\s*;/i);
  if (bstTraversalCallMatch) {
    const [, travType, nodeVar, childSide] = bstTraversalCallMatch;
    const travName = travType.toLowerCase();
    const orderDesc = travName === 'inorder' ? 'Left \u2192 Root \u2192 Right' : (travName === 'preorder' ? 'Root \u2192 Left \u2192 Right' : 'Left \u2192 Right \u2192 Root');
    return {
      category: `${travName.charAt(0).toUpperCase() + travName.slice(1)} Traversal (${childSide})`,
      what: `Recursively invoking ${travName}() on ${nodeVar}.${childSide} child.`,
      why: `Visits the ${childSide} subtree in ${travName} order (${orderDesc}).`,
      stateChips: [{ label: 'Traversal', value: travName, highlight: true }, { label: 'Branch', value: childSide }],
      tip: travName === 'inorder' ? 'Inorder traversal of a BST visits nodes in strictly ascending sorted order.' : 'Tree traversals visit each of the n nodes exactly once in O(n) total time.',
    };
  }


  // 15. Pointer Decrement for Insertion Sort: j--; or j = j - 1;
  if (/^j\s*(--|\s*=\s*j\s*-\s*1)\s*;/.test(rawLine)) {
    const jVal = variables['j']?.value;
    const chips = [];
    if (jVal !== undefined) chips.push({ label: 'j', value: `${jVal} → ${jVal - 1}`, highlight: true });
    return {
      category: 'Pointer Decrement',
      what: `Decrementing index j from ${jVal ?? 'current'} to ${jVal !== undefined ? jVal - 1 : 'j - 1'}.`,
      why: 'Moves leftward to examine the next preceding element in the sorted prefix.',
      stateChips: chips,
      tip: 'The pointer j steps backward toward index 0 until finding the position where key belongs.',
    };
  }

  // 16. Variable assignment / update: i++, x = y + 1
  const varUpdateMatch = rawLine.match(/^([a-zA-Z_]\w*)\s*(\+\+|--|\+=|-=|\*=|\/=|=(?!=))\s*([^;]*);?/);
  if (varUpdateMatch) {
    const [, varName, op, expr] = varUpdateMatch;
    const curVal = variables[varName]?.value;
    const chips = [{ label: varName, value: curVal !== undefined ? String(curVal) : 'Updating', highlight: true }];
    return {
      category: 'Variable Update',
      what: `Updating variable '${varName}' (${op} ${expr || ''}).`,
      why: 'Modifies the variable value to reflect recent computations or loop advancement.',
      stateChips: chips,
      tip: 'Variable updates advance the state of calculations and loop counters.',
    };
  }

  // 15. Console print statements: System.out.println(...);
  const printMatch = rawLine.match(/^System\.out\.(println|print)\s*\((.*)\);/);
  if (printMatch) {
    const [, printType, printArg] = printMatch;
    return {
      category: 'Console Output',
      what: `Printing to standard output (${printType}): ${printArg || 'empty line'}.`,
      why: 'Sends text to the output console for user or test verification.',
      stateChips: buildVariableChips(variables),
      tip: 'System.out.println adds a newline at the end, while System.out.print does not.',
    };
  }

  // Loop Break (Early Termination)
  if (/^break\s*;/.test(rawLine)) {
    return {
      category: 'Loop Break (Early Termination)',
      what: 'Executing break statement to exit the search loop immediately.',
      why: 'Target has already been found! Scanning remaining elements is unnecessary.',
      stateChips: buildVariableChips(variables),
      tip: 'Terminating early upon finding the first match avoids inspecting subsequent elements.',
    };
  }

  // 16. Return statement: return val;
  if (/^return\b/.test(rawLine)) {
    return {
      category: 'Method Return',
      what: `Executing return statement: ${rawLine}.`,
      why: 'Exits the current method and returns control (and optional value) to caller.',
      stateChips: buildVariableChips(variables),
      tip: 'Once a return statement executes, remaining statements in the method are skipped.',
    };
  }

  // 17. Generic fallback for arbitrary student code
  return {
    category: 'Execution Step',
    what: rawLine ? `Executing: ${rawLine}` : 'Executing next instruction in source file.',
    why: 'Advances the program instruction pointer to execute the statement.',
    stateChips: buildVariableChips(variables),
    tip: 'Observe how variable values evolve as execution steps through each line.',
  };
}

// ---------------------------------------------------------------------------
// State Change Detection (diffing previous step and current step)
// ---------------------------------------------------------------------------

function detectStateChange(prevStep, currentStep) {
  if (!prevStep || !currentStep) return null;

  const changes = [];

  // Check array mutations
  const currArrays = currentStep.arrays || {};
  const prevArrays = prevStep.arrays || {};

  for (const arrName of Object.keys(currArrays)) {
    const currArr = currArrays[arrName];
    const prevArr = prevArrays[arrName];
    if (currArr && prevArr && Array.isArray(currArr.values) && Array.isArray(prevArr.values)) {
      for (let i = 0; i < currArr.values.length; i++) {
        if (currArr.values[i] !== prevArr.values[i]) {
          changes.push(`${arrName}[${i}] changed from ${prevArr.values[i]} to ${currArr.values[i]}`);
        }
      }
    }
  }

  // Check variable updates
  const currVars = currentStep.variables || {};
  const prevVars = prevStep.variables || {};

  for (const varName of Object.keys(currVars)) {
    const currVal = currVars[varName]?.value;
    const prevVal = prevVars[varName]?.value;
    if (prevVal !== undefined && currVal !== undefined && prevVal !== currVal) {
      changes.push(`${varName}: ${prevVal} → ${currVal}`);
    }
  }

  return changes.length > 0 ? changes.join(' | ') : null;
}

// ---------------------------------------------------------------------------
// Helper Utilities
// ---------------------------------------------------------------------------

function resolveIndexExpression(exprStr, variables) {
  const trimmed = exprStr.trim();
  // Simple integer literal: 0, 1, 2...
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  // Single variable: j, i, k...
  if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
    const varData = variables[trimmed];
    return (varData && typeof varData.value === 'number') ? varData.value : null;
  }
  // Variable + offset: j + 1, i - 1...
  const offsetMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*([+-])\s*(\d+)$/);
  if (offsetMatch) {
    const [, varName, op, offsetStr] = offsetMatch;
    const varData = variables[varName];
    if (varData && typeof varData.value === 'number') {
      const offset = parseInt(offsetStr, 10);
      return op === '+' ? varData.value + offset : varData.value - offset;
    }
  }
  return null;
}

function getArrayElement(arrays, arrName, idx) {
  if (idx === null || idx === undefined || !arrays[arrName]) return null;
  const values = arrays[arrName].values;
  if (!Array.isArray(values) || idx < 0 || idx >= values.length) return null;
  return values[idx];
}

function evaluateComparison(val1, op, val2) {
  switch (op) {
    case '>': return val1 > val2;
    case '<': return val1 < val2;
    case '>=': return val1 >= val2;
    case '<=': return val1 <= val2;
    case '==': return val1 === val2;
    case '!=': return val1 !== val2;
    default: return null;
  }
}

function buildVariableChips(variables, preferred = []) {
  const chips = [];
  const entries = Object.entries(variables);

  // Add preferred first
  for (const name of preferred) {
    if (variables[name] && variables[name].value !== undefined) {
      chips.push({ label: name, value: String(variables[name].value), highlight: true });
    }
  }

  // Add others up to limit
  for (const [name, data] of entries) {
    if (!preferred.includes(name) && data && data.value !== undefined && chips.length < 5) {
      chips.push({ label: name, value: String(data.value) });
    }
  }

  return chips;
}

function createEmptyExplanation() {
  return {
    stepNumber: 0,
    lineNumber: 0,
    lineCode: '// No active execution step',
    category: 'Inactive',
    what: 'Execute Java code or load a demo trace to see step-by-step explanations.',
    why: 'Each step reflects the exact program state immediately before the line runs.',
    stateChips: [],
    stateChange: null,
    tip: null,
  };
}
