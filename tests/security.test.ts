/**
 * Unit tests for security module
 */

import { describe, Assert } from "./test_runner.ts";
import {
  validateCombName,
  sanitizeCombName,
  sanitizeForLogging,
  validateFilePath,
  validateContainerName,
  validatePort,
  validateLocation,
  validateRunner
} from "../layers/security.ts";

await describe("Security Module", {
  "validateCombName should accept valid comb names": () => {
    Assert.true(validateCombName("build-static-site"));
    Assert.true(validateCombName("process-data"));
    Assert.true(validateCombName("api-server"));
    Assert.true(validateCombName("train-model"));
    Assert.true(validateCombName("my_comb_123"));
  },

  "validateCombName should reject invalid comb names": () => {
    Assert.false(validateCombName(""));
    Assert.false(validateCombName("../malicious"));
    Assert.false(validateCombName("comb with spaces"));
    Assert.false(validateCombName("comb;with;semicolons"));
    Assert.false(validateCombName("comb\nwith\nnewlines"));
    Assert.false(validateCombName("a".repeat(101))); // Too long
  },

  "sanitizeCombName should clean comb names": () => {
    Assert.equals(sanitizeCombName("build-static-site"), "build-static-site");
    Assert.equals(sanitizeCombName("comb with spaces"), "comb_with_spaces");
    Assert.equals(sanitizeCombName("comb;with;special"), "comb_with_special");
    Assert.equals(sanitizeCombName("../malicious"), "__malicious");
  },

  "sanitizeForLogging should prevent log injection": () => {
    Assert.equals(sanitizeForLogging("normal text"), "normal text");
    Assert.equals(sanitizeForLogging("text\nwith\nnewlines"), "text with newlines");
    Assert.equals(sanitizeForLogging("text\rwith\rcarriage"), "text with carriage");
    Assert.equals(sanitizeForLogging("text\twith\ttabs"), "text with tabs");
    Assert.equals(sanitizeForLogging("text\x00with\x00nulls"), "text with nulls");
  },

  "sanitizeForLogging should handle objects": () => {
    const obj = { key: "value\nwith\nnewlines", nested: { data: "test\tdata" } };
    const result = sanitizeForLogging(obj);
    Assert.true(typeof result === "string");
    Assert.false(result.includes("\n"));
    Assert.false(result.includes("\t"));
  },

  "sanitizeForLogging should handle numbers safely": () => {
    Assert.equals(sanitizeForLogging(42), "42");
    Assert.equals(sanitizeForLogging(3.14159), "3.14159");
    Assert.equals(sanitizeForLogging(-100), "-100");
  },

  "sanitizeForLogging should handle arrays safely": () => {
    const arr = ["item1\nwith\nnewlines", "item2\twith\ttabs"];
    const result = sanitizeForLogging(arr);
    Assert.true(typeof result === "string");
    Assert.false(result.includes("\n"));
    Assert.false(result.includes("\t"));
  },

  "sanitizeForLogging should handle malicious injection attempts": () => {
    // Test various log injection patterns
    const maliciousInputs = [
      "user\n[FAKE] Admin logged in",
      "data\r\n[ERROR] System compromised",
      "value\x1b[31mRed text injection\x1b[0m",
      "input\u0000null byte injection",
      "test\u2028line separator injection"
    ];

    for (const input of maliciousInputs) {
      const sanitized = sanitizeForLogging(input);
      Assert.false(sanitized.includes("\n"));
      Assert.false(sanitized.includes("\r"));
      Assert.false(sanitized.includes("\x1b"));
      Assert.false(sanitized.includes("\x00"));
      Assert.false(sanitized.includes("\u2028"));
    }
  },

  "validateFilePath should accept valid paths": () => {
    Assert.true(validateFilePath("./combs/test.egg.ts"));
    Assert.true(validateFilePath("combs/build-static-site.egg.ts"));
    Assert.true(validateFilePath("layers/utils.ts"));
  },

  "validateFilePath should reject dangerous paths": () => {
    Assert.false(validateFilePath("../../../etc/passwd"));
    Assert.false(validateFilePath("/etc/passwd"));
    Assert.false(validateFilePath(""));
    Assert.false(validateFilePath("path\nwith\nnewlines"));
  },

  "validateContainerName should accept valid names": () => {
    Assert.true(validateContainerName("honey-benchmark-123"));
    Assert.true(validateContainerName("test_container"));
    Assert.true(validateContainerName("my-container"));
  },

  "validateContainerName should reject invalid names": () => {
    Assert.false(validateContainerName(""));
    Assert.false(validateContainerName("Container With Spaces"));
    Assert.false(validateContainerName("container;with;semicolons"));
    Assert.false(validateContainerName("a".repeat(101))); // Too long
  },

  "validatePort should accept valid ports": () => {
    Assert.true(validatePort(80));
    Assert.true(validatePort(443));
    Assert.true(validatePort(3000));
    Assert.true(validatePort(8080));
    Assert.true(validatePort(65535));
  },

  "validatePort should reject invalid ports": () => {
    Assert.false(validatePort(0));
    Assert.false(validatePort(-1));
    Assert.false(validatePort(65536));
    Assert.false(validatePort(99999));
  },

  "validateLocation should accept valid locations": () => {
    Assert.true(validateLocation("local"));
    Assert.true(validateLocation("cloud"));
  },

  "validateLocation should reject invalid locations": () => {
    Assert.false(validateLocation(""));
    Assert.false(validateLocation("invalid"));
    Assert.false(validateLocation("local\ncloud"));
  },

  "validateRunner should accept valid runners": () => {
    Assert.true(validateRunner("docker"));
    Assert.true(validateRunner("firecracker"));
    Assert.true(validateRunner("wasm"));
  },

  "validateRunner should reject invalid runners": () => {
    Assert.false(validateRunner(""));
    Assert.false(validateRunner("invalid"));
    Assert.false(validateRunner("docker\nfirecracker"));
  }
});
