// =============================================================================
// ALGOLAB - linkedlist.js
// Phase 10.3: Singly Linked List Data Structure Visualizer
//
// Interactive Singly Linked List Visualizer.
// Supports: Insert Head/Tail/Pos, Delete Value/Pos, Search, Traverse, Reverse,
// Clear/Reset, Step-by-Step Playback (Play, Pause, Prev, Next, Speed),
// and Transparent Educational State Explanations.
// =============================================================================

/**
 * Core Singly Linked List Data Structure Engine.
 * Operates purely on state snapshots with stable node identities.
 */
class LinkedListEngine {
  constructor(initialElements = []) {
    this._nodeIdCounter = 0;
    this.nodes = new Map(); // id -> { id, val, nextId }
    this.headId = null;
    this.history = [];
    this.currentHistoryIndex = -1;

    // Initialize with initial elements if provided
    if (Array.isArray(initialElements) && initialElements.length > 0) {
      let prevId = null;
      for (const val of initialElements) {
        const id = 'node_' + (++this._nodeIdCounter);
        this.nodes.set(id, { id, val: Number(val), nextId: null });
        if (this.headId === null) {
          this.headId = id;
        } else if (prevId) {
          this.nodes.get(prevId).nextId = id;
        }
        prevId = id;
      }
    }

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    // Record initial step
    this._recordStep({
      operation: 'INITIAL',
      operand: null,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: null,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: ordered.length === 0
        ? 'Linked list initialized. The list is currently empty.'
        : `Linked list initialized with ${ordered.length} node${ordered.length === 1 ? '' : 's'}: [${values.join(' \u2192 ')}].`,
      explanation: {
        operation: 'Initialization',
        what: ordered.length === 0
          ? 'Created an empty Singly Linked List with head = null.'
          : `Created Linked List with initial elements: [${values.join(' \u2192 ')}].`,
        why: 'In a singly linked list, each node stores data and a pointer reference to the next node. Head points to the first node.',
        stateSummary: `Length: ${ordered.length} | Head: ${ordered.length > 0 ? values[0] : 'null'}`
      }
    });
  }

  /**
   * Returns nodes in order from head to tail as deep clones.
   * @private
   */
  _getOrderedNodes() {
    const list = [];
    let currId = this.headId;
    const visited = new Set();

    while (currId && this.nodes.has(currId) && !visited.has(currId)) {
      visited.add(currId);
      const node = this.nodes.get(currId);
      list.push({ id: node.id, val: node.val, nextId: node.nextId });
      currId = node.nextId;
    }
    return list;
  }

  /**
   * Returns current list length.
   */
  size() {
    return this._getOrderedNodes().length;
  }

  /**
   * Checks if list is empty.
   */
  isEmpty() {
    return this.headId === null;
  }

