public class LinkedListDemo {
    static class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    public static void main(String[] args) {
        Node head = null;

        // 1. Insert at head: 20, then 10 (list becomes 10 -> 20)
        Node n1 = new Node(20);
        n1.next = head;
        head = n1;
        System.out.println("INSERT HEAD: " + head.data);

        Node n2 = new Node(10);
        n2.next = head;
        head = n2;
        System.out.println("INSERT HEAD: " + head.data);

        // 2. Insert at tail: 30 (list becomes 10 -> 20 -> 30)
        Node n3 = new Node(30);
        Node curr = head;
        while (curr.next != null) {
            curr = curr.next;
        }
        curr.next = n3;
        System.out.println("INSERT TAIL: " + n3.data);

        // 3. Traversal
        System.out.print("TRAVERSAL: ");
        curr = head;
        while (curr != null) {
            System.out.print(curr.data + " -> ");
            curr = curr.next;
        }
        System.out.println("NULL");

        // 4. Search for value 20
        int target = 20;
        boolean found = false;
        curr = head;
        int index = 0;
        while (curr != null) {
            if (curr.data == target) {
                found = true;
                break;
            }
            curr = curr.next;
            index++;
        }
        System.out.println("SEARCH: " + target + " found=" + found + " at index " + index);

        // 5. Delete by value: delete 20 (list becomes 10 -> 30)
        int toDelete = 20;
        if (head != null && head.data == toDelete) {
            head = head.next;
        } else {
            curr = head;
            while (curr != null && curr.next != null) {
                if (curr.next.data == toDelete) {
                    curr.next = curr.next.next;
                    break;
                }
                curr = curr.next;
            }
        }
        System.out.println("DELETED: " + toDelete);

        // 6. Reverse the list: (10 -> 30 becomes 30 -> 10)
        Node prev = null;
        curr = head;
        while (curr != null) {
            Node nextNode = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextNode;
        }
        head = prev;

        System.out.print("REVERSED: ");
        curr = head;
        while (curr != null) {
            System.out.print(curr.data + " -> ");
            curr = curr.next;
        }
        System.out.println("NULL");
        System.out.println("Linked list operations completed successfully.");
    }
}
