// =====================================================
// ALGOLAB - visualizer.js
//
// This file is split into TWO clearly separated parts:
//
//   PART 1: ALGORITHM LOGIC  (pure functions, no DOM code)
//   PART 2: UI CONTROLLER    (all document/DOM handling)
//
// The algorithm logic never touches the page directly.
// It only receives an array and returns data. This makes
// it easy to test the logic on its own, or reuse it later.
// =====================================================


/* =====================================================
   PART 1: ALGORITHM LOGIC
   ===================================================== */

/**
 * Runs REAL Bubble Sort on a copy of the given array and
 * records every single step along the way.
 *
 * Each "step" is a snapshot describing what the array looks
 * like at that moment, which two indices are being compared,
 * whether a swap just happened, and a human-readable message.
 *
 * @param {number[]} inputArray - the array to sort
 * @returns {Array<Object>} list of step objects
 */
function generateBubbleSortSteps(inputArray) {
  if (!inputArray || inputArray.length === 0) {
    return [{
      array: [],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      message: "Array is empty."
    }];
  }

  // Work on a copy so we never mutate the array the caller passed in
  const array = [...inputArray];
  const steps = [];
  const n = array.length;

  // Record the very first state before any comparisons happen
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Starting Bubble Sort with the initial array."
  });

  if (n === 1) {
    steps.push({
      array: [...array],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      message: "Array with 1 element is already sorted."
    });
    return steps;
  }

  // Standard Bubble Sort: repeatedly compare neighbors and swap if needed
  for (let i = 0; i < n - 1; i++) {
    let swappedInThisPass = false;

    for (let j = 0; j < n - i - 1; j++) {
      // Step: we are about to compare array[j] and array[j+1]
      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        swapped: false,
        minIndex: null,
        keyIndex: null,
        message: `Comparing index ${j} (${array[j]}) and index ${j + 1} (${array[j + 1]}).`
      });

      if (array[j] > array[j + 1]) {
        // Swap the two elements because they are in the wrong order
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swappedInThisPass = true;

        // Step: record the swap that just happened
        steps.push({
          array: [...array],
          comparing: [j, j + 1],
          swapped: true,
          minIndex: null,
          keyIndex: null,
          message: `Swapped index ${j} and index ${j + 1} because ${array[j + 1]} > ${array[j]}.`
        });
      }
    }

    // Optimization note: if nothing was swapped in a full pass,
    // the array is already sorted and we can stop early.
    if (!swappedInThisPass) {
      break;
    }
  }

  // Final step: the array is fully sorted
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Array is fully sorted!"
  });

  return steps;
}

/**
 * Runs REAL Selection Sort on a copy of the given array and
 * records every step along the way.
 *
 * Requirements:
 * - Tracks the minimum index during each pass.
 * - Highlights current comparison and minimum candidate distinctly.
 * - Shows the swap at the end of a pass when necessary.
 * - Does not modify the input array.
 * - Handles empty, single-element, duplicate, sorted, and reverse-sorted arrays.
 *
 * @param {number[]} inputArray - the array to sort
 * @returns {Array<Object>} list of step objects
 */
