/**
 * Test runner for Honey Benchmark Swarm
 * Provides utilities for running tests and assertions
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

/**
 * Simple assertion utilities
 */
export class Assert {
  static equals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  static notEquals<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} to not equal ${expected}`);
    }
  }

  static true(value: boolean, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected true, but got ${value}`);
    }
  }

  static false(value: boolean, message?: string): void {
    if (value) {
      throw new Error(message || `Expected false, but got ${value}`);
    }
  }

  static throws(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message || "Expected function to throw, but it didn't");
    } catch (_error) {
      // Expected behavior
    }
  }

  static async throwsAsync(fn: () => Promise<void>, message?: string): Promise<void> {
    try {
      await fn();
      throw new Error(message || "Expected async function to throw, but it didn't");
    } catch (_error) {
      // Expected behavior
    }
  }

  static contains<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to contain ${item}`);
    }
  }

  static notContains<T>(array: T[], item: T, message?: string): void {
    if (array.includes(item)) {
      throw new Error(message || `Expected array to not contain ${item}`);
    }
  }

  static match(value: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(value)) {
      throw new Error(message || `Expected "${value}" to match pattern ${pattern}`);
    }
  }
}

/**
 * Test runner class
 */
export class TestRunner {
  private suites: Map<string, TestSuite> = new Map();

  /**
   * Run a test function
   */
  async runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const startTime = performance.now();

    try {
      await testFn();
      const duration = performance.now() - startTime;
      return {
        name,
        passed: true,
        duration,
      };
    } catch (_error) {
      const duration = performance.now() - startTime;
      return {
        name,
        passed: false,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Run a test suite
   */
  async runSuite(
    suiteName: string,
    tests: Record<string, () => Promise<void> | void>,
  ): Promise<TestSuite> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    for (const [testName, testFn] of Object.entries(tests)) {
      const result = await this.runTest(testName, testFn);
      results.push(result);
    }

    const duration = performance.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    const suite: TestSuite = {
      name: suiteName,
      tests: results,
      passed,
      failed,
      duration,
    };

    this.suites.set(suiteName, suite);
    return suite;
  }

  /**
   * Print test results
   */
  printResults(): void {
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    console.log("\n🧪 Test Results\n");

    for (const suite of this.suites.values()) {
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.duration;

      const status = suite.failed === 0 ? "✅" : "❌";
      console.log(
        `${status} ${suite.name} (${suite.passed}/${suite.tests.length} passed, ${
          suite.duration.toFixed(2)
        }ms)`,
      );

      for (const test of suite.tests) {
        const testStatus = test.passed ? "  ✓" : "  ✗";
        console.log(`${testStatus} ${test.name} (${test.duration.toFixed(2)}ms)`);

        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error}`);
        }
      }
      console.log();
    }

    console.log(
      `📊 Summary: ${totalPassed} passed, ${totalFailed} failed (${
        totalDuration.toFixed(2)
      }ms total)`,
    );

    if (totalFailed > 0) {
      Deno.exit(1);
    }
  }

  /**
   * Get all test results
   */
  getResults(): TestSuite[] {
    return Array.from(this.suites.values());
  }
}

// Global test runner instance
export const testRunner = new TestRunner();

/**
 * Helper function to define a test suite
 */
export function describe(suiteName: string, tests: Record<string, () => Promise<void> | void>) {
  return testRunner.runSuite(suiteName, tests);
}

/**
 * Helper function for setup/teardown
 */
export async function beforeEach(fn: () => Promise<void> | void): Promise<void> {
  await fn();
}

export async function afterEach(fn: () => Promise<void> | void): Promise<void> {
  await fn();
}
