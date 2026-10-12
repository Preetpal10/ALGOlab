public class LinearSearch {
    public static void main(String[] args) {
        int[] arr = { 10, 20, 30, 40, 50 };
        int target = 30;
        int foundIndex = -1;

        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found target at index: " + foundIndex);
        } else {
            System.out.println("Target not found in array");
        }
    }
}
