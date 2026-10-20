// =============================================================================
// ALGOLAB — Practice Arena Problem Catalog (Phase 14)
//
// Authoritative problem definitions for automated Java evaluation.
// Defines 5 foundational DSA problems with descriptions, constraints,
// Java starter code, visible sample test cases, and secret hidden test cases.
//
// SECURITY INVARIANT:
// - Hidden test cases are NEVER exposed through public API endpoints.
// - Client cannot supply, override, or modify authoritative test cases.
// =============================================================================

export const PROBLEMS = Object.freeze({
  'reverse-array': {
    id: 'reverse-array',
    title: 'Reverse an Array',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array of integers, reverse the array in-place or print the elements in reverse order separated by spaces.',
    constraints: [
      '1 <= N <= 1000 (Number of elements)',
      '-10^5 <= arr[i] <= 10^5'
    ],
    inputFormat:
      'Line 1: An integer N representing the size of the array.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the N reversed elements on a single line separated by space.',
    sampleCases: [
      {
        id: 1,
        input: '5\n1 2 3 4 5',
        expectedOutput: '5 4 3 2 1',
        explanation: 'The reverse of [1, 2, 3, 4, 5] is [5, 4, 3, 2, 1].'
      },
      {
        id: 2,
        input: '3\n10 20 30',
        expectedOutput: '30 20 10',
        explanation: 'The reverse of [10, 20, 30] is [30, 20, 10].'
      }
    ],
    hiddenCases: [
      {
        id: 3,
        input: '1\n42',
        expectedOutput: '42'
      },
      {
        id: 4,
        input: '4\n-5 0 8 -2',
        expectedOutput: '-2 8 0 -5'
      },
      {
        id: 5,
        input: '6\n7 7 1 7 2 3',
        expectedOutput: '3 2 7 1 7 7'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Print the reversed array elements separated by spaces

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },

  'find-largest': {
    id: 'find-largest',
    title: 'Find Largest Element',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array of integers, find and print the maximum element present in the array.',
    constraints: [
      '1 <= N <= 1000',
      '-10^6 <= arr[i] <= 10^6'
    ],
    inputFormat:
      'Line 1: An integer N representing the array size.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the single maximum integer value.',
    sampleCases: [
      {
        id: 1,
        input: '5\n3 9 1 7 4',
        expectedOutput: '9',
        explanation: '9 is the largest element among 3, 9, 1, 7, 4.'
      },
      {
        id: 2,
        input: '3\n15 8 15',
        expectedOutput: '15',
        explanation: '15 is the maximum value.'
      }
    ],
    hiddenCases: [
      {
        id: 3,
        input: '4\n-10 -3 -50 -2',
        expectedOutput: '-2'
      },
      {
        id: 4,
        input: '1\n999',
        expectedOutput: '999'
      },
      {
        id: 5,
        input: '5\n1 2 3 4 100',
        expectedOutput: '100'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Find and print the maximum value in arr

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },

  'linear-search': {
    id: 'linear-search',
    title: 'Linear Search',
    difficulty: 'Easy',
    topic: 'Searching',
    description:
      'Given an array of N integers and a target value K, find the 0-based index of the first occurrence of K. If K is not present in the array, print -1.',
    constraints: [
      '1 <= N <= 1000',
      '-10^5 <= arr[i], K <= 10^5'
    ],
    inputFormat:
      'Line 1: Two integers N and K.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the 0-based index of K, or -1 if K is absent.',
    sampleCases: [
      {
        id: 1,
        input: '5 7\n2 4 7 9 1',
        expectedOutput: '2',
        explanation: 'Value 7 is located at index 2.'
      },
      {
        id: 2,
        input: '4 10\n1 3 5 7',
        expectedOutput: '-1',
        explanation: 'Value 10 is not found in the array.'
      }
    ],
    hiddenCases: [
      {
        id: 3,
        input: '3 5\n5 8 9',
        expectedOutput: '0'
      },
      {
        id: 4,
        input: '4 8\n1 2 3 8',
        expectedOutput: '3'
      },
      {
        id: 5,
        input: '5 2\n1 2 2 3 2',
        expectedOutput: '1'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Scan sequentially to find target and print its first 0-based index or -1

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },

  'binary-search': {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    topic: 'Searching',
    description:
      'Given an array of N distinct integers sorted in ascending order and a target value K, find the 0-based index of K using binary search. If K does not exist, print -1.',
    constraints: [
      '1 <= N <= 1000',
      'Array elements are strictly ascending: arr[0] < arr[1] < ... < arr[N-1]',
      '-10^5 <= arr[i], K <= 10^5'
    ],
    inputFormat:
      'Line 1: Two integers N and K.\nLine 2: N space-separated integers in sorted order.',
    outputFormat:
      'Print the 0-based index of K, or -1 if not found.',
    sampleCases: [
      {
        id: 1,
        input: '6 12\n2 5 8 12 16 23',
        expectedOutput: '3',
        explanation: '12 is at index 3.'
      },
      {
        id: 2,
        input: '5 9\n1 3 5 7 11',
        expectedOutput: '-1',
        explanation: '9 is not present in the array.'
      }
    ],
    hiddenCases: [
      {
        id: 3,
        input: '3 5\n1 5 9',
        expectedOutput: '1'
      },
      {
        id: 4,
        input: '4 10\n10 20 30 40',
        expectedOutput: '0'
      },
      {
        id: 5,
        input: '5 50\n10 20 30 40 50',
        expectedOutput: '4'
      },
      {
        id: 6,
        input: '3 100\n1 2 3',
        expectedOutput: '-1'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Use binary search (low <= high) to find target in O(log N)

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  },

  'move-zeros': {
    id: 'move-zeros',
    title: 'Move Zeros to End',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    description:
      'Given an array of integers, move all 0s to the end of the array while maintaining the relative order of the non-zero elements. Print the resulting array.',
    constraints: [
      '1 <= N <= 1000',
      '-10^4 <= arr[i] <= 10^4'
    ],
    inputFormat:
      'Line 1: An integer N.\nLine 2: N space-separated integers.',
    outputFormat:
      'Print the transformed array elements separated by space.',
    sampleCases: [
      {
        id: 1,
        input: '5\n0 1 0 3 12',
        expectedOutput: '1 3 12 0 0',
        explanation: 'All zeros are shifted to the end; non-zero [1, 3, 12] retain their order.'
      },
      {
        id: 2,
        input: '3\n0 0 1',
        expectedOutput: '1 0 0',
        explanation: 'The non-zero 1 moves to the front, followed by two zeros.'
      }
    ],
    hiddenCases: [
      {
        id: 3,
        input: '4\n1 2 3 4',
        expectedOutput: '1 2 3 4'
      },
      {
        id: 4,
        input: '3\n0 0 0',
        expectedOutput: '0 0 0'
      },
      {
        id: 5,
        input: '4\n5 8 0 0',
        expectedOutput: '5 8 0 0'
      },
      {
        id: 6,
        input: '6\n0 4 0 7 0 9',
        expectedOutput: '4 7 9 0 0 0'
      }
    ],
    starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Write your solution here:
        // Shift all zeros to the end while preserving order of non-zeros

    }
}
`,
    timeLimitMs: 4000,
    memoryLimitMb: 256
  }
});

/**
 * Returns public problem catalog with hidden test cases completely stripped.
 */
export function getPublicProblemCatalog() {
  return Object.values(PROBLEMS).map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topic: p.topic,
    description: p.description,
    constraints: p.constraints,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    sampleCases: p.sampleCases,
    starterCode: p.starterCode,
    timeLimitMs: p.timeLimitMs,
    memoryLimitMb: p.memoryLimitMb
  }));
}

/**
 * Returns a specific public problem with hidden test cases stripped.
 */
export function getPublicProblemById(problemId) {
  const p = PROBLEMS[problemId];
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topic: p.topic,
    description: p.description,
    constraints: p.constraints,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    sampleCases: p.sampleCases,
    starterCode: p.starterCode,
    timeLimitMs: p.timeLimitMs,
    memoryLimitMb: p.memoryLimitMb
  };
}

/**
 * Returns the full authoritative problem definition including hidden test cases.
 * Used exclusively by the server-side judging engine.
 */
export function getAuthoritativeProblem(problemId) {
  return PROBLEMS[problemId] || null;
}
