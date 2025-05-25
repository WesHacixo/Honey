/**
 * Unit tests for utilities module
 */

import { Assert, describe } from "./test_runner.ts";
import {
  ensureDirectory,
  formatDuration,
  formatMemory,
  generateContextId,
  getFileExtension,
  isValidUrl,
  parseMemory,
  sanitizeFilename,
  sleep,
} from "../layers/utils.ts";

await describe("Utilities Module", {
  "formatDuration should format milliseconds correctly": () => {
    Assert.equals(formatDuration(0), "0ms");
    Assert.equals(formatDuration(500), "500ms");
    Assert.equals(formatDuration(1000), "1.00s");
    Assert.equals(formatDuration(1500), "1.50s");
    Assert.equals(formatDuration(60000), "1.00m");
    Assert.equals(formatDuration(90000), "1.50m");
    Assert.equals(formatDuration(3600000), "1.00h");
  },

  "formatDuration should handle edge cases": () => {
    Assert.equals(formatDuration(-100), "0ms");
    Assert.equals(formatDuration(0.5), "1ms"); // Should round up
  },

  "parseMemory should parse memory strings correctly": () => {
    Assert.equals(parseMemory("100B"), 100);
    Assert.equals(parseMemory("1KB"), 1024);
    Assert.equals(parseMemory("1MB"), 1024 * 1024);
    Assert.equals(parseMemory("1GB"), 1024 * 1024 * 1024);
    Assert.equals(parseMemory("2.5MB"), 2.5 * 1024 * 1024);
  },

  "parseMemory should handle invalid inputs": () => {
    Assert.equals(parseMemory("invalid"), null);
    Assert.equals(parseMemory(""), null);
    Assert.equals(parseMemory("100"), null); // No unit
    Assert.equals(parseMemory("TB"), null); // No number
  },

  "formatMemory should format bytes correctly": () => {
    Assert.equals(formatMemory(100), "100B");
    Assert.equals(formatMemory(1024), "1.00KB");
    Assert.equals(formatMemory(1536), "1.50KB");
    Assert.equals(formatMemory(1024 * 1024), "1.00MB");
    Assert.equals(formatMemory(1024 * 1024 * 1024), "1.00GB");
  },

  "formatMemory should handle edge cases": () => {
    Assert.equals(formatMemory(0), "0B");
    Assert.equals(formatMemory(-100), "0B");
  },

  "generateContextId should generate valid UUIDs": () => {
    const id1 = generateContextId();
    const id2 = generateContextId();

    // Should be different
    Assert.notEquals(id1, id2);

    // Should match UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    Assert.match(id1, uuidRegex);
    Assert.match(id2, uuidRegex);
  },

  "sleep should delay execution": async () => {
    const start = performance.now();
    await sleep(50);
    const end = performance.now();
    const duration = end - start;

    // Should be at least 50ms (with some tolerance for timing)
    Assert.true(duration >= 45);
  },

  "isValidUrl should validate URLs correctly": () => {
    Assert.true(isValidUrl("https://example.com"));
    Assert.true(isValidUrl("http://localhost:3000"));
    Assert.true(isValidUrl("https://api.example.com/v1/endpoint"));

    Assert.false(isValidUrl("not-a-url"));
    Assert.false(isValidUrl(""));
    Assert.false(isValidUrl("ftp://example.com")); // Only http/https allowed
  },

  "sanitizeFilename should clean filenames": () => {
    Assert.equals(sanitizeFilename("normal-file.txt"), "normal-file.txt");
    Assert.equals(sanitizeFilename("file with spaces.txt"), "file_with_spaces.txt");
    Assert.equals(sanitizeFilename("file/with/slashes.txt"), "file_with_slashes.txt");
    Assert.equals(sanitizeFilename('file<>:"|?*.txt'), "file_________.txt");
  },

  "sanitizeFilename should handle edge cases": () => {
    Assert.equals(sanitizeFilename(""), "unnamed");
    Assert.equals(sanitizeFilename("..."), "unnamed");
    Assert.equals(sanitizeFilename("a".repeat(300)), "a".repeat(255)); // Truncate long names
  },

  "getFileExtension should extract extensions correctly": () => {
    Assert.equals(getFileExtension("file.txt"), ".txt");
    Assert.equals(getFileExtension("file.egg.ts"), ".ts");
    Assert.equals(getFileExtension("path/to/file.json"), ".json");
    Assert.equals(getFileExtension("file"), "");
    Assert.equals(getFileExtension(""), "");
    Assert.equals(getFileExtension(".hidden"), "");
  },

  "ensureDirectory should create directories": async () => {
    const testDir = "./test-temp-dir";

    try {
      // Clean up if exists
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore if doesn't exist
      }

      // Should create directory
      await ensureDirectory(testDir);

      // Should exist now
      const stat = await Deno.stat(testDir);
      Assert.true(stat.isDirectory);

      // Should not throw if directory already exists
      await ensureDirectory(testDir);
    } finally {
      // Clean up
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});
