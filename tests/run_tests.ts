#!/usr/bin/env deno run --allow-read --allow-write --allow-net --allow-run

/**
 * Main test runner for Honey Benchmark Swarm
 * Runs all test suites and reports results
 */

import { testRunner } from "./test_runner.ts";
import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  boolean: ["integration", "unit", "all"],
  default: { integration: false, unit: false, all: true }
});

console.log("🧪 Running Honey Benchmark Swarm Test Suite\n");

// Determine which tests to run
const runUnit = args.unit || args.all;
const runIntegration = args.integration || args.all;

if (runUnit) {
  console.log("📋 Running unit tests...\n");

  // Import unit test files
  await import("./security.test.ts");
  await import("./errors.test.ts");
  await import("./utils.test.ts");
}

if (runIntegration) {
  console.log("🔗 Running integration tests...\n");
  console.log("⚠️  Integration tests require Docker to be running\n");

  try {
    // Check if Docker is available
    const dockerCheck = new Deno.Command("docker", {
      args: ["--version"],
      stdout: "null",
      stderr: "null"
    });

    const { success } = await dockerCheck.output();

    if (success) {
      await import("./integration.test.ts");
    } else {
      console.log("⚠️  Docker not available, skipping integration tests");
    }
  } catch {
    console.log("⚠️  Docker not available, skipping integration tests");
  }
}

// Print results and exit
testRunner.printResults();
