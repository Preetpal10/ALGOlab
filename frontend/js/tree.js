// =============================================================================
// ALGOLAB - tree.js
// Phase 11.1: Binary Tree & Binary Search Tree (BST) Visualizer
//
// Interactive Binary Search Tree Visualizer.
// Supports: BST Insert, Delete (Leaf, 1-child, 2-child cases), Search,
// Traversals (Inorder, Preorder, Postorder, Level-Order), Tree State Inspector,
// Educational Explanations, Playback Timeline (Play, Pause, Prev, Next, Speed),
// and SVG Tree Rendering.
// =============================================================================

export const TREE_STORAGE_KEY = 'algolab_tree_state';

/**
 * Persists BST node values to web storage.
 */
export function saveTreeState(storage, state) {
  try {
    if (!storage || !state) return false;
    storage.setItem(TREE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save tree state:', err);
    return false;
  }
}

/**
 * Loads saved BST node values from web storage.
 */
export function loadTreeState(storage) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(TREE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Core Binary Search Tree Engine.
 * Operates purely on immutable state snapshots with stable node identities.
 */
class TreeEngine {
  constructor(initialValues = []) {
    this._nodeIdCounter = 0;
    this.nodes = new Map(); // id -> { id, val, leftId, rightId }
    this.rootId = null;
    this.history = [];
    this.currentHistoryIndex = -1;

    // Record initial step
    this._recordStep({
      operation: 'INITIAL',
      operand: null,
      rootId: null,
      nodes: new Map(),
      nodeCount: 0,
      height: 0,
      activeNodeId: null,
      activeEdge: null,
      foundNodeId: null,
      deletedNodeId: null,
      successorNodeId: null,
      visitedNodeIds: [],
      traversalOutput: [],
      searchResult: null,
      isError: false,
      message: 'Binary Search Tree initialized. Tree is currently empty.',
      explanation: {
        operation: 'INITIAL',
        what: 'Created an empty Binary Search Tree with root = null.',
        why: 'In a BST, all values in the left subtree are smaller than the node, and all in the right subtree are larger.',
        stateSummary: 'Nodes: 0 | Height: 0 | Root: null'
      }
    });

    // Populate initial values if provided
    if (Array.isArray(initialValues) && initialValues.length > 0) {
      for (const val of initialValues) {
        this.insert(Number(val));
      }
    }
  }

  /**
   * Deeply clones the current nodes map.
   * @private
   */
  _cloneNodes() {
    const clone = new Map();
    for (const [id, node] of this.nodes.entries()) {
      clone.set(id, { id: node.id, val: node.val, leftId: node.leftId, rightId: node.rightId });
    }
    return clone;
  }

  /**
   * Computes height of a subtree given root node ID.
   * Height of empty tree is 0; single node is 1.
   * @private
   */
  _calculateHeight(nodeId, nodesMap = this.nodes) {
    if (!nodeId || !nodesMap.has(nodeId)) return 0;
    const node = nodesMap.get(nodeId);
    const leftH = this._calculateHeight(node.leftId, nodesMap);
    const rightH = this._calculateHeight(node.rightId, nodesMap);
    return 1 + Math.max(leftH, rightH);
  }

  /**
   * Helper to truncate history if user branches from an earlier step.
   * @private
   */
  _branchHistory() {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }
  }

  /**
   * Records a snapshot step into history.
   * @private
   */
  _recordStep(stepData) {
    const nodesClone = stepData.nodes instanceof Map ? stepData.nodes : this._cloneNodes();
    const count = nodesClone.size;
    const height = this._calculateHeight(stepData.rootId, nodesClone);

    const step = {
      operation: stepData.operation || 'STEP',
      operand: stepData.operand ?? null,
      rootId: stepData.rootId,
      nodes: nodesClone,
      nodeCount: count,
      height: height,
      activeNodeId: stepData.activeNodeId ?? null,
      activeEdge: stepData.activeEdge ?? null,
      foundNodeId: stepData.foundNodeId ?? null,
      deletedNodeId: stepData.deletedNodeId ?? null,
      successorNodeId: stepData.successorNodeId ?? null,
      visitedNodeIds: Array.isArray(stepData.visitedNodeIds) ? [...stepData.visitedNodeIds] : [],
      traversalOutput: Array.isArray(stepData.traversalOutput) ? [...stepData.traversalOutput] : [],
      searchResult: stepData.searchResult ? { ...stepData.searchResult } : null,
      isError: Boolean(stepData.isError),
      message: stepData.message || '',
      explanation: stepData.explanation || {
        operation: stepData.operation || 'STEP',
        what: stepData.message || '',
        why: '',
        stateSummary: `Nodes: ${count} | Height: ${height} | Root: ${stepData.rootId ? nodesClone.get(stepData.rootId)?.val : 'null'}`
      }
    };

    this.history.push(step);
    this.currentHistoryIndex = this.history.length - 1;
    return step;
  }

  /**
   * Returns current node count.
   */
  size() {
    return this.nodes.size;
  }

  /**
   * Checks if tree is empty.
   */
  isEmpty() {
    return this.rootId === null || this.nodes.size === 0;
  }

  /**
   * Returns current history step.
   */
  getCurrentStep() {
    return this.currentHistoryIndex >= 0 ? this.history[this.currentHistoryIndex] : null;
  }

  /**
   * Inserts a value into the BST.
   * Generates step-by-step traversal and attachment snapshots.
   */
  insert(val) {
    this._branchHistory();
    const numVal = Number(val);
    if (isNaN(numVal)) return null;

    // Case 1: Empty Tree -> insert as root
    if (this.rootId === null) {
      const newId = 'node_' + (++this._nodeIdCounter);
      this.nodes.set(newId, { id: newId, val: numVal, leftId: null, rightId: null });
      this.rootId = newId;

      return this._recordStep({
        operation: 'INSERT_ROOT',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: newId,
        message: `Inserted ${numVal} as Root node (${newId}).`,
        explanation: {
          operation: `INSERT(${numVal})`,
          what: `Inserted ${numVal} as the Root of the tree.`,
          why: 'When the tree is empty, the first inserted element becomes the root node.',
          stateSummary: `Nodes: 1 | Height: 1 | Root: ${numVal}`
        }
      });
    }

    // Traverse to find insertion position
    let currId = this.rootId;
    let parentId = null;
    let isLeftChild = false;

    while (currId) {
      const currNode = this.nodes.get(currId);

      // Comparison step
      this._recordStep({
        operation: 'INSERT_COMPARE',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        message: numVal === currNode.val
          ? `Value ${numVal} matches node ${currNode.val}. Duplicates not inserted.`
          : numVal < currNode.val
            ? `Compare ${numVal} < ${currNode.val}: Branching LEFT.`
            : `Compare ${numVal} > ${currNode.val}: Branching RIGHT.`,
        explanation: {
          operation: `INSERT(${numVal})`,
          what: `Comparing insertion value ${numVal} against current node ${currNode.val}.`,
          why: numVal < currNode.val
            ? `Because ${numVal} < ${currNode.val}, BST ordering rules direct insertion to the left subtree.`
            : numVal > currNode.val
              ? `Because ${numVal} > ${currNode.val}, BST ordering rules direct insertion to the right subtree.`
              : `Value ${numVal} is already in the tree. Standard BST ignores duplicate keys.`,
          stateSummary: `Current: ${currNode.val} | Target: ${numVal}`
        }
      });

      if (numVal === currNode.val) {
        // Duplicate: do not insert
        return this.history[this.currentHistoryIndex];
      }

      parentId = currId;
      if (numVal < currNode.val) {
        isLeftChild = true;
        currId = currNode.leftId;
      } else {
        isLeftChild = false;
        currId = currNode.rightId;
      }
    }

    // Create and attach new node
    const newId = 'node_' + (++this._nodeIdCounter);
    this.nodes.set(newId, { id: newId, val: numVal, leftId: null, rightId: null });
    const parentNode = this.nodes.get(parentId);
    if (isLeftChild) {
      parentNode.leftId = newId;
    } else {
      parentNode.rightId = newId;
    }

    return this._recordStep({
      operation: 'INSERT_SUCCESS',
      operand: numVal,
      rootId: this.rootId,
      nodes: this._cloneNodes(),
      activeNodeId: newId,
      activeEdge: { from: parentId, to: newId },
      message: `Attached new node ${numVal} as ${isLeftChild ? 'LEFT' : 'RIGHT'} child of ${parentNode.val}.`,
      explanation: {
        operation: `INSERT(${numVal})`,
        what: `Attached new leaf node (${numVal}) as ${isLeftChild ? 'left' : 'right'} child of node ${parentNode.val}.`,
        why: 'In a BST, every newly inserted key is placed as a leaf at the vacant position found during traversal.',
        stateSummary: `Parent: ${parentNode.val} \u2192 New ${isLeftChild ? 'Left' : 'Right'}: ${numVal}`
      }
    });
  }

  /**
   * Searches for a value in the BST.
   * Generates step-by-step traversal and result snapshots.
   */
  search(val) {
    this._branchHistory();
    const numVal = Number(val);
    if (isNaN(numVal)) return null;

    if (this.rootId === null) {
      return this._recordStep({
        operation: 'SEARCH_NOT_FOUND',
        operand: numVal,
        rootId: null,
        nodes: this._cloneNodes(),
        searchResult: { found: false, val: numVal, nodeId: null },
        message: `Tree is empty. Value ${numVal} not found.`,
        explanation: {
          operation: `SEARCH(${numVal})`,
          what: `Tree is empty; search terminates immediately.`,
          why: 'An empty tree contains no elements to match.',
          stateSummary: 'Search Result: Not Found'
        }
      });
    }

    let currId = this.rootId;
    while (currId) {
      const currNode = this.nodes.get(currId);

      if (currNode.val === numVal) {
        // Found target
        return this._recordStep({
          operation: 'SEARCH_FOUND',
          operand: numVal,
          rootId: this.rootId,
          nodes: this._cloneNodes(),
          foundNodeId: currId,
          activeNodeId: currId,
          searchResult: { found: true, val: numVal, nodeId: currId },
          message: `Found target ${numVal} at node (${currId})!`,
          explanation: {
            operation: `SEARCH(${numVal})`,
            what: `Found target ${numVal} at current node!`,
            why: 'Target matches node value. BST search completes successfully in O(h) time.',
            stateSummary: `Found: ${numVal} at ${currId}`
          }
        });
      }

      // Comparison step
      const isLeft = numVal < currNode.val;
      this._recordStep({
        operation: 'SEARCH_COMPARE',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        message: isLeft
          ? `Compare ${numVal} < ${currNode.val}: Searching LEFT subtree.`
          : `Compare ${numVal} > ${currNode.val}: Searching RIGHT subtree.`,
        explanation: {
          operation: `SEARCH(${numVal})`,
          what: `Comparing search target ${numVal} against node ${currNode.val}.`,
          why: isLeft
            ? `Since ${numVal} < ${currNode.val}, the target must be in the left subtree if present.`
            : `Since ${numVal} > ${currNode.val}, the target must be in the right subtree if present.`,
          stateSummary: `Current: ${currNode.val} | Target: ${numVal}`
        }
      });

      currId = isLeft ? currNode.leftId : currNode.rightId;
    }

    // Not found
    return this._recordStep({
      operation: 'SEARCH_NOT_FOUND',
      operand: numVal,
      rootId: this.rootId,
      nodes: this._cloneNodes(),
      searchResult: { found: false, val: numVal, nodeId: null },
      message: `Reached null reference. Value ${numVal} was not found in the BST.`,
      explanation: {
        operation: `SEARCH(${numVal})`,
        what: `Reached leaf boundary without finding ${numVal}.`,
        why: 'In a BST, reaching a null pointer confirms that the key does not exist in the tree.',
        stateSummary: `Target ${numVal} Not Found`
      }
    });
  }

  /**
   * Helper to find minimum node in a subtree (inorder successor candidate).
   * @private
   */
  _findMin(nodeId) {
    let curr = nodeId;
    while (curr && this.nodes.get(curr).leftId) {
      curr = this.nodes.get(curr).leftId;
    }
    return curr;
  }

  /**
   * Deletes a value from the BST.
   * Handles:
   * 1. Leaf node deletion
   * 2. Single-child node deletion
   * 3. Two-child node deletion with Inorder Successor replacement
   */
  delete(val) {
    this._branchHistory();
    const numVal = Number(val);
    if (isNaN(numVal) || this.rootId === null) {
      return this._recordStep({
        operation: 'DELETE_NOT_FOUND',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        isError: true,
        message: `Cannot delete ${numVal}: Tree is empty.`,
        explanation: {
          operation: `DELETE(${numVal})`,
          what: 'Tree is empty; deletion aborted.',
          why: 'An empty tree contains no nodes to delete.',
          stateSummary: 'Deletion: Failed (Empty)'
        }
      });
    }

    // Step 1: Search for target node and its parent
    let currId = this.rootId;
    let parentId = null;

    while (currId) {
      const currNode = this.nodes.get(currId);
      if (currNode.val === numVal) {
        break;
      }

      this._recordStep({
        operation: 'DELETE_SEARCH',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        message: numVal < currNode.val
          ? `Searching for ${numVal} to delete: Compare ${numVal} < ${currNode.val} \u2192 branch LEFT.`
          : `Searching for ${numVal} to delete: Compare ${numVal} > ${currNode.val} \u2192 branch RIGHT.`,
        explanation: {
          operation: `DELETE(${numVal})`,
          what: `Locating node with value ${numVal} for deletion.`,
          why: 'Before deleting, we must first traverse to find the target node in O(h) time.',
          stateSummary: `Locating node: current ${currNode.val}`
        }
      });

      parentId = currId;
      currId = numVal < currNode.val ? currNode.leftId : currNode.rightId;
    }

    // If target node not found
    if (!currId) {
      return this._recordStep({
        operation: 'DELETE_NOT_FOUND',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        isError: true,
        message: `Value ${numVal} not found in the BST. Nothing deleted.`,
        explanation: {
          operation: `DELETE(${numVal})`,
          what: `Target ${numVal} not found in tree.`,
          why: 'A node must exist in the tree to be deleted.',
          stateSummary: 'Deletion: Target Not Found'
        }
      });
    }

    const targetNode = this.nodes.get(currId);

    // CASE 1: Leaf node (no children)
    if (!targetNode.leftId && !targetNode.rightId) {
      this._recordStep({
        operation: 'DELETE_CASE_1_LEAF',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        deletedNodeId: currId,
        message: `Identified leaf node ${targetNode.val} (Case 1: No children).`,
        explanation: {
          operation: `DELETE(${numVal}) - Case 1: Leaf`,
          what: `Node ${targetNode.val} has no children (Leaf Node).`,
          why: 'Deleting a leaf is straightforward: simply disconnect parent pointer to this node.',
          stateSummary: `Target: Leaf ${targetNode.val}`
        }
      });

      if (currId === this.rootId) {
        this.rootId = null;
      } else {
        const parentNode = this.nodes.get(parentId);
        if (parentNode.leftId === currId) parentNode.leftId = null;
        else parentNode.rightId = null;
      }
      this.nodes.delete(currId);

      return this._recordStep({
        operation: 'DELETE_SUCCESS',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        message: `Deleted leaf node ${numVal}.`,
        explanation: {
          operation: `DELETE(${numVal})`,
          what: `Leaf node ${numVal} removed from tree.`,
          why: 'Parent pointer updated to null. The BST invariant is preserved.',
          stateSummary: `Nodes Remaining: ${this.nodes.size}`
        }
      });
    }

    // CASE 2: Single child (one child only)
    if (!targetNode.leftId || !targetNode.rightId) {
      const childId = targetNode.leftId || targetNode.rightId;
      const childNode = this.nodes.get(childId);

      this._recordStep({
        operation: 'DELETE_CASE_2_ONE_CHILD',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        deletedNodeId: currId,
        message: `Identified single-child node ${targetNode.val} (Case 2: Child is ${childNode.val}).`,
        explanation: {
          operation: `DELETE(${numVal}) - Case 2: One Child`,
          what: `Node ${targetNode.val} has exactly one child (${childNode.val}).`,
          why: 'We bypass the deleted node by linking its parent directly to its sole child.',
          stateSummary: `Target: ${targetNode.val} | Child: ${childNode.val}`
        }
      });

      if (currId === this.rootId) {
        this.rootId = childId;
      } else {
        const parentNode = this.nodes.get(parentId);
        if (parentNode.leftId === currId) parentNode.leftId = childId;
        else parentNode.rightId = childId;
      }
      this.nodes.delete(currId);

      return this._recordStep({
        operation: 'DELETE_SUCCESS',
        operand: numVal,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        message: `Deleted node ${numVal} and promoted child ${childNode.val}.`,
        explanation: {
          operation: `DELETE(${numVal})`,
          what: `Removed node ${numVal}; promoted child ${childNode.val} to its position.`,
          why: 'Single child takes the place of the deleted node, preserving all subtree relationships.',
          stateSummary: `Nodes Remaining: ${this.nodes.size}`
        }
      });
    }

    // CASE 3: Two children
    // Find inorder successor: minimum node in right subtree
    const successorId = this._findMin(targetNode.rightId);
    const successorNode = this.nodes.get(successorId);

    this._recordStep({
      operation: 'DELETE_CASE_3_TWO_CHILDREN',
      operand: numVal,
      rootId: this.rootId,
      nodes: this._cloneNodes(),
      activeNodeId: currId,
      successorNodeId: successorId,
      message: `Node ${targetNode.val} has two children. Located inorder successor ${successorNode.val} (min in right subtree).`,
      explanation: {
        operation: `DELETE(${numVal}) - Case 3: Two Children`,
        what: `Found inorder successor ${successorNode.val} in right subtree.`,
        why: 'Inorder successor is the smallest value greater than target. Replacing target with it preserves BST ordering.',
        stateSummary: `Target: ${targetNode.val} | Successor: ${successorNode.val}`
      }
    });

    // Copy successor value into target node
    targetNode.val = successorNode.val;

    this._recordStep({
      operation: 'DELETE_SUCCESSOR_SWAP',
      operand: numVal,
      rootId: this.rootId,
      nodes: this._cloneNodes(),
      activeNodeId: currId,
      successorNodeId: successorId,
      message: `Replaced target node value with successor value ${successorNode.val}. Now deleting successor from right subtree.`,
      explanation: {
        operation: `DELETE(${numVal}) - Value Replacement`,
        what: `Copied successor value (${successorNode.val}) into node ${currId}.`,
        why: 'Now we remove the duplicate successor node from the right subtree (which has at most one child).',
        stateSummary: `Updated Node: ${successorNode.val}`
      }
    });

    // Delete successor node from right subtree
    // Successor has no left child, so it has at most 1 right child
    let succParentId = currId;
    let succScan = targetNode.rightId;
    while (succScan !== successorId) {
      succParentId = succScan;
      succScan = this.nodes.get(succScan).leftId;
    }

    const succParent = this.nodes.get(succParentId);
    if (succParent.leftId === successorId) {
      succParent.leftId = successorNode.rightId;
    } else {
      succParent.rightId = successorNode.rightId;
    }
    this.nodes.delete(successorId);

    return this._recordStep({
      operation: 'DELETE_SUCCESS',
      operand: numVal,
      rootId: this.rootId,
      nodes: this._cloneNodes(),
      message: `Successfully deleted node ${numVal} via Inorder Successor (${successorNode.val}).`,
      explanation: {
        operation: `DELETE(${numVal}) - Complete`,
        what: `Successor node unlinked. Two-child deletion completed.`,
        why: 'The tree remains a valid Binary Search Tree with all ordering invariants preserved.',
        stateSummary: `Nodes Remaining: ${this.nodes.size}`
      }
    });
  }

  /**
   * Inorder Traversal: Left -> Root -> Right.
   * Yields nodes in ascending sorted order for BST.
   */
  inorder() {
    this._branchHistory();
    if (this.rootId === null) return null;

    const visitedIds = [];
    const output = [];

    const traverse = (nodeId) => {
      if (!nodeId || !this.nodes.has(nodeId)) return;
      const node = this.nodes.get(nodeId);

      traverse(node.leftId);

      visitedIds.push(nodeId);
      output.push(node.val);

      this._recordStep({
        operation: 'TRAVERSE_INORDER',
        operand: node.val,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: nodeId,
        visitedNodeIds: [...visitedIds],
        traversalOutput: [...output],
        message: `Inorder: Visited node ${node.val} (Output: [${output.join(', ')}]).`,
        explanation: {
          operation: 'INORDER TRAVERSAL',
          what: `Visited node ${node.val}. Left subtree finished; now visiting Root before Right subtree.`,
          why: 'Inorder traversal (Left \u2192 Root \u2192 Right) on a BST produces values in strictly sorted ascending order.',
          stateSummary: `Sequence: [${output.join(', ')}]`
        }
      });

      traverse(node.rightId);
    };

    traverse(this.rootId);
    return this.history[this.currentHistoryIndex];
  }

  /**
   * Preorder Traversal: Root -> Left -> Right.
   */
  preorder() {
    this._branchHistory();
    if (this.rootId === null) return null;

    const visitedIds = [];
    const output = [];

    const traverse = (nodeId) => {
      if (!nodeId || !this.nodes.has(nodeId)) return;
      const node = this.nodes.get(nodeId);

      visitedIds.push(nodeId);
      output.push(node.val);

      this._recordStep({
        operation: 'TRAVERSE_PREORDER',
        operand: node.val,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: nodeId,
        visitedNodeIds: [...visitedIds],
        traversalOutput: [...output],
        message: `Preorder: Visited node ${node.val} (Output: [${output.join(', ')}]).`,
        explanation: {
          operation: 'PREORDER TRAVERSAL',
          what: `Visited node ${node.val} before descending into left and right subtrees.`,
          why: 'Preorder traversal (Root \u2192 Left \u2192 Right) is useful for creating a prefix copy or serialization of a tree.',
          stateSummary: `Sequence: [${output.join(', ')}]`
        }
      });

      traverse(node.leftId);
      traverse(node.rightId);
    };

    traverse(this.rootId);
    return this.history[this.currentHistoryIndex];
  }

  /**
   * Postorder Traversal: Left -> Right -> Root.
   */
  postorder() {
    this._branchHistory();
    if (this.rootId === null) return null;

    const visitedIds = [];
    const output = [];

    const traverse = (nodeId) => {
      if (!nodeId || !this.nodes.has(nodeId)) return;
      const node = this.nodes.get(nodeId);

      traverse(node.leftId);
      traverse(node.rightId);

      visitedIds.push(nodeId);
      output.push(node.val);

      this._recordStep({
        operation: 'TRAVERSE_POSTORDER',
        operand: node.val,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: nodeId,
        visitedNodeIds: [...visitedIds],
        traversalOutput: [...output],
        message: `Postorder: Visited node ${node.val} (Output: [${output.join(', ')}]).`,
        explanation: {
          operation: 'POSTORDER TRAVERSAL',
          what: `Visited node ${node.val} after both left and right subtrees were fully processed.`,
          why: 'Postorder traversal (Left \u2192 Right \u2192 Root) is ideal for bottom-up evaluations and deleting trees.',
          stateSummary: `Sequence: [${output.join(', ')}]`
        }
      });
    };

    traverse(this.rootId);
    return this.history[this.currentHistoryIndex];
  }

  /**
   * Level-Order Traversal (Breadth-First Search).
   */
  levelorder() {
    this._branchHistory();
    if (this.rootId === null) return null;

    const visitedIds = [];
    const output = [];
    const queue = [this.rootId];

    while (queue.length > 0) {
      const currId = queue.shift();
      const node = this.nodes.get(currId);

      visitedIds.push(currId);
      output.push(node.val);

      if (node.leftId) queue.push(node.leftId);
      if (node.rightId) queue.push(node.rightId);

      this._recordStep({
        operation: 'TRAVERSE_LEVELORDER',
        operand: node.val,
        rootId: this.rootId,
        nodes: this._cloneNodes(),
        activeNodeId: currId,
        visitedNodeIds: [...visitedIds],
        traversalOutput: [...output],
        message: `Level-Order (BFS): Visited node ${node.val} (Output: [${output.join(', ')}]).`,
        explanation: {
          operation: 'LEVEL-ORDER TRAVERSAL',
          what: `Visited node ${node.val} using FIFO queue order.`,
          why: 'Level-order traversal visits all nodes depth-by-depth from top to bottom, left to right.',
          stateSummary: `Sequence: [${output.join(', ')}]`
        }
      });
    }

    return this.history[this.currentHistoryIndex];
  }

  /**
   * Clears all nodes from tree.
   */
  clear() {
    this._branchHistory();
    this.nodes.clear();
    this.rootId = null;

    return this._recordStep({
      operation: 'CLEAR',
      operand: null,
      rootId: null,
      nodes: new Map(),
      message: 'Cleared all nodes from the tree.',
      explanation: {
        operation: 'CLEAR',
        what: 'Removed all nodes and reset root pointer to null.',
        why: 'Resets tree state for fresh experimentation.',
        stateSummary: 'Nodes: 0 | Height: 0 | Root: null'
      }
    });
  }

  /**
   * Restores engine state to a specific history snapshot index.
   */
  goToStep(index) {
    if (index >= 0 && index < this.history.length) {
      this.currentHistoryIndex = index;
      const step = this.history[index];

      this.nodes.clear();
      this.rootId = step.rootId;
      for (const [id, node] of step.nodes.entries()) {
        this.nodes.set(id, { id: node.id, val: node.val, leftId: node.leftId, rightId: node.rightId });
      }
      return step;
    }
    return null;
  }

  /**
   * Steps backward.
   */
  prevStep() {
    if (this.currentHistoryIndex > 0) {
      return this.goToStep(this.currentHistoryIndex - 1);
    }
    return null;
  }

  /**
   * Steps forward.
   */
  nextStep() {
    if (this.currentHistoryIndex < this.history.length - 1) {
      return this.goToStep(this.currentHistoryIndex + 1);
    }
    return null;
  }
}

// Export for Node.js test runner and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TreeEngine };
}