function generateSelectionSortSteps(inputArray) {
  if (!inputArray || inputArray.length === 0) {
    return [{
      array: [],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      message: "Array is empty."
    }];
  }

  const array = [...inputArray];
  const steps = [];
  const n = array.length;

  // Record initial state
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Starting Selection Sort with the initial array."
  });

  if (n === 1) {
    steps.push({
      array: [...array],
      comparing: [],
      swapped: false,
      minIndex: 0,
      keyIndex: null,
      message: "Array with 1 element is already sorted."
    });
    return steps;
  }

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // Step: initialize minimum candidate for this pass
    steps.push({
      array: [...array],
      comparing: [i],
      swapped: false,
      minIndex: minIdx,
      keyIndex: null,
      message: `Pass ${i + 1}: Assuming initial minimum is index ${i} (value ${array[i]}).`
    });

    for (let j = i + 1; j < n; j++) {
      // Step: compare candidate arr[j] with current minimum arr[minIdx]
      steps.push({
        array: [...array],
        comparing: [j, minIdx],
        swapped: false,
        minIndex: minIdx,
        keyIndex: null,
        message: `Comparing candidate at index ${j} (${array[j]}) with current minimum at index ${minIdx} (${array[minIdx]}).`
      });

      if (array[j] < array[minIdx]) {
        minIdx = j;
        // Step: new minimum index found
        steps.push({
          array: [...array],
          comparing: [j],
          swapped: false,
          minIndex: minIdx,
          keyIndex: null,
          message: `Found smaller element at index ${j} (${array[j]}). Updated minimum index to ${minIdx}.`
        });
      }
    }

    if (minIdx !== i) {
      // Swap elements array[i] and array[minIdx]
      const temp = array[i];
      array[i] = array[minIdx];
      array[minIdx] = temp;

      // Step: record the swap
      steps.push({
        array: [...array],
        comparing: [i, minIdx],
        swapped: true,
        minIndex: minIdx,
        keyIndex: null,
        message: `Swapped index ${i} (${array[minIdx]}) and minimum index ${minIdx} (${array[i]}) to place smallest item in sorted prefix.`
      });
    } else {
      steps.push({
        array: [...array],
        comparing: [i],
        swapped: false,
        minIndex: minIdx,
        keyIndex: null,
        message: `Minimum element (${array[i]}) is already at index ${i}. No swap needed.`
      });
    }
  }

  // Final step: fully sorted
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Array is fully sorted!"
  });

  return steps;
}

/**
 * Runs REAL Insertion Sort on a copy of the given array and
 * records every single step along the way.
 *
 * Requirements:
 * - Operates on a cloned array, preserving caller input.
 * - Tracks the current key and index j.
 * - Compares preceding elements with the key.
 * - Shifts larger elements one position to the right.
 * - Inserts the key into its correct position.
 * - Supports negative numbers and mixed positive/negative values.
 * - Produces step snapshots compatible with the visualizer renderer.
 *
 * @param {number[]} inputArray - the array to sort
 * @returns {Array<Object>} list of step objects
 */
function generateInsertionSortSteps(inputArray) {
  if (!inputArray || inputArray.length === 0) {
    return [{
      array: [],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      message: "Array is empty."
    }];
  }

  const array = [...inputArray];
  const steps = [];
  const n = array.length;

  // Record initial state
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Starting Insertion Sort with the initial array."
  });

  if (n === 1) {
    steps.push({
      array: [...array],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: 0,
      message: "Array with 1 element is already sorted."
    });
    return steps;
  }

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    // Step: Pick key element
    steps.push({
      array: [...array],
      comparing: [i],
      swapped: false,
      minIndex: null,
      keyIndex: i,
      message: `Pass ${i}: Extracted key = ${key} at index ${i}. Sorted prefix spans indices 0 to ${i - 1}.`
    });

    let shiftedAny = false;

    // Shift elements of array[0..i-1] that are greater than key rightward
    while (j >= 0) {
      // Step: compare array[j] with key
      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        swapped: false,
        minIndex: null,
        keyIndex: j + 1,
        message: `Comparing preceding element array[${j}] (${array[j]}) with key (${key}).`
      });

      if (array[j] > key) {
        // Shift element rightward
        array[j + 1] = array[j];
        shiftedAny = true;

        steps.push({
          array: [...array],
          comparing: [j, j + 1],
          swapped: true,
          minIndex: null,
          keyIndex: j,
          message: `Shifted element ${array[j]} rightward from index ${j} to ${j + 1} because ${array[j]} > ${key}.`
        });

        j--;
      } else {
        steps.push({
          array: [...array],
          comparing: [j],
          swapped: false,
          minIndex: null,
          keyIndex: j + 1,
          message: `Element array[${j}] (${array[j]}) <= key (${key}). Found insertion slot at index ${j + 1}.`
        });
        break;
      }
    }

    // Place key into its sorted slot
    array[j + 1] = key;

    steps.push({
      array: [...array],
      comparing: [j + 1],
      swapped: shiftedAny,
      minIndex: null,
      keyIndex: j + 1,
      message: `Inserted key (${key}) into its sorted position at index ${j + 1}. Prefix 0 to ${i} is now sorted.`
    });
  }

  // Final step: fully sorted
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    message: "Array is fully sorted!"
  });

  return steps;
}

