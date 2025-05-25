/**
 * Unit tests for error handling module
 */

import { Assert, describe } from "./test_runner.ts";
import {
  CombNotFoundError,
  createErrorResult,
  HoneyError,
  ResourceNotAvailableError,
  RunnerExecutionError,
  RunnerNotAvailableError,
  SecurityError,
  TimeoutError,
  ValidationError,
  withRetry,
  withTimeout,
} from "../layers/errors.ts";

await describe("Error Handling Module", {
  "HoneyError should be a proper Error subclass": () => {
    const error = new HoneyError("test message");
    Assert.true(error instanceof Error);
    Assert.true(error instanceof HoneyError);
    Assert.equals(error.name, "HoneyError");
    Assert.equals(error.message, "test message");
  },

  "CombNotFoundError should format message correctly": () => {
    const error = new CombNotFoundError("test-comb");
    Assert.equals(error.message, "Comb not found: test-comb");
    Assert.equals(error.name, "CombNotFoundError");
  },

  "RunnerNotAvailableError should format message correctly": () => {
    const error = new RunnerNotAvailableError("docker");
    Assert.equals(error.message, "Runner not available: docker");
    Assert.equals(error.name, "RunnerNotAvailableError");
  },

  "RunnerExecutionError should include execution details": () => {
    const error = new RunnerExecutionError("docker", "failed to start", "stdout", "stderr", 1);
    Assert.equals(error.message, "Runner execution failed (docker): failed to start");
    Assert.equals(error.stdout, "stdout");
    Assert.equals(error.stderr, "stderr");
    Assert.equals(error.exitCode, 1);
  },

  "ValidationError should format message correctly": () => {
    const error = new ValidationError("invalid input");
    Assert.equals(error.message, "Validation error: invalid input");
    Assert.equals(error.name, "ValidationError");
  },

  "SecurityError should format message correctly": () => {
    const error = new SecurityError("path traversal detected");
    Assert.equals(error.message, "Security error: path traversal detected");
    Assert.equals(error.name, "SecurityError");
  },

  "TimeoutError should format message correctly": () => {
    const error = new TimeoutError("docker run", 5000);
    Assert.equals(error.message, "Operation timed out after 5000ms: docker run");
    Assert.equals(error.name, "TimeoutError");
  },

  "ResourceNotAvailableError should format message correctly": () => {
    const error = new ResourceNotAvailableError("docker daemon");
    Assert.equals(error.message, "Resource not available: docker daemon");
    Assert.equals(error.name, "ResourceNotAvailableError");
  },

  "createErrorResult should create standardized error object": () => {
    const error = new ValidationError("test error");
    const result = createErrorResult(error, "docker", "local", "test-comb");

    Assert.equals(result.success, false);
    Assert.equals(result.error, "Validation error: test error");
    Assert.equals(result.error_type, "ValidationError");
    Assert.equals(result.runner, "docker");
    Assert.equals(result.location, "local");
    Assert.equals(result.comb, "test-comb");
    Assert.equals(result.boot_time_ms, 0);
    Assert.equals(result.exec_time_ms, 0);
    Assert.true(typeof result.contextId === "string");
    Assert.true(typeof result.timestamp === "string");
  },

  "createErrorResult should handle RunnerExecutionError details": () => {
    const error = new RunnerExecutionError("docker", "failed", "out", "err", 2);
    const result = createErrorResult(error, "docker", "local", "test-comb");

    Assert.equals(result.stdout, "out");
    Assert.equals(result.stderr, "err");
    Assert.equals(result.exit_code, 2);
  },

  "withTimeout should resolve successful operations": async () => {
    const result = await withTimeout(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "success";
      },
      100,
      "test operation",
    );
    Assert.equals(result, "success");
  },

  "withTimeout should throw TimeoutError for slow operations": async () => {
    await Assert.throwsAsync(async () => {
      await withTimeout(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return "success";
        },
        10,
        "test operation",
      );
    });
  },

  "withRetry should succeed on first try": async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts++;
      return "success";
    }, 3);

    Assert.equals(result, "success");
    Assert.equals(attempts, 1);
  },

  "withRetry should retry on failure": async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("temporary failure");
        }
        return "success";
      },
      3,
      1,
    ); // 1ms initial delay for fast testing

    Assert.equals(result, "success");
    Assert.equals(attempts, 3);
  },

  "withRetry should throw after max retries": async () => {
    let attempts = 0;
    await Assert.throwsAsync(async () => {
      await withRetry(
        () => {
          attempts++;
          throw new Error("persistent failure");
        },
        2,
        1,
      ); // 1ms initial delay for fast testing
    });

    Assert.equals(attempts, 3); // Initial attempt + 2 retries
  },
});