/* =====================================================
   DOM CONTROLLER & PLAYBACK ENGINE
   Active only when running in a browser document
   ===================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const treeContainer = document.getElementById('tree-container');
    if (!treeContainer) return; // Not on Tree Visualizer page

    // Controls
    const treeInputVal = document.getElementById('tree-input-val');
    const insertBtn = document.getElementById('insert-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const searchBtn = document.getElementById('search-btn');
    const inorderBtn = document.getElementById('inorder-btn');
    const preorderBtn = document.getElementById('preorder-btn');
    const postorderBtn = document.getElementById('postorder-btn');
    const levelorderBtn = document.getElementById('levelorder-btn');
    const clearBtn = document.getElementById('clear-btn');
    const scenarioSelect = document.getElementById('scenario-select');

    // Playback Controls
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetTimelineBtn = document.getElementById('reset-timeline-btn');
    const speedRange = document.getElementById('speed-range');

    // Display elements
    const stepMessage = document.getElementById('step-message');
    const currentStepValue = document.getElementById('current-step-value');
    const treeNodeCountValue = document.getElementById('tree-node-count-value');
    const treeHeightValue = document.getElementById('tree-height-value');
    const treeRootValue = document.getElementById('tree-root-value');
    const treeInspectedValue = document.getElementById('tree-inspected-value');
    const treeOperationValue = document.getElementById('tree-operation-value');
    const treeSearchResultValue = document.getElementById('tree-search-result-value');
    const treeStatusValue = document.getElementById('tree-status-value');
    const traversalStream = document.getElementById('traversal-stream');

    // Explanation panel elements
    const explanationOp = document.getElementById('explanation-op');
    const explanationWhat = document.getElementById('explanation-what');
    const explanationWhy = document.getElementById('explanation-why');
    const explanationSummary = document.getElementById('explanation-summary');

    // Initialize Tree Engine with saved values or default balanced BST
    const savedState = loadTreeState(typeof window !== 'undefined' ? window.localStorage : null);
    const initialValues = (savedState && Array.isArray(savedState.values)) ? savedState.values : [50, 30, 70, 20, 40, 60, 80];
    let tree = new TreeEngine(initialValues);

    function persistCurrentTree() {
      const values = Array.from(tree.nodes.values()).map(n => n.val);
      const state = {
        values,
        timestamp: Date.now()
      };
      saveTreeState(typeof window !== 'undefined' ? window.localStorage : null, state);
    }

    // Playback timer & sequence token
    let isPlaying = false;
    let playIntervalId = null;
    let sequenceToken = 0;

    function getPlaybackSpeed() {
      return speedRange ? 1600 - Number(speedRange.value) : 800;
    }

    function stopPlayback() {
      if (isPlaying) {
        isPlaying = false;
        clearInterval(playIntervalId);
        playIntervalId = null;
      }
      if (playBtn) playBtn.disabled = false;
      if (pauseBtn) pauseBtn.disabled = true;
    }

    /**
     * Computes (x, y) coordinates for all nodes in the tree.
     * Uses inorder ranking for non-overlapping x positions.
     */
    function calculateLayout(rootId, nodesMap) {
      if (!rootId || !nodesMap.has(rootId)) return new Map();

      // Inorder traversal to assign x coordinates
      const positions = new Map();
      let inorderRank = 0;

      function assignInorder(id, depth) {
        if (!id || !nodesMap.has(id)) return;
        const node = nodesMap.get(id);

        assignInorder(node.leftId, depth + 1);

        positions.set(id, { rank: inorderRank++, depth: depth });

        assignInorder(node.rightId, depth + 1);
      }

      assignInorder(rootId, 0);

      const totalNodes = positions.size;
      const svgWidth = 800;
      const marginX = 60;
      const usableWidth = svgWidth - 2 * marginX;
      const stepX = totalNodes > 1 ? usableWidth / (totalNodes - 1) : 0;
      const startY = 60;
      const stepY = 70;

      const coords = new Map();
      for (const [id, pos] of positions.entries()) {
        const x = totalNodes === 1 ? 400 : marginX + pos.rank * stepX;
        const y = startY + pos.depth * stepY;
        coords.set(id, { x, y });
      }

      return coords;
    }

    /**
     * Renders current snapshot to SVG and updates all inspector elements.
     */
    function renderStep(step) {
      if (!step) return;

      const currentIdx = tree.currentHistoryIndex;
      const totalSteps = tree.history.length;

      // Update inspector counters
      if (currentStepValue) currentStepValue.textContent = `${currentIdx + 1} / ${totalSteps}`;
      if (treeNodeCountValue) treeNodeCountValue.textContent = String(step.nodeCount);
      if (treeHeightValue) treeHeightValue.textContent = String(step.height);
      if (treeRootValue) {
        treeRootValue.textContent = step.rootId ? String(step.nodes.get(step.rootId)?.val ?? 'null') : 'null';
      }
      if (treeInspectedValue) {
        treeInspectedValue.textContent = step.activeNodeId
          ? `${step.nodes.get(step.activeNodeId)?.val ?? ''} (${step.activeNodeId})`
          : 'None';
      }
      if (treeOperationValue) treeOperationValue.textContent = step.operation;
      if (treeSearchResultValue) {
        treeSearchResultValue.textContent = step.searchResult
          ? (step.searchResult.found ? `Found (${step.searchResult.val})` : `Not Found (${step.searchResult.val})`)
          : 'N/A';
      }

      // Status badge
      if (treeStatusValue) {
        if (step.nodeCount === 0) {
          treeStatusValue.innerHTML = '<span class="status-badge badge-empty">Empty</span>';
        } else if (step.isError) {
          treeStatusValue.innerHTML = '<span class="status-badge badge-underflow">Error</span>';
        } else {
          treeStatusValue.innerHTML = '<span class="status-badge badge-active">Ready</span>';
        }
      }

      // Step Message Box
      if (stepMessage) {
        stepMessage.textContent = step.message;
        stepMessage.className = 'step-message-box';
        if (step.operation.startsWith('INSERT')) stepMessage.classList.add('insert');
        else if (step.operation.startsWith('DELETE')) stepMessage.classList.add('delete');
        else if (step.operation.startsWith('SEARCH')) stepMessage.classList.add('search');
        else if (step.operation.startsWith('TRAVERSE')) stepMessage.classList.add('reverse');
      }

      // Explanation panel
      if (explanationOp) explanationOp.textContent = step.explanation?.operation || step.operation;
      if (explanationWhat) explanationWhat.textContent = step.explanation?.what || step.message;
      if (explanationWhy) explanationWhy.textContent = step.explanation?.why || '';
      if (explanationSummary) explanationSummary.textContent = step.explanation?.stateSummary || '';

      // Traversal stream chips
      if (traversalStream) {
        if (step.traversalOutput && step.traversalOutput.length > 0) {
          traversalStream.innerHTML = step.traversalOutput.map((val, idx) => {
            const isLatest = idx === step.traversalOutput.length - 1;
            return `<span class="traversal-chip ${isLatest ? 'chip-active' : ''}">${val}</span>`;
          }).join(' ');
        } else if (!step.operation.startsWith('TRAVERSE')) {
          traversalStream.innerHTML = '<span style="color: #94a3b8; font-style: italic;">No traversal running. Click Inorder, Preorder, Postorder, or Level-Order.</span>';
        }
      }

      // Playback buttons disabled states
      if (prevBtn) prevBtn.disabled = currentIdx <= 0 || isPlaying;
      if (nextBtn) nextBtn.disabled = currentIdx >= totalSteps - 1 || isPlaying;

      // Render Tree Canvas (Empty or SVG)
      if (!step.rootId || step.nodeCount === 0) {
        treeContainer.innerHTML = `
          <div class="tree-empty-indicator">
            <div class="empty-icon">&#127795;</div>
            <div class="empty-title">Tree is Empty</div>
            <div class="empty-subtitle">Use the Insert control or select a scenario to visualize nodes and edges.</div>
          </div>
        `;
        return;
      }

      // Calculate layout coordinates
      const coords = calculateLayout(step.rootId, step.nodes);

      // Dynamically calculate required height
      const maxY = Math.max(...Array.from(coords.values()).map(c => c.y), 360);
      const svgHeight = Math.max(420, maxY + 60);

      // Build SVG elements
      let svgHtml = `<svg class="tree-svg" viewBox="0 0 800 ${svgHeight}">`;

      // Draw Edges First
      for (const [id, node] of step.nodes.entries()) {
        const parentCoord = coords.get(id);
        if (!parentCoord) continue;

        // Left Edge
        if (node.leftId && coords.has(node.leftId)) {
          const childCoord = coords.get(node.leftId);
          const isActiveEdge = (step.activeEdge?.from === id && step.activeEdge?.to === node.leftId);
          const isEdgeFound = (step.foundNodeId === node.leftId && step.activeNodeId === id);
          svgHtml += `
            <line class="tree-edge ${isActiveEdge ? 'edge-active' : ''} ${isEdgeFound ? 'edge-found' : ''}"
              x1="${parentCoord.x}" y1="${parentCoord.y}"
              x2="${childCoord.x}" y2="${childCoord.y}" />
          `;
        }

        // Right Edge
        if (node.rightId && coords.has(node.rightId)) {
          const childCoord = coords.get(node.rightId);
          const isActiveEdge = (step.activeEdge?.from === id && step.activeEdge?.to === node.rightId);
          const isEdgeFound = (step.foundNodeId === node.rightId && step.activeNodeId === id);
          svgHtml += `
            <line class="tree-edge ${isActiveEdge ? 'edge-active' : ''} ${isEdgeFound ? 'edge-found' : ''}"
              x1="${parentCoord.x}" y1="${parentCoord.y}"
              x2="${childCoord.x}" y2="${childCoord.y}" />
          `;
        }
      }

      // Draw Nodes
      for (const [id, node] of step.nodes.entries()) {
        const coord = coords.get(id);
        if (!coord) continue;

        const isRoot = (id === step.rootId);
        const isActive = (id === step.activeNodeId);
        const isFound = (id === step.foundNodeId);
        const isDeleted = (id === step.deletedNodeId);
        const isSuccessor = (id === step.successorNodeId);
        const isVisited = step.visitedNodeIds?.includes(id);

        let groupClasses = ['tree-node-group'];
        if (isRoot) groupClasses.push('node-root');
        if (isActive) groupClasses.push('node-active');
        if (isFound) groupClasses.push('node-found');
        if (isDeleted) groupClasses.push('node-deleted');
        if (isSuccessor) groupClasses.push('node-successor');
        if (isVisited && !isActive && !isFound) groupClasses.push('node-visited');

        svgHtml += `
          <g class="${groupClasses.join(' ')}" transform="translate(${coord.x}, ${coord.y})" data-node-id="${id}">
            <circle class="tree-node-circle" r="22" />
            <text class="tree-node-text" dy="1">${node.val}</text>
            ${isRoot ? '<text class="tree-node-badge" y="-28">ROOT</text>' : ''}
          </g>
        `;
      }

      svgHtml += `</svg>`;
      treeContainer.innerHTML = svgHtml;
    }

    /**
     * Starts step-by-step auto-playback.
     */
    function play() {
      if (isPlaying) return;
      if (tree.history.length === 0) return;

      // If at end of history, restart from beginning
      if (tree.currentHistoryIndex >= tree.history.length - 1) {
        tree.goToStep(0);
        renderStep(tree.history[0]);
      }

      isPlaying = true;
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;

      const myToken = ++sequenceToken;
      const speed = getPlaybackSpeed();

      playIntervalId = setInterval(() => {
        if (myToken !== sequenceToken) {
          stopPlayback();
          return;
        }

        if (tree.currentHistoryIndex < tree.history.length - 1) {
          const nextStep = tree.nextStep();
          renderStep(nextStep);
        } else {
          stopPlayback();
        }
      }, speed);
    }

    // Wiring Action Event Listeners
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        stopPlayback();
        const val = parseInt(treeInputVal.value, 10);
        if (!isNaN(val)) {
          const step = tree.insert(val);
          renderStep(step);
          persistCurrentTree();
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        stopPlayback();
        const val = parseInt(treeInputVal.value, 10);
        if (!isNaN(val)) {
          const step = tree.delete(val);
          renderStep(step);
          persistCurrentTree();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        stopPlayback();
        const val = parseInt(treeInputVal.value, 10);
        if (!isNaN(val)) {
          const step = tree.search(val);
          renderStep(step);
        }
      });
    }

    if (inorderBtn) {
      inorderBtn.addEventListener('click', () => {
        stopPlayback();
        tree.inorder();
        renderStep(tree.history[tree.currentHistoryIndex]);
      });
    }

    if (preorderBtn) {
      preorderBtn.addEventListener('click', () => {
        stopPlayback();
        tree.preorder();
        renderStep(tree.history[tree.currentHistoryIndex]);
      });
    }

    if (postorderBtn) {
      postorderBtn.addEventListener('click', () => {
        stopPlayback();
        tree.postorder();
        renderStep(tree.history[tree.currentHistoryIndex]);
      });
    }

    if (levelorderBtn) {
      levelorderBtn.addEventListener('click', () => {
        stopPlayback();
        tree.levelorder();
        renderStep(tree.history[tree.currentHistoryIndex]);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        stopPlayback();
        const step = tree.clear();
        renderStep(step);
        persistCurrentTree();
      });
    }

    // Scenarios dropdown
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', (e) => {
        stopPlayback();
        const scenario = e.target.value;
        if (scenario === 'balanced') {
          tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
        } else if (scenario === 'deletion-two-child') {
          tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
          tree.delete(50); // Demonstrates two-child deletion on root!
        } else if (scenario === 'skewed') {
          tree = new TreeEngine([10, 20, 30, 40, 50]); // Right-skewed degenerate BST
        } else if (scenario === 'search-demo') {
          tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
          tree.search(40);
        } else if (scenario === 'custom') {
          tree = new TreeEngine([]);
        }
        persistCurrentTree();
        renderStep(tree.history[tree.currentHistoryIndex]);
      });
    }

    // Playback buttons
    if (playBtn) playBtn.addEventListener('click', play);
    if (pauseBtn) pauseBtn.addEventListener('click', stopPlayback);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopPlayback();
        const step = tree.prevStep();
        if (step) renderStep(step);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopPlayback();
        const step = tree.nextStep();
        if (step) renderStep(step);
      });
    }
    if (resetTimelineBtn) {
      resetTimelineBtn.addEventListener('click', () => {
        stopPlayback();
        const step = tree.goToStep(0);
        if (step) renderStep(step);
      });
    }

    // Render initial state
    renderStep(tree.history[tree.currentHistoryIndex]);
  });
}
export { TreeEngine };