/**
 * Runs REAL Linear Search on a copy of the given array searching
 * for the target value, recording every comparison step.
 *
 * Requirements:
 * - Operates on a cloned array, preserving caller input.
 * - Inspects elements sequentially from index 0.
 * - Compares current element array[i] with target.
 * - Stops searching on first matching element and indicates foundIndex.
 * - If no match exists, finishes with an accurate not-found state.
 * - Supports empty, single-element, duplicate, negative, and mixed values.
 * - Produces step snapshots compatible with the visualizer renderer.
 *
 * @param {number[]} inputArray - the array to search
 * @param {number} target - the value to find
 * @returns {Array<Object>} list of step objects
 */
function generateLinearSearchSteps(inputArray, target) {
  const numTarget = (target !== undefined && target !== null && !isNaN(Number(target)))
    ? Number(target)
    : 42;

  if (!inputArray || inputArray.length === 0) {
    return [{
      array: [],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      foundIndex: null,
      target: numTarget,
      message: `Array is empty. Target ${numTarget} not found.`
    }];
  }

  const array = [...inputArray];
  const steps = [];
  const n = array.length;

  // Record initial state
  steps.push({
    array: [...array],
    comparing: [],
    swapped: false,
    minIndex: null,
    keyIndex: null,
    foundIndex: null,
    target: numTarget,
    message: `Starting Linear Search for target ${numTarget} across ${n} element${n === 1 ? '' : 's'}.`
  });

  let matchIdx = -1;

  for (let i = 0; i < n; i++) {
    const currentVal = array[i];
    const isMatch = currentVal === numTarget;

    if (isMatch) {
      matchIdx = i;
      steps.push({
        array: [...array],
        comparing: [i],
        swapped: false,
        minIndex: null,
        keyIndex: null,
        foundIndex: i,
        target: numTarget,
        message: `Inspecting index ${i} (value ${currentVal}) == target ${numTarget} → MATCH FOUND at index ${i}!`
      });
      break;
    } else {
      steps.push({
        array: [...array],
        comparing: [i],
        swapped: false,
        minIndex: null,
        keyIndex: null,
        foundIndex: null,
        target: numTarget,
        message: `Inspecting index ${i} (value ${currentVal}) != target ${numTarget} → No match. Continuing to index ${i + 1}.`
      });
    }
  }

  // Final step
  if (matchIdx !== -1) {
    steps.push({
      array: [...array],
      comparing: [matchIdx],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      foundIndex: matchIdx,
      target: numTarget,
      message: `Search complete! Target ${numTarget} found at index ${matchIdx}.`
    });
  } else {
    steps.push({
      array: [...array],
      comparing: [],
      swapped: false,
      minIndex: null,
      keyIndex: null,
      foundIndex: null,
      target: numTarget,
      message: `Search complete. Target ${numTarget} not found in array.`
    });
  }

  return steps;
}

/**
 * Runs REAL Binary Search on a copy of the given array searching
 * for the target value, recording every comparison and interval adjustment.
 *
 * Requirements:
 * - Operates on a cloned array, preserving caller input.
 * - Requires a sorted array; sorts working copy and clearly notifies student if unsorted.
 * - Tracks low, mid, and high pointers and highlights the active interval.
 * - Compares array[mid] with target:
 *     - If equal, reports match and terminates.
 *     - If array[mid] < target, discards left half and updates low = mid + 1.
 *     - If array[mid] > target, discards right half and updates high = mid - 1.
 * - Stops when target is found or low > high.
 * - Supports empty, single-element, duplicate, negative, and mixed values.
 * - Produces step snapshots compatible with visualizer renderer.
 *
 * @param {number[]} inputArray - the array to search
 * @param {number} target - the value to find
 * @returns {Array<Object>} list of step objects
 */
