public class BSTDemo {
    static class Node {
        int val;
        Node left;
        Node right;

        Node(int val) {
            this.val = val;
            this.left = null;
            this.right = null;
        }
    }

    static Node insert(Node root, int val) {
        if (root == null) {
            return new Node(val);
        }
        if (val < root.val) {
            root.left = insert(root.left, val);
        } else if (val > root.val) {
            root.right = insert(root.right, val);
        }
        return root;
    }

    static boolean search(Node root, int target) {
        if (root == null) {
            return false;
        }
        if (root.val == target) {
            return true;
        }
        if (target < root.val) {
            return search(root.left, target);
        } else {
            return search(root.right, target);
        }
    }

    static Node findMin(Node node) {
        Node curr = node;
        while (curr != null && curr.left != null) {
            curr = curr.left;
        }
        return curr;
    }

    static Node delete(Node root, int val) {
        if (root == null) {
            return null;
        }
        if (val < root.val) {
            root.left = delete(root.left, val);
        } else if (val > root.val) {
            root.right = delete(root.right, val);
        } else {
            // Node to delete found

            // Case 1 & 2: Leaf or single child
            if (root.left == null) {
                return root.right;
            } else if (root.right == null) {
                return root.left;
            }

            // Case 3: Two children - find inorder successor
            Node successor = findMin(root.right);
            root.val = successor.val;
            root.right = delete(root.right, successor.val);
        }
        return root;
    }

    static void inorder(Node root) {
        if (root != null) {
            inorder(root.left);
            System.out.print(root.val + " ");
            inorder(root.right);
        }
    }

    static void preorder(Node root) {
        if (root != null) {
            System.out.print(root.val + " ");
            preorder(root.left);
            preorder(root.right);
        }
    }

    static void postorder(Node root) {
        if (root != null) {
            postorder(root.left);
            postorder(root.right);
            System.out.print(root.val + " ");
        }
    }

    public static void main(String[] args) {
        Node root = null;

        // 1. Insertion
        int[] values = { 50, 30, 70, 20, 40, 60, 80 };
        for (int v : values) {
            root = insert(root, v);
            System.out.println("INSERT: " + v);
        }

        // 2. Traversals
        System.out.print("INORDER: ");
        inorder(root);
        System.out.println();

        System.out.print("PREORDER: ");
        preorder(root);
        System.out.println();

        System.out.print("POSTORDER: ");
        postorder(root);
        System.out.println();

        // 3. Search
        int target = 40;
        boolean found40 = search(root, target);
        System.out.println("SEARCH 40: " + found40);

        boolean found99 = search(root, 99);
        System.out.println("SEARCH 99: " + found99);

        // 4. Deletion Case 1: Leaf node (20)
        root = delete(root, 20);
        System.out.println("DELETED LEAF: 20");

        // 5. Deletion Case 2: One-child node (let's insert 25, then delete 30)
        root = insert(root, 25);
        root = delete(root, 40); // removes 40, leaving 30 with single child 25
        root = delete(root, 30); // 30 deleted, replaced by child 25
        System.out.println("DELETED ONE-CHILD: 30");

        // 6. Deletion Case 3: Two-child node (root 50)
        root = delete(root, 50);
        System.out.println("DELETED TWO-CHILD: 50 (Root)");

        System.out.print("FINAL INORDER: ");
        inorder(root);
        System.out.println();

        System.out.println("BST operations completed successfully.");
    }
}
