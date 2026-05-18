"""
Unit tests for analyze_offline() in ml-service/app.py
Run from ml-service/ directory:
    pytest tests/ -v
"""
import sys
import os

# Allow importing app.py from the parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import analyze_offline


# ──────────────────────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────────────────────
def analyze(code):
    """Thin wrapper so tests stay readable."""
    return analyze_offline(code)


# ══════════════════════════════════════════════════════════════════════════════
# 1. Constant Time — no loops, no recursion
# ══════════════════════════════════════════════════════════════════════════════
def test_constant_time():
    code = """
def add(a, b):
    return a + b
"""
    result = analyze(code)
    assert result["time"] == "O(1)", f"Expected O(1), got {result['time']}"
    assert result["space"] == "O(1)", f"Expected O(1), got {result['space']}"


# ══════════════════════════════════════════════════════════════════════════════
# 2. Linear Time — single for loop (linear search)
# ══════════════════════════════════════════════════════════════════════════════
def test_linear_single_loop():
    code = """
def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
"""
    result = analyze(code)
    assert result["time"] == "O(n)", f"Expected O(n), got {result['time']}"
    assert result["space"] == "O(1)", f"Expected O(1), got {result['space']}"


# ══════════════════════════════════════════════════════════════════════════════
# 3. Quadratic Time — nested for loops (bubble sort)
# ══════════════════════════════════════════════════════════════════════════════
def test_quadratic_nested_loops():
    code = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
"""
    result = analyze(code)
    assert result["time"] == "O(n²)", f"Expected O(n²), got {result['time']}"
    assert result["space"] == "O(1)", f"Expected O(1), got {result['space']}"


# ══════════════════════════════════════════════════════════════════════════════
# 4. Logarithmic Time — binary search with halving
# ══════════════════════════════════════════════════════════════════════════════
def test_logarithmic_binary_search():
    code = """
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
"""
    result = analyze(code)
    assert result["time"] == "O(log n)", f"Expected O(log n), got {result['time']}"
    assert result["space"] == "O(1)", f"Expected O(1), got {result['space']}"


# ══════════════════════════════════════════════════════════════════════════════
# 5. O(n log n) — built-in sort call
# ══════════════════════════════════════════════════════════════════════════════
def test_builtin_sort():
    code = """
def find_median(arr):
    arr.sort()
    n = len(arr)
    return arr[n // 2]
"""
    result = analyze(code)
    assert result["time"] == "O(n log n)", f"Expected O(n log n), got {result['time']}"
    # Check suggestion mentions sort
    all_text = " ".join(result["suggestions"]).lower()
    assert "sort" in all_text, "Expected a suggestion about sorting"


# ══════════════════════════════════════════════════════════════════════════════
# 6. Linear Recursion — factorial (single self-call)
# ══════════════════════════════════════════════════════════════════════════════
def test_linear_recursion():
    code = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
"""
    result = analyze(code)
    assert result["time"] == "O(n)", f"Expected O(n), got {result['time']}"
    assert result["space"] == "O(n)", f"Expected O(n), got {result['space']}"
    # Should suggest base case / stack depth
    all_text = " ".join(result["suggestions"]).lower()
    assert "recursion" in all_text or "base case" in all_text or "stack" in all_text


# ══════════════════════════════════════════════════════════════════════════════
# 7. Exponential Recursion — Fibonacci (two self-calls)
# ══════════════════════════════════════════════════════════════════════════════
def test_exponential_recursion():
    code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
"""
    result = analyze(code)
    assert result["time"] == "O(2^n)", f"Expected O(2^n), got {result['time']}"
    # Should warn about exponential recursion
    all_text = " ".join(result["warnings"]).lower()
    assert "exponential" in all_text or "recursion" in all_text or "memoization" in all_text or "dp" in all_text


# ══════════════════════════════════════════════════════════════════════════════
# 8. HashMap Space — two-sum using dict
# ══════════════════════════════════════════════════════════════════════════════
def test_hashmap_space():
    code = """
def two_sum(nums, target):
    seen = dict()
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""
    result = analyze(code)
    assert result["space"] == "O(n)", f"Expected O(n), got {result['space']}"
    # Should mention HashMap tradeoff
    all_text = " ".join(result["suggestions"]).lower()
    assert "hashmap" in all_text or "hash" in all_text or "memory" in all_text or "lookup" in all_text


# ══════════════════════════════════════════════════════════════════════════════
# 9. String Concat Warning — += on string inside loop
# ══════════════════════════════════════════════════════════════════════════════
def test_string_concat_warning():
    code = """
def build_string(words):
    result = ""
    for word in words:
        result += word
    return result
"""
    result = analyze(code)
    warning_text = " ".join(result["warnings"]).lower()
    assert "concat" in warning_text or "join" in warning_text or "string" in warning_text, \
        f"Expected string concat warning, got warnings: {result['warnings']}"


# ══════════════════════════════════════════════════════════════════════════════
# 10. Deep Nesting Warning — triple nested loop
# ══════════════════════════════════════════════════════════════════════════════
def test_deep_nesting_warning():
    code = """
def triple_loop(arr):
    n = len(arr)
    count = 0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                count += arr[i] + arr[j] + arr[k]
    return count
"""
    result = analyze(code)
    assert "n^3" in result["time"] or "n^" in result["time"], \
        f"Expected O(n^3), got {result['time']}"
    warning_text = " ".join(result["warnings"]).lower()
    assert "nesting" in warning_text or "nested" in warning_text or "complexity" in warning_text


# ══════════════════════════════════════════════════════════════════════════════
# 11. Short Code Warning
# ══════════════════════════════════════════════════════════════════════════════
def test_short_code_warning():
    code = "x = 1"
    result = analyze(code)
    warning_text = " ".join(result["warnings"]).lower()
    assert "short" in warning_text or "snippet" in warning_text or "incomplete" in warning_text, \
        f"Expected short code warning, got warnings: {result['warnings']}"


# ══════════════════════════════════════════════════════════════════════════════
# 12. Java Syntax — nested loops with curly braces
# ══════════════════════════════════════════════════════════════════════════════
def test_java_nested_loops():
    code = """
public int[] twoSum(int[] nums, int target) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                return new int[]{i, j};
            }
        }
    }
    return new int[]{};
}
"""
    result = analyze(code)
    assert result["time"] == "O(n²)", f"Expected O(n²), got {result['time']}"