function generateBinarySearchSteps(inputArray, target) {
  const numTarget = (target !== undefined && target !== null && !isNaN(Number(target)))
    ? Number(target)
    : 42;

  if (!inputArray || inputArray.length === 0) {
    return [{
      array: [],
      comparing: [],
      low: null,
      mid: null,
      high: null,
      foundIndex: null,
      target: numTarget,
      swapped: false,
      message: `Array is empty. Target ${numTarget} not found.`
    }];
  }

  // Preserve caller input by making a clone
  const isInitiallySorted = inputArray.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
  const array = [...inputArray].sort((a, b) => a - b);
  const steps = [];
  const n = array.length;

  // Initial step: explain sorted requirement and display initial interval
  if (!isInitiallySorted) {
    steps.push({
      array: [...array],
      comparing: [],
      low: 0,
      mid: null,
      high: n - 1,
      foundIndex: null,
      target: numTarget,
      swapped: false,
      message: `Binary Search requires a sorted array. The input was automatically sorted before searching: [${array.join(", ")}]. Initial search interval: [low=0, high=${n - 1}].`
    });
  } else {
    steps.push({
      array: [...array],
      comparing: [],
      low: 0,
      mid: null,
      high: n - 1,
      foundIndex: null,
      target: numTarget,
      swapped: false,
      message: `Starting Binary Search for target ${numTarget} in sorted array of ${n} element${n === 1 ? '' : 's'}. Initial search interval: [low=0, high=${n - 1}].`
    });
  }

  let low = 0;
  let high = n - 1;
  let matchIdx = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const midVal = array[mid];

    // Step: examine midpoint
    steps.push({
      array: [...array],
      comparing: [mid],
      low,
      mid,
      high,
      foundIndex: null,
      target: numTarget,
      swapped: false,
      message: `Active interval [low=${low}, high=${high}]. Midpoint calculated: mid = ${low} + (${high} - ${low}) / 2 = ${mid} (value ${midVal}).`
    });

    if (midVal === numTarget) {
      matchIdx = mid;
      steps.push({
        array: [...array],
        comparing: [mid],
        low,
        mid,
        high,
        foundIndex: mid,
        target: numTarget,
        swapped: false,
        message: `Comparing array[mid=${mid}] (${midVal}) == target (${numTarget}) → MATCH FOUND at index ${mid}!`
      });
      break;
    } else if (midVal < numTarget) {
      steps.push({
        array: [...array],
        comparing: [mid],
        low,
        mid,
        high,
        foundIndex: null,
        target: numTarget,
        swapped: false,
        message: `Comparing array[mid=${mid}] (${midVal}) < target (${numTarget}) → Target must lie in right half. Updating low = mid + 1 (${mid + 1}).`
      });
      low = mid + 1;
    } else {
      steps.push({
        array: [...array],
        comparing: [mid],
        low,
        mid,
        high,
        foundIndex: null,
        target: numTarget,
        swapped: false,
        message: `Comparing array[mid=${mid}] (${midVal}) > target (${numTarget}) → Target must lie in left half. Updating high = mid - 1 (${mid - 1}).`
      });
      high = mid - 1;
    }
  }

  // Final terminal step
  if (matchIdx !== -1) {
    steps.push({
      array: [...array],
      comparing: [matchIdx],
      low,
      mid: matchIdx,
      high,
      foundIndex: matchIdx,
      target: numTarget,
      swapped: false,
      message: `Search complete! Target ${numTarget} located at index ${matchIdx}.`
    });
  } else {
    steps.push({
      array: [...array],
      comparing: [],
      low,
      mid: null,
      high,
      foundIndex: null,
      target: numTarget,
      swapped: false,
      message: `Search complete. Interval empty (low=${low} > high=${high}). Target ${numTarget} not found in array.`
    });
  }

  return steps;
}

/**
 * Creates a random array of the given size with values
 * between 5 and 100 (inclusive), used to feed the visualizer.
 *
 * @param {number} size - how many elements the array should have
 * @returns {number[]}
 */
function generateRandomArray(size) {
  const array = [];
  for (let i = 0; i < size; i++) {
    const randomValue = Math.floor(Math.random() * 96) + 5; // 5 - 100
    array.push(randomValue);
  }
  return array;
}


/* =====================================================
   PART 2: UI CONTROLLER
   Everything below this point deals with the DOM:
   drawing bars, wiring up buttons, and handling playback.
   ===================================================== */