  /**
   * Inserts a new node at the head.
   * Time Complexity: O(1)
   */
  insertHead(value) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      throw new Error('Insert requires a valid numeric value.');
    }

    const numVal = Number(value);
    const newId = 'node_' + (++this._nodeIdCounter);
    const newNode = { id: newId, val: numVal, nextId: this.headId };
    this.nodes.set(newId, newNode);
    this.headId = newId;

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'INSERT_HEAD',
      operand: numVal,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: newId,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: `Inserted ${numVal} at head. Head now points to [${numVal}].`,
      explanation: {
        operation: `INSERT_HEAD(${numVal})`,
        what: `Created new Node(${numVal}), set its next pointer to the previous head, and updated head = ${numVal}.`,
        why: 'Inserting at the head takes O(1) time because no traversal is required.',
        stateSummary: `Length: ${ordered.length} | Head: ${numVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Inserts a new node at the tail.
   * Time Complexity: O(n)
   */
  insertTail(value) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      throw new Error('Insert requires a valid numeric value.');
    }

    const numVal = Number(value);
    const newId = 'node_' + (++this._nodeIdCounter);
    const newNode = { id: newId, val: numVal, nextId: null };
    this.nodes.set(newId, newNode);

    if (this.headId === null) {
      this.headId = newId;
    } else {
      let currId = this.headId;
      while (this.nodes.get(currId).nextId !== null) {
        currId = this.nodes.get(currId).nextId;
      }
      this.nodes.get(currId).nextId = newId;
    }

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'INSERT_TAIL',
      operand: numVal,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: newId,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: `Inserted ${numVal} at tail. List ends at [${numVal}] \u2192 NULL.`,
      explanation: {
        operation: `INSERT_TAIL(${numVal})`,
        what: `Traversed to the last node and linked its next pointer to new Node(${numVal}).`,
        why: 'In a singly linked list without a tail pointer, inserting at the end requires O(n) traversal.',
        stateSummary: `Length: ${ordered.length} | Tail: ${numVal}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Inserts a new node at a specified zero-based index.
   * Time Complexity: O(n)
   */
  insertAt(value, index) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      throw new Error('Insert requires a valid numeric value.');
    }

    const numVal = Number(value);
    const pos = Number(index);
    const curLen = this.size();

    if (isNaN(pos) || pos < 0 || pos > curLen) {
      const errorStep = {
        operation: 'INSERT_ERROR',
        operand: numVal,
        headId: this.headId,
        nodes: this._getOrderedNodes(),
        values: this._getOrderedNodes().map(n => n.val),
        length: curLen,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: false,
        isError: true,
        message: `Error: Cannot insert at invalid position ${pos}. Valid range is 0 to ${curLen}.`,
        explanation: {
          operation: 'INSERT_AT (Invalid Index)',
          what: `Rejected insertion at index ${pos}.`,
          why: `Position must be within the bounds of the list [0, ${curLen}].`,
          stateSummary: `Length: ${curLen} | Target Pos: ${pos}`
        }
      };
      this._recordStep(errorStep);
      return errorStep;
    }

    if (pos === 0) {
      return this.insertHead(numVal);
    }

    if (pos === curLen) {
      return this.insertTail(numVal);
    }

    // Insert in the middle
    let prevId = this.headId;
    for (let i = 0; i < pos - 1; i++) {
      prevId = this.nodes.get(prevId).nextId;
    }

    const newId = 'node_' + (++this._nodeIdCounter);
    const nextId = this.nodes.get(prevId).nextId;
    const newNode = { id: newId, val: numVal, nextId };
    this.nodes.set(newId, newNode);
    this.nodes.get(prevId).nextId = newId;

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'INSERT_AT',
      operand: numVal,
      position: pos,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: newId,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: `Inserted ${numVal} at position ${pos}.`,
      explanation: {
        operation: `INSERT_AT(${numVal}, pos=${pos})`,
        what: `Traversed to node at index ${pos - 1}, updated its next pointer to new Node(${numVal}), and linked new node to former node at index ${pos}.`,
        why: 'Inserting at an arbitrary position requires O(n) traversal to the predecessor node.',
        stateSummary: `Length: ${ordered.length} | Inserted at: index ${pos}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Deletes the first node with matching value.
   * Time Complexity: O(n)
   */
  deleteValue(value) {
    const numVal = Number(value);
    const curLen = this.size();

    if (this.headId === null) {
      const underflowStep = {
        operation: 'DELETE_UNDERFLOW',
        operand: numVal,
        headId: null,
        nodes: [],
        values: [],
        length: 0,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: true,
        isError: true,
        message: 'Underflow Warning: Cannot delete from an empty linked list!',
        explanation: {
          operation: 'DELETE (Underflow)',
          what: 'Attempted to delete an element from an empty list.',
          why: 'The list contains zero nodes, so no target node can be removed.',
          stateSummary: 'Length: 0 | Head: null (Empty)'
        }
      };
      this._recordStep(underflowStep);
      return underflowStep;
    }

    // Delete head if matches
    const headNode = this.nodes.get(this.headId);
    if (headNode.val === numVal) {
      const deletedId = this.headId;
      this.headId = headNode.nextId;
      this.nodes.delete(deletedId);

      const ordered = this._getOrderedNodes();
      const values = ordered.map(n => n.val);

      const step = {
        operation: 'DELETE_VALUE',
        operand: numVal,
        headId: this.headId,
        nodes: ordered,
        values,
        length: ordered.length,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: false,
        isError: false,
        message: `Deleted value ${numVal} from head. New head is ${ordered.length > 0 ? values[0] : 'null'}.`,
        explanation: {
          operation: `DELETE_VALUE(${numVal})`,
          what: `Target ${numVal} was at the head. Advanced head pointer to head.next.`,
          why: 'Deleting the head node takes O(1) time by reassigning head = head.next.',
          stateSummary: `Length: ${ordered.length} | Head: ${ordered.length > 0 ? values[0] : 'null'}`
        }
      };
      this._recordStep(step);
      return step;
    }

    // Search for predecessor
    let prevId = this.headId;
    let currId = headNode.nextId;
    let found = false;

    while (currId) {
      const currNode = this.nodes.get(currId);
      if (currNode.val === numVal) {
        found = true;
        this.nodes.get(prevId).nextId = currNode.nextId;
        this.nodes.delete(currId);
        break;
      }
      prevId = currId;
      currId = currNode.nextId;
    }

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    if (found) {
      const step = {
        operation: 'DELETE_VALUE',
        operand: numVal,
        headId: this.headId,
        nodes: ordered,
        values,
        length: ordered.length,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: false,
        isError: false,
        message: `Deleted value ${numVal} from the list.`,
        explanation: {
          operation: `DELETE_VALUE(${numVal})`,
          what: `Located node with value ${numVal} and bypassed it by updating predecessor.next = target.next.`,
          why: 'Unlinking a node requires pointing the previous node around it to the subsequent node.',
          stateSummary: `Length: ${ordered.length} | Head: ${ordered.length > 0 ? values[0] : 'null'}`
        }
      };
      this._recordStep(step);
      return step;
    } else {
      const notFoundStep = {
        operation: 'DELETE_NOT_FOUND',
        operand: numVal,
        headId: this.headId,
        nodes: ordered,
        values,
        length: ordered.length,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: false,
        isError: true,
        message: `Value ${numVal} not found in the linked list. No node was deleted.`,
        explanation: {
          operation: `DELETE_VALUE(${numVal}) - Not Found`,
          what: `Scanned all ${ordered.length} nodes without finding value ${numVal}.`,
          why: 'A node can only be deleted if its value is present in the list.',
          stateSummary: `Length: ${ordered.length} | Target: ${numVal}`
        }
      };
      this._recordStep(notFoundStep);
      return notFoundStep;
    }
  }

  /**
   * Deletes a node at a specified zero-based index.
   * Time Complexity: O(n)
   */
  deleteAt(index) {
    const pos = Number(index);
    const curLen = this.size();

    if (this.headId === null) {
      return this.deleteValue(0); // Triggers underflow step
    }

    if (isNaN(pos) || pos < 0 || pos >= curLen) {
      const errorStep = {
        operation: 'DELETE_ERROR',
        operand: pos,
        headId: this.headId,
        nodes: this._getOrderedNodes(),
        values: this._getOrderedNodes().map(n => n.val),
        length: curLen,
        activeNodeId: null,
        searchResult: null,
        isUnderflow: false,
        isError: true,
        message: `Error: Cannot delete at invalid position ${pos}. Valid range is 0 to ${curLen - 1}.`,
        explanation: {
          operation: 'DELETE_AT (Invalid Index)',
          what: `Rejected deletion at position ${pos}.`,
          why: `Position must be within the active index range [0, ${curLen - 1}].`,
          stateSummary: `Length: ${curLen} | Target Pos: ${pos}`
        }
      };
      this._recordStep(errorStep);
      return errorStep;
    }

    if (pos === 0) {
      const headVal = this.nodes.get(this.headId).val;
      return this.deleteValue(headVal);
    }

    let prevId = this.headId;
    for (let i = 0; i < pos - 1; i++) {
      prevId = this.nodes.get(prevId).nextId;
    }

    const toDeleteId = this.nodes.get(prevId).nextId;
    const deletedVal = this.nodes.get(toDeleteId).val;
    this.nodes.get(prevId).nextId = this.nodes.get(toDeleteId).nextId;
    this.nodes.delete(toDeleteId);

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'DELETE_AT',
      operand: deletedVal,
      position: pos,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: null,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: `Deleted node at position ${pos} (value: ${deletedVal}).`,
      explanation: {
        operation: `DELETE_AT(pos=${pos})`,
        what: `Bypassed node at index ${pos} by updating node at index ${pos - 1}.next = node at index ${pos + 1}.`,
        why: 'Deleting by position requires O(pos) traversal to locate the node preceding the target.',
        stateSummary: `Length: ${ordered.length} | Deleted from: index ${pos}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Searches for a value sequentially from head to tail.
   * Records steps highlighting each visited node.
   * Time Complexity: O(n)
   */
  search(value) {
    const numVal = Number(value);
    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    if (ordered.length === 0) {
      const emptyStep = {
        operation: 'SEARCH_NOT_FOUND',
        operand: numVal,
        headId: null,
        nodes: [],
        values: [],
        length: 0,
        activeNodeId: null,
        searchResult: { found: false, index: -1, value: numVal },
        isUnderflow: false,
        isError: false,
        message: `Search: List is empty. Value ${numVal} not found.`,
        explanation: {
          operation: `SEARCH(${numVal})`,
          what: 'List is empty; search terminates immediately.',
          why: 'An empty list contains no elements.',
          stateSummary: 'Length: 0 | Search: Not Found'
        }
      };
      this._recordStep(emptyStep);
      return emptyStep;
    }

    let foundIndex = -1;
    let foundNodeId = null;

    for (let i = 0; i < ordered.length; i++) {
      const node = ordered[i];
      const isMatch = node.val === numVal;

      if (isMatch) {
        foundIndex = i;
        foundNodeId = node.id;
        break;
      }
    }

    const result = {
      found: foundIndex !== -1,
      index: foundIndex,
      value: numVal,
      nodeId: foundNodeId
    };

    const finalStep = {
      operation: result.found ? 'SEARCH_FOUND' : 'SEARCH_NOT_FOUND',
      operand: numVal,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: foundNodeId,
      searchResult: result,
      isUnderflow: false,
      isError: false,
      message: result.found
        ? `Found ${numVal} at index ${foundIndex} (Node: ${foundNodeId}).`
        : `Value ${numVal} not found after checking all ${ordered.length} nodes.`,
      explanation: {
        operation: `SEARCH(${numVal})`,
        what: result.found
          ? `Found matching node with value ${numVal} at index ${foundIndex}.`
          : `Target ${numVal} was not found in the list.`,
        why: 'In a singly linked list, search is sequential (O(n)), examining nodes one by one from head to null.',
        stateSummary: result.found ? `Found at index ${foundIndex}` : 'Not Found in list'
      }
    };

    this._recordStep(finalStep);
    return finalStep;
  }

  /**
   * Traverses all nodes sequentially from head to tail.
   * Time Complexity: O(n)
   */
  traverse() {
    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'TRAVERSE',
      operand: null,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: ordered.length > 0 ? ordered[ordered.length - 1].id : null,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: ordered.length === 0
        ? 'Traversed empty list: HEAD \u2192 NULL.'
        : `Traversed ${ordered.length} nodes: [${values.join(' \u2192 ')}] \u2192 NULL.`,
      explanation: {
        operation: 'TRAVERSE',
        what: ordered.length === 0
          ? 'Visited 0 nodes. List is empty.'
          : `Traversed all ${ordered.length} nodes in sequence from head to tail.`,
        why: 'Traversal follows next pointers until encountering null, visiting each node in O(n) time.',
        stateSummary: `Traversed: ${values.join(' \u2192 ') || 'NULL'}`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Reverses the singly linked list in-place by flipping next pointers.
   * Time Complexity: O(n)
   */
  reverse() {
    const curLen = this.size();

    if (curLen <= 1) {
      const step = {
        operation: 'REVERSE',
        operand: null,
        headId: this.headId,
        nodes: this._getOrderedNodes(),
        values: this._getOrderedNodes().map(n => n.val),
        length: curLen,
        activeNodeId: this.headId,
        searchResult: null,
        isUnderflow: false,
        isError: false,
        message: curLen === 0
          ? 'Reverse: List is empty. No pointers to reverse.'
          : 'Reverse: Single node list remains unchanged.',
        explanation: {
          operation: 'REVERSE',
          what: `Reversed list with ${curLen} node(s).`,
          why: 'A list with 0 or 1 node is already its own reverse.',
          stateSummary: `Length: ${curLen}`
        }
      };
      this._recordStep(step);
      return step;
    }

    // In-place iterative reversal
    let prevId = null;
    let currId = this.headId;

    while (currId) {
      const currNode = this.nodes.get(currId);
      const nextId = currNode.nextId;
      currNode.nextId = prevId;
      prevId = currId;
      currId = nextId;
    }

    this.headId = prevId;

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const step = {
      operation: 'REVERSE',
      operand: null,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: this.headId,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: `Reversed linked list: [${values.join(' \u2192 ')}] \u2192 NULL.`,
      explanation: {
        operation: 'REVERSE',
        what: `Reversed all pointer directions. New head is [${values[0]}].`,
        why: 'Iterative reversal updates next pointers node-by-node using three tracking pointers (prev, curr, next) in O(n) time.',
        stateSummary: `Reversed: [${values.join(' \u2192 ')}]`
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Clears the linked list completely.
   */
  clear() {
    const prevCount = this.size();
    this.nodes.clear();
    this.headId = null;

    const step = {
      operation: 'RESET',
      operand: null,
      headId: null,
      nodes: [],
      values: [],
      length: 0,
      activeNodeId: null,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: 'Linked list cleared. List is now empty: HEAD \u2192 NULL.',
      explanation: {
        operation: 'RESET',
        what: `Removed all ${prevCount} nodes from the linked list.`,
        why: 'Clear resets the head pointer to null, releasing all nodes.',
        stateSummary: 'Length: 0 | Head: null (Empty)'
      }
    };

    this._recordStep(step);
    return step;
  }

  /**
   * Resets the linked list and history to begin a clean new sequence.
   */
  resetSequence(initialElements = []) {
    this._nodeIdCounter = 0;
    this.nodes.clear();
    this.headId = null;
    this.history = [];
    this.currentHistoryIndex = -1;

    if (Array.isArray(initialElements) && initialElements.length > 0) {
      let prevId = null;
      for (const val of initialElements) {
        const id = 'node_' + (++this._nodeIdCounter);
        this.nodes.set(id, { id, val: Number(val), nextId: null });
        if (this.headId === null) {
          this.headId = id;
        } else if (prevId) {
          this.nodes.get(prevId).nextId = id;
        }
        prevId = id;
      }
    }

    const ordered = this._getOrderedNodes();
    const values = ordered.map(n => n.val);

    const initialStep = {
      operation: 'INITIAL',
      operand: null,
      headId: this.headId,
      nodes: ordered,
      values,
      length: ordered.length,
      activeNodeId: null,
      searchResult: null,
      isUnderflow: false,
      isError: false,
      message: ordered.length === 0
        ? 'Linked list initialized. The list is currently empty.'
        : `Linked list initialized with ${ordered.length} node${ordered.length === 1 ? '' : 's'}: [${values.join(' \u2192 ')}].`,
      explanation: {
        operation: 'Initialization',
        what: ordered.length === 0
          ? 'Created an empty Singly Linked List with head = null.'
          : `Created Linked List with initial elements: [${values.join(' \u2192 ')}].`,
        why: 'In a singly linked list, each node stores data and a pointer reference to the next node.',
        stateSummary: `Length: ${ordered.length} | Head: ${ordered.length > 0 ? values[0] : 'null'}`
      }
    };

    this._recordStep(initialStep);
    return initialStep;
  }

  /**
   * Records a snapshot step into history.
   * If current pointer is behind latest step, cleanly truncates future forward steps.
   * @private
   */
  _recordStep(step) {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }
    this.history.push(step);
    this.currentHistoryIndex = this.history.length - 1;
  }

  /**
   * Returns index of the first valid operational snapshot in history.
   */
  getFirstValidStepIndex() {
    if (this.history.length > 1 && this.history[0]?.operation === 'INITIAL' && (this.history[0]?.nodes?.length ?? 0) === 0) {
      return 1;
    }
    return 0;
  }

  /**
   * Returns current snapshot step.
   */
  getCurrentStep() {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length) {
      return this.history[this.currentHistoryIndex];
    }
    return this.history[0] || null;
  }

  /**
   * Steps to a specific index in history.
   */
  goToStep(index) {
    if (index >= 0 && index < this.history.length) {
      this.currentHistoryIndex = index;
      const step = this.history[index];
      // Restore engine state
      this.nodes.clear();
      this.headId = step.headId;
      for (const node of step.nodes) {
        this.nodes.set(node.id, { id: node.id, val: node.val, nextId: node.nextId });
      }
      return step;
    }
    return null;
  }

  /**
   * Steps backward in history.
   */
  prevStep() {
    if (this.currentHistoryIndex > 0) {
      return this.goToStep(this.currentHistoryIndex - 1);
    }
    return null;
  }

  /**
   * Steps forward in history.
   */
  nextStep() {
    if (this.currentHistoryIndex < this.history.length - 1) {
      return this.goToStep(this.currentHistoryIndex + 1);
    }
    return null;
  }
}

// Export for ES modules and Node.js test runners
export { LinkedListEngine };

/* =====================================================
   DOM CONTROLLER & PLAYBACK ENGINE
   Active only when running in a browser document
   ===================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const llContainer = document.getElementById('ll-container');
    if (!llContainer) return; // Not on Linked List Visualizer page

    // Input & Operations controls
    const llInputVal = document.getElementById('ll-input-val');
    const llInputPos = document.getElementById('ll-input-pos');
    const insertHeadBtn = document.getElementById('insert-head-btn');
    const insertTailBtn = document.getElementById('insert-tail-btn');
    const insertPosBtn = document.getElementById('insert-pos-btn');
    const deleteValBtn = document.getElementById('delete-val-btn');
    const deletePosBtn = document.getElementById('delete-pos-btn');
    const searchBtn = document.getElementById('search-btn');
    const traverseBtn = document.getElementById('traverse-btn');
    const reverseBtn = document.getElementById('reverse-btn');
    const clearBtn = document.getElementById('clear-btn');
    const scenarioSelect = document.getElementById('scenario-select');

    // Step-by-step Playback controls
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetTimelineBtn = document.getElementById('reset-timeline-btn');
    const speedRange = document.getElementById('speed-range');

    // Display elements
    const stepMessage = document.getElementById('step-message');
    const currentStepValue = document.getElementById('current-step-value');
    const llLengthValue = document.getElementById('ll-length-value');
    const llHeadValue = document.getElementById('ll-head-value');
    const llCurrentNodeValue = document.getElementById('ll-current-node-value');
    const llOperationValue = document.getElementById('ll-operation-value');
    const llSearchResultValue = document.getElementById('ll-search-result-value');
    const llChainValue = document.getElementById('ll-chain-value');
    const llStatusValue = document.getElementById('ll-status-value');

    // Explanation panel elements
    const explanationOp = document.getElementById('explanation-op');
    const explanationWhat = document.getElementById('explanation-what');
    const explanationWhy = document.getElementById('explanation-why');
    const explanationSummary = document.getElementById('explanation-summary');

    // Initialize Linked List Engine
    const ll = new LinkedListEngine();

    // Auto-play interval state & generation token
    let isPlaying = false;
    let playIntervalId = null;
    let sequenceToken = 0;

    function getPlaybackSpeed() {
      return speedRange ? 1600 - Number(speedRange.value) : 800;
    }

    /**
     * Renders the current linked list snapshot into the DOM.
     */
    function renderStep(step) {
      if (!step) return;

      const nodes = step.nodes || [];
      const values = step.values || [];

      // 1. Render nodes horizontally
      llContainer.innerHTML = '';

      // Always display HEAD pointer
      const headPointerDiv = document.createElement('div');
      headPointerDiv.className = 'll-head-pointer';
      headPointerDiv.innerHTML = `
        <span class="ll-head-badge">HEAD</span>
        <span class="ll-pointer-arrow">&rarr;</span>
      `;
      llContainer.appendChild(headPointerDiv);

      if (nodes.length === 0) {
        // Empty list: HEAD -> NULL
        const nullBadge = document.createElement('div');
        nullBadge.className = 'll-null-badge';
        nullBadge.textContent = 'NULL';
        llContainer.appendChild(nullBadge);
      } else {
        nodes.forEach((node, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'll-node-wrapper';

          const nodeDiv = document.createElement('div');
          nodeDiv.className = 'll-node';
          nodeDiv.id = `node-${node.id}`;

          if (idx === 0) {
            nodeDiv.classList.add('head-node');
          }
          if (step.activeNodeId === node.id) {
            if (step.operation === 'SEARCH_FOUND') {
              nodeDiv.classList.add('found-node');
            } else if (step.operation === 'REVERSE') {
              nodeDiv.classList.add('reversed-node');
            } else {
              nodeDiv.classList.add('active-node');
            }
          }

          nodeDiv.innerHTML = `
            <div class="ll-node-data">${node.val}</div>
            <div class="ll-node-next" title="next: ${node.nextId || 'null'}">&bull;</div>
            <span class="ll-node-index-label">[${idx}]</span>
          `;
          wrapper.appendChild(nodeDiv);

          // Arrow to next or null
          const arrow = document.createElement('div');
          arrow.className = 'll-arrow';
          arrow.innerHTML = '&rarr;';
          wrapper.appendChild(arrow);

          llContainer.appendChild(wrapper);
        });

        // Terminal NULL badge
        const nullBadge = document.createElement('div');
        nullBadge.className = 'll-null-badge';
        nullBadge.textContent = 'NULL';
        llContainer.appendChild(nullBadge);
      }

      // 2. Update step message with color coding
      if (stepMessage) {
        stepMessage.textContent = step.message;
        stepMessage.className = 'step-message-box';
        if (step.isError || step.isUnderflow) {
          stepMessage.classList.add('delete');
        } else if (step.operation?.startsWith('INSERT')) {
          stepMessage.classList.add('insert');
        } else if (step.operation?.startsWith('DELETE')) {
          stepMessage.classList.add('delete');
        } else if (step.operation?.startsWith('SEARCH')) {
          stepMessage.classList.add('search');
        } else if (step.operation === 'REVERSE') {
          stepMessage.classList.add('reverse');
        }
      }

      // 3. Update info metrics
      const totalSteps = ll.history.length;
      const firstIndex = ll.getFirstValidStepIndex();
      const validTotal = Math.max(1, totalSteps - firstIndex);
      const validCurrent = Math.max(1, ll.currentHistoryIndex - firstIndex + 1);

      if (currentStepValue) {
        if (totalSteps <= 1 && ll.history[0]?.operation === 'INITIAL' && nodes.length === 0) {
          currentStepValue.textContent = '0 / 0';
        } else {
          currentStepValue.textContent = `${validCurrent} / ${validTotal}`;
        }
      }

      if (llLengthValue) {
        llLengthValue.textContent = String(step.length);
      }

      if (llHeadValue) {
        llHeadValue.textContent = nodes.length > 0 ? String(nodes[0].val) : 'null';
      }

      if (llCurrentNodeValue) {
        if (step.activeNodeId) {
          const active = nodes.find(n => n.id === step.activeNodeId);
          llCurrentNodeValue.textContent = active ? `${active.val} (${active.id})` : step.activeNodeId;
        } else {
          llCurrentNodeValue.textContent = 'None';
        }
      }

      if (llOperationValue) {
        llOperationValue.textContent = step.operation;
      }

      if (llSearchResultValue) {
        if (step.searchResult) {
          llSearchResultValue.textContent = step.searchResult.found
            ? `Found at [${step.searchResult.index}]`
            : 'Not Found';
        } else {
          llSearchResultValue.textContent = 'N/A';
        }
      }

      if (llChainValue) {
        llChainValue.textContent = values.length > 0
          ? `HEAD \u2192 ${values.join(' \u2192 ')} \u2192 NULL`
          : 'HEAD \u2192 NULL';
      }

      if (llStatusValue) {
        if (nodes.length === 0) {
          llStatusValue.innerHTML = '<span class="status-badge badge-empty">Empty</span>';
        } else if (step.searchResult?.found) {
          llStatusValue.innerHTML = '<span class="status-badge" style="background:#dcfce7; color:#166534;">Target Found</span>';
        } else if (step.operation === 'REVERSE') {
          llStatusValue.innerHTML = '<span class="status-badge" style="background:#ede9fe; color:#5b21b6;">Reversed</span>';
        } else {
          llStatusValue.innerHTML = `<span class="status-badge" style="background:#e0f2fe; color:#0369a1;">${nodes.length} Node${nodes.length === 1 ? '' : 's'}</span>`;
        }
      }

      // 4. Update explanation card
      if (step.explanation) {
        if (explanationOp) explanationOp.textContent = step.explanation.operation || step.operation;
        if (explanationWhat) explanationWhat.textContent = step.explanation.what || step.message;
        if (explanationWhy) explanationWhy.textContent = step.explanation.why || '';
        if (explanationSummary) explanationSummary.textContent = step.explanation.stateSummary || `Length: ${step.length}`;
      }

      // 5. Update playback buttons disabled states
      updatePlaybackControls();
    }

    function updatePlaybackControls() {
      const firstIndex = ll.getFirstValidStepIndex();
      const hasHistory = ll.history.length > firstIndex + 1;

      if (playBtn) playBtn.disabled = isPlaying || !hasHistory || ll.currentHistoryIndex >= ll.history.length - 1;
      if (pauseBtn) pauseBtn.disabled = !isPlaying;
      if (prevBtn) prevBtn.disabled = isPlaying || ll.currentHistoryIndex <= firstIndex;
      if (nextBtn) nextBtn.disabled = isPlaying || ll.currentHistoryIndex >= ll.history.length - 1;
      if (resetTimelineBtn) resetTimelineBtn.disabled = isPlaying || ll.history.length <= 1;
    }

    function play() {
      const firstIndex = ll.getFirstValidStepIndex();
      if (ll.history.length <= firstIndex + 1) return;

      if (ll.currentHistoryIndex >= ll.history.length - 1) {
        ll.goToStep(firstIndex);
        renderStep(ll.getCurrentStep());
      }

      isPlaying = true;
      const currentToken = ++sequenceToken;
      updatePlaybackControls();

      clearInterval(playIntervalId);
      playIntervalId = setInterval(() => {
        if (!isPlaying || currentToken !== sequenceToken) {
          clearInterval(playIntervalId);
          return;
        }

        const next = ll.nextStep();
        if (next) {
          renderStep(next);
          if (ll.currentHistoryIndex >= ll.history.length - 1) {
            pause();
          }
        } else {
          pause();
        }
      }, getPlaybackSpeed());
    }

    function pause() {
      isPlaying = false;
      sequenceToken++;
      clearInterval(playIntervalId);
      playIntervalId = null;
      updatePlaybackControls();
    }

    function resetTimeline() {
      pause();
      const firstIndex = ll.getFirstValidStepIndex();
      const step = ll.goToStep(firstIndex);
      renderStep(step);
    }

    function getInputValue() {
      const raw = llInputVal ? llInputVal.value.trim() : '';
      if (!raw || isNaN(Number(raw))) return null;
      return Number(raw);
    }

    function getInputPos() {
      const raw = llInputPos ? llInputPos.value.trim() : '0';
      if (raw === '' || isNaN(Number(raw))) return 0;
      return Number(raw);
    }

    // --- Action Button Listeners ---

    if (insertHeadBtn) {
      insertHeadBtn.addEventListener('click', () => {
        pause();
        const val = getInputValue();
        if (val === null) {
          alert('Please enter a valid numeric value.');
          return;
        }
        const step = ll.insertHead(val);
        renderStep(step);
      });
    }

    if (insertTailBtn) {
      insertTailBtn.addEventListener('click', () => {
        pause();
        const val = getInputValue();
        if (val === null) {
          alert('Please enter a valid numeric value.');
          return;
        }
        const step = ll.insertTail(val);
        renderStep(step);
      });
    }

    if (insertPosBtn) {
      insertPosBtn.addEventListener('click', () => {
        pause();
        const val = getInputValue();
        if (val === null) {
          alert('Please enter a valid numeric value.');
          return;
        }
        const pos = getInputPos();
        const step = ll.insertAt(val, pos);
        renderStep(step);
      });
    }

    if (deleteValBtn) {
      deleteValBtn.addEventListener('click', () => {
        pause();
        const val = getInputValue();
        if (val === null) {
          alert('Please enter a valid numeric value to delete.');
          return;
        }
        const step = ll.deleteValue(val);
        renderStep(step);
      });
    }

    if (deletePosBtn) {
      deletePosBtn.addEventListener('click', () => {
        pause();
        const pos = getInputPos();
        const step = ll.deleteAt(pos);
        renderStep(step);
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        pause();
        const val = getInputValue();
        if (val === null) {
          alert('Please enter a value to search for.');
          return;
        }
        const step = ll.search(val);
        renderStep(step);
      });
    }

    if (traverseBtn) {
      traverseBtn.addEventListener('click', () => {
        pause();
        const step = ll.traverse();
        renderStep(step);
      });
    }

    if (reverseBtn) {
      reverseBtn.addEventListener('click', () => {
        pause();
        const step = ll.reverse();
        renderStep(step);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        pause();
        ll.resetSequence([]);
        renderStep(ll.getCurrentStep());
      });
    }

    // --- Playback Controls Listeners ---

    if (playBtn) playBtn.addEventListener('click', play);
    if (pauseBtn) pauseBtn.addEventListener('click', pause);
    if (resetTimelineBtn) resetTimelineBtn.addEventListener('click', resetTimeline);

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        pause();
        const firstIndex = ll.getFirstValidStepIndex();
        if (ll.currentHistoryIndex > firstIndex) {
          const step = ll.prevStep();
          renderStep(step);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        pause();
        const step = ll.nextStep();
        renderStep(step);
      });
    }

    if (speedRange) {
      speedRange.addEventListener('input', () => {
        if (isPlaying) {
          play();
        }
      });
    }

    // --- Scenario Selector ---

    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', (e) => {
        pause();
        const scenario = e.target.value;

        if (scenario === 'custom') {
          ll.resetSequence([]);
        } else if (scenario === 'basic') {
          ll.resetSequence([10, 20, 30]);
        } else if (scenario === 'pos-insert') {
          ll.resetSequence([10, 30]);
          ll.insertAt(20, 1);
        } else if (scenario === 'delete-demo') {
          ll.resetSequence([10, 20, 30, 40]);
          ll.deleteValue(20);
          ll.deleteAt(0); // deletes 10
        } else if (scenario === 'search-demo') {
          ll.resetSequence([10, 20, 30]);
          ll.search(20);
        } else if (scenario === 'reverse-demo') {
          ll.resetSequence([10, 20, 30]);
          ll.reverse();
        }

        const firstIndex = ll.getFirstValidStepIndex();
        ll.goToStep(firstIndex);
        renderStep(ll.getCurrentStep());
      });
    }

    // Initial render
    renderStep(ll.getCurrentStep());
  });
}
