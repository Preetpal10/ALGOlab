public class QueueDemo {
    public static void main(String[] args) {
        int capacity = 5;
        int[] queue = new int[capacity];
        int front = 0;
        int rear = -1;
        int size = 0;

        // 1. Initial underflow check
        if (size == 0) {
            System.out.println("Underflow: Queue is empty");
        }

        // 2. Enqueue elements
        rear++;
        queue[rear] = 10;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        rear++;
        queue[rear] = 20;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        rear++;
        queue[rear] = 30;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (front=" + front + ", rear=" + rear + ", size=" + size + ")");

        // 3. Peek front element without removing
        int peeked = queue[front];
        System.out.println("PEEK: " + peeked + " (front=" + front + ")");

        // 4. Dequeue element (FIFO order)
        int dequeued1 = queue[front];
        front++;
        size--;
        System.out.println("DEQUEUE: " + dequeued1 + " (new front=" + front + ", size=" + size + ")");

        // 5. Enqueue another element at rear
        rear++;
        queue[rear] = 42;
        size++;
        System.out.println("ENQUEUE: " + queue[rear] + " (rear=" + rear + ", size=" + size + ")");

        // 6. Dequeue remaining elements until empty
        while (size > 0) {
            int val = queue[front];
            front++;
            size--;
            System.out.println("DEQUEUE: " + val + " (size=" + size + ")");
        }

        System.out.println("Queue operations completed successfully.");
    }
}