// State variables for the visualizer
let currentArray = [];      // the array currently generated by the user
let steps = [];             // all steps produced by active algorithm
let currentStepIndex = 0;   // which step we are currently showing
let isPlaying = false;      // whether auto-play is active
let playIntervalId = null;  // handle for the setInterval used by Play

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {

    const arrayContainer = document.getElementById("array-container");
    if (!arrayContainer) {
      return; // Not on the visualizer page
    }

    const algorithmSelect = document.getElementById("algorithm-select");
    const targetControlGroup = document.getElementById("target-control-group");
    const targetInput = document.getElementById("target-input");
    const sizeInput = document.getElementById("array-size-input");
    const generateBtn = document.getElementById("generate-btn");
    const playBtn = document.getElementById("play-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const nextBtn = document.getElementById("next-btn");
    const resetBtn = document.getElementById("reset-btn");
    const speedRange = document.getElementById("speed-range");

    const visualizerTitleEl = document.getElementById("visualizer-title");
    const visualizerDescEl = document.getElementById("visualizer-desc");
    const stepMessageEl = document.getElementById("step-message");
    const currentStepValueEl = document.getElementById("current-step-value");
    const comparisonsValueEl = document.getElementById("comparisons-value");
    const swapsValueEl = document.getElementById("swaps-value");
    const statusValueEl = document.getElementById("status-value");
    const algoExplanationTextEl = document.getElementById("algo-explanation-text");
    const complexityTbodyEl = document.getElementById("complexity-tbody");

    function getSelectedAlgorithm() {
      return algorithmSelect ? algorithmSelect.value : "bubble-sort";
    }

    function updateAlgorithmInfo() {
      const algo = getSelectedAlgorithm();
      if (algo === "binary-search") {
        if (targetControlGroup) targetControlGroup.style.display = "flex";
        if (visualizerTitleEl) {
          visualizerTitleEl.innerHTML = 'Binary Search <span class="highlight">Visualizer</span>';
        }
        if (visualizerDescEl) {
          visualizerDescEl.textContent = 'Divide and conquer a sorted array by calculating midpoints and halving the search space.';
        }
        if (algoExplanationTextEl) {
          algoExplanationTextEl.textContent =
            'Binary Search operates on a sorted array by repeatedly dividing the search space in half. ' +
            'It calculates the midpoint index mid = low + (high - low) / 2. If arr[mid] equals the target, search succeeds. ' +
            'If the target is greater, the left half is discarded (low = mid + 1). If the target is smaller, the right half ' +
            'is discarded (high = mid - 1). This yields logarithmic O(log n) search time. ' +
            'Note: if the array is unsorted, it must be sorted first, which takes O(n log n).';
        }
        if (complexityTbodyEl) {
          complexityTbodyEl.innerHTML = `
            <tr><td>Best Case</td><td>O(1) &mdash; target at initial midpoint</td></tr>
            <tr><td>Average Case</td><td>O(log n)</td></tr>
            <tr><td>Worst Case</td><td>O(log n) &mdash; target absent or at interval edge</td></tr>
            <tr><th colspan="2">Space Complexity</th></tr>
            <tr><td colspan="2">O(1) &mdash; auxiliary space (iterative)</td></tr>
            <tr><th colspan="2">Input Precondition</th></tr>
            <tr><td colspan="2">Requires sorted array (separate O(n log n) cost if unsorted)</td></tr>
          `;
        }
      } else if (algo === "linear-search") {
        if (targetControlGroup) targetControlGroup.style.display = "flex";
        if (visualizerTitleEl) {
          visualizerTitleEl.innerHTML = 'Linear Search <span class="highlight">Visualizer</span>';
        }
        if (visualizerDescEl) {
          visualizerDescEl.textContent = 'Sequentially scan elements from left to right until the target value is found or array ends.';
        }
        if (algoExplanationTextEl) {
          algoExplanationTextEl.textContent =
            'Linear Search sequentially checks each element of the array from index 0 onward. If an element equals the target value, ' +
            'the search terminates immediately and reports the index. If the end of the array is reached without a match, ' +
            'the algorithm reports that the target is absent.';
        }
        if (complexityTbodyEl) {
          complexityTbodyEl.innerHTML = `
            <tr><td>Best Case</td><td>O(1) &mdash; target at index 0</td></tr>
            <tr><td>Average Case</td><td>O(n)</td></tr>
            <tr><td>Worst Case</td><td>O(n) &mdash; target at end or absent</td></tr>
            <tr><th colspan="2">Space Complexity</th></tr>
            <tr><td colspan="2">O(1) &mdash; auxiliary space</td></tr>
          `;
        }
      } else if (algo === "insertion-sort") {
        if (targetControlGroup) targetControlGroup.style.display = "none";
        if (visualizerTitleEl) {
          visualizerTitleEl.innerHTML = 'Insertion Sort <span class="highlight">Visualizer</span>';
        }
        if (visualizerDescEl) {
          visualizerDescEl.textContent = 'Extract each element as a key and shift larger preceding elements rightward to insert it into place.';
        }
        if (algoExplanationTextEl) {
          algoExplanationTextEl.textContent =
            'Insertion Sort builds the sorted array one element at a time. It iterates through the input elements and, ' +
            'for each element (the key), shifts all larger preceding elements one position to the right, then inserts the key ' +
            'into its correct sorted position in the prefix.';
        }
        if (complexityTbodyEl) {
          complexityTbodyEl.innerHTML = `
            <tr><td>Best Case</td><td>O(n)</td></tr>
            <tr><td>Average Case</td><td>O(n&sup2;)</td></tr>
            <tr><td>Worst Case</td><td>O(n&sup2;)</td></tr>
            <tr><th colspan="2">Space Complexity</th></tr>
            <tr><td colspan="2">O(1) &mdash; sorts in place</td></tr>
          `;
        }
      } else if (algo === "selection-sort") {
        if (targetControlGroup) targetControlGroup.style.display = "none";
        if (visualizerTitleEl) {
          visualizerTitleEl.innerHTML = 'Selection Sort <span class="highlight">Visualizer</span>';
        }
        if (visualizerDescEl) {
          visualizerDescEl.textContent = 'Track the minimum element in each pass and watch it swap into the sorted prefix.';
        }
        if (algoExplanationTextEl) {
          algoExplanationTextEl.textContent =
            'Selection Sort divides the array into a sorted prefix and an unsorted suffix. ' +
            'On each pass, it finds the smallest element in the unsorted suffix and swaps it with the ' +
            'first unsorted element, growing the sorted prefix by one position.';
        }
        if (complexityTbodyEl) {
          complexityTbodyEl.innerHTML = `
            <tr><td>Best Case</td><td>O(n&sup2;)</td></tr>
            <tr><td>Average Case</td><td>O(n&sup2;)</td></tr>
            <tr><td>Worst Case</td><td>O(n&sup2;)</td></tr>
            <tr><th colspan="2">Space Complexity</th></tr>
            <tr><td colspan="2">O(1) &mdash; sorts in place</td></tr>
          `;
        }
      } else {
        if (targetControlGroup) targetControlGroup.style.display = "none";
        if (visualizerTitleEl) {
          visualizerTitleEl.innerHTML = 'Bubble Sort <span class="highlight">Visualizer</span>';
        }
        if (visualizerDescEl) {
          visualizerDescEl.textContent = 'Generate a random array, then step through the real Bubble Sort algorithm.';
        }
        if (algoExplanationTextEl) {
          algoExplanationTextEl.textContent =
            'Bubble Sort repeatedly steps through the array, compares each pair of ' +
            'adjacent elements, and swaps them if they are in the wrong order. ' +
            'This process repeats until no swaps are needed, meaning the array is sorted. ' +
            'Larger elements "bubble" toward the end of the array on each pass.';
        }
        if (complexityTbodyEl) {
          complexityTbodyEl.innerHTML = `
            <tr><td>Best Case</td><td>O(n)</td></tr>
            <tr><td>Average Case</td><td>O(n&sup2;)</td></tr>
            <tr><td>Worst Case</td><td>O(n&sup2;)</td></tr>
            <tr><th colspan="2">Space Complexity</th></tr>
            <tr><td colspan="2">O(1) &mdash; sorts in place</td></tr>
          `;
        }
      }
    }

    function generateStepsForCurrentAlgorithm() {
      const algo = getSelectedAlgorithm();
      if (algo === "binary-search") {
        const rawTarget = targetInput ? targetInput.value : "42";
        const targetVal = (rawTarget !== "" && !isNaN(Number(rawTarget))) ? Number(rawTarget) : 42;
        return generateBinarySearchSteps(currentArray, targetVal);
      }
      if (algo === "linear-search") {
        const rawTarget = targetInput ? targetInput.value : "42";
        const targetVal = (rawTarget !== "" && !isNaN(Number(rawTarget))) ? Number(rawTarget) : 42;
        return generateLinearSearchSteps(currentArray, targetVal);
      }
      if (algo === "insertion-sort") {
        return generateInsertionSortSteps(currentArray);
      }
      if (algo === "selection-sort") {
        return generateSelectionSortSteps(currentArray);
      }
      return generateBubbleSortSteps(currentArray);
    }

    // ---- Rendering: draw the array as bars ----
    function renderStep(stepIndex) {
      const step = steps[stepIndex];
      if (!step) return;

      arrayContainer.innerHTML = "";

      // Safe normalization supporting negative values and mixed positive/negative arrays
      const minVal = step.array.length > 0 ? Math.min(0, ...step.array) : 0;
      const maxVal = step.array.length > 0 ? Math.max(1, ...step.array) : 1;
      const range = maxVal - minVal || 1;

      step.array.forEach(function (value, index) {
        const bar = document.createElement("div");
        bar.className = "array-bar";

        // Scale height between 30px and 260px based on value range
        const heightPx = 30 + ((value - minVal) / range) * 230;
        bar.style.height = heightPx + "px";
        bar.style.width = Math.max(20, 100 / step.array.length) + "px";

        const isOutOfRange = (typeof step.low === 'number' && typeof step.high === 'number') &&
                             (index < step.low || index > step.high);
        const isBoundary = (typeof step.low === 'number' && index === step.low) ||
                           (typeof step.high === 'number' && index === step.high);

        // Highlight distinct roles: found target, midpoint, swapped/shifted, key, minimum candidate, or currently comparing
        if (typeof step.foundIndex === 'number' && step.foundIndex === index) {
          bar.classList.add("found");
        } else if (typeof step.mid === 'number' && step.mid === index) {
          bar.classList.add("mid");
        } else if (step.swapped && step.comparing && step.comparing.includes(index)) {
          bar.classList.add("swapped");
        } else if (typeof step.keyIndex === 'number' && step.keyIndex === index) {
          bar.classList.add("key");
        } else if (typeof step.minIndex === 'number' && step.minIndex === index) {
          bar.classList.add("minimum");
        } else if (step.comparing && step.comparing.includes(index)) {
          bar.classList.add(step.swapped ? "swapped" : "comparing");
        }

        if (isOutOfRange && typeof step.foundIndex !== 'number') {
          bar.classList.add("out-of-range");
        } else if (isBoundary && typeof step.foundIndex !== 'number' && typeof step.mid !== 'number') {
          bar.classList.add("boundary");
        }

        // Show the numeric value above the bar
        const label = document.createElement("span");
        label.textContent = value;
        bar.appendChild(label);

        arrayContainer.appendChild(bar);
      });

      stepMessageEl.textContent = step.message;
      currentStepValueEl.textContent = `${stepIndex} / ${Math.max(0, steps.length - 1)}`;

      // Count comparisons and swaps/shifts up to this step
      let comparisons = 0;
      let swaps = 0;
      for (let i = 1; i <= stepIndex; i++) {
        if (steps[i].comparing && steps[i].comparing.length > 1 && !steps[i].swapped) comparisons++;
        if (steps[i].swapped) swaps++;
      }
      comparisonsValueEl.textContent = comparisons;
      swapsValueEl.textContent = swaps;

      if (stepIndex === steps.length - 1) {
        const isSearch = getSelectedAlgorithm() === "linear-search" || getSelectedAlgorithm() === "binary-search";
        statusValueEl.textContent = isSearch
          ? (typeof step.foundIndex === 'number' ? "Target Found" : "Not Found")
          : "Sorted";
        stopPlaying();
        playBtn.disabled = true;
        nextBtn.disabled = true;
      } else {
        statusValueEl.textContent = isPlaying ? "Playing" : "Paused";
        playBtn.disabled = isPlaying;
        nextBtn.disabled = false;
      }
    }

    // ---- Generate a brand new array and reset the visualizer ----
    function handleGenerateArray() {
      stopPlaying();

      let size = parseInt(sizeInput.value, 10);
      if (isNaN(size) || size < 4) size = 4;
      if (size > 30) size = 30;
      sizeInput.value = size;

      currentArray = generateRandomArray(size);
      steps = generateStepsForCurrentAlgorithm();
      currentStepIndex = 0;

      renderStep(currentStepIndex);

      playBtn.disabled = false;
      pauseBtn.disabled = false;
      nextBtn.disabled = false;
      resetBtn.disabled = false;
    }

    function handleAlgorithmChange() {
      stopPlaying();
      updateAlgorithmInfo();
      steps = generateStepsForCurrentAlgorithm();
      currentStepIndex = 0;
      renderStep(currentStepIndex);

      playBtn.disabled = false;
      pauseBtn.disabled = false;
      nextBtn.disabled = false;
      resetBtn.disabled = false;
    }

    // ---- Move forward exactly one step ----
    function handleNextStep() {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        renderStep(currentStepIndex);
      }
      if (currentStepIndex === steps.length - 1) {
        stopPlaying();
      }
    }

    // ---- Auto-play ----
    function startPlaying() {
      if (isPlaying || steps.length === 0) return;
      isPlaying = true;
      statusValueEl.textContent = "Playing";

      const rawValue = parseInt(speedRange.value, 10);
      const speed = (100 + 1500) - rawValue;
      playIntervalId = setInterval(function () {
        if (currentStepIndex >= steps.length - 1) {
          stopPlaying();
          return;
        }
        handleNextStep();
      }, speed);
    }

    function stopPlaying() {
      isPlaying = false;
      if (playIntervalId !== null) {
        clearInterval(playIntervalId);
        playIntervalId = null;
      }
    }

    function handleReset() {
      stopPlaying();
      currentStepIndex = 0;
      if (steps.length > 0) {
        renderStep(currentStepIndex);
      }
    }

    // Wire event listeners
    generateBtn.addEventListener("click", handleGenerateArray);
    if (algorithmSelect) {
      algorithmSelect.addEventListener("change", handleAlgorithmChange);
    }
    playBtn.addEventListener("click", startPlaying);
    pauseBtn.addEventListener("click", stopPlaying);
    nextBtn.addEventListener("click", handleNextStep);
    resetBtn.addEventListener("click", handleReset);

    speedRange.addEventListener("input", function () {
      if (isPlaying) {
        stopPlaying();
        startPlaying();
      }
    });

    if (targetInput) {
      targetInput.addEventListener("input", function () {
        const currentAlgo = getSelectedAlgorithm();
        if (currentAlgo === "linear-search" || currentAlgo === "binary-search") {
          stopPlaying();
          steps = generateStepsForCurrentAlgorithm();
          currentStepIndex = 0;
          renderStep(currentStepIndex);
        }
      });
    }

    // Check URL parameters (e.g. visualizer.html?algo=binary-search)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const algoParam = urlParams.get("algo");
      if (algoParam && (algoParam === "selection-sort" || algoParam === "insertion-sort" || algoParam === "bubble-sort" || algoParam === "linear-search" || algoParam === "binary-search")) {
        if (algorithmSelect) {
          algorithmSelect.value = algoParam;
        }
      }
      const targetParam = urlParams.get("target");
      if (targetParam && targetInput) {
        targetInput.value = targetParam;
      }
    } catch (_) {
      // URLSearchParams fallback
    }

    updateAlgorithmInfo();
    handleGenerateArray();
  });
}

// Export functions for ES Module consumers and Node.js testing
export {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateLinearSearchSteps,
  generateBinarySearchSteps,
  generateRandomArray
};

// Global fallback for scripts
if (typeof window !== "undefined") {
  window.generateBubbleSortSteps = generateBubbleSortSteps;
  window.generateSelectionSortSteps = generateSelectionSortSteps;
  window.generateInsertionSortSteps = generateInsertionSortSteps;
  window.generateLinearSearchSteps = generateLinearSearchSteps;
  window.generateBinarySearchSteps = generateBinarySearchSteps;
  window.generateRandomArray = generateRandomArray;
}
