public class StackDemo {
    public static void main(String[] args) {
        int capacity = 5;
        int[] stack = new int[capacity];
        int top = -1;

        // 1. Initial underflow check
        if (top == -1) {
            System.out.println("Underflow: Stack is empty");
        }

        // 2. Push elements
        top++;
        stack[top] = 10;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        top++;
        stack[top] = 20;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        top++;
        stack[top] = 30;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        // 3. Peek top element
        int peeked = stack[top];
        System.out.println("PEEK: " + peeked + " (top=" + top + ")");

        // 4. Pop element
        int popped1 = stack[top];
        top--;
        System.out.println("POP: " + popped1 + " (top=" + top + ")");

        // 5. Push negative and duplicate
        top++;
        stack[top] = -42;
        System.out.println("PUSH: " + stack[top] + " (top=" + top + ")");

        // 6. Pop remaining elements until empty
        while (top >= 0) {
            int val = stack[top];
            top--;
            System.out.println("POP: " + val + " (top=" + top + ")");
        }

        System.out.println("Stack operations completed successfully.");
    }
}
