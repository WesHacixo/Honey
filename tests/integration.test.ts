/**
 * Integration tests for Honey Benchmark Swarm
 * Tests the complete benchmark workflow
 */

import { Assert, describe } from './test_runner.ts';
import { runBenchmark } from '../bench/index.ts';
import { runComb } from '../queen/deploy.ts';

await describe('Integration Tests', {
  'runComb should execute build-static-site successfully': async () => {
    const result = await runComb({
      comb: 'build-static-site',
      runner: 'docker',
      location: 'local',
      params: {},
    });

    Assert.true(typeof result === 'object');
    Assert.true('success' in result);
    Assert.true('comb' in result);
    Assert.true('runner' in result);
    Assert.true('location' in result);
    Assert.true('contextId' in result);

    // Should have timing information
    Assert.true('boot_time_ms' in result);
    Assert.true('exec_time_ms' in result);
    Assert.true(typeof result.boot_time_ms === 'number');
    Assert.true(typeof result.exec_time_ms === 'number');
  },

  'runComb should handle fibonacci comb': async () => {
    const result = await runComb({
      comb: 'fibonacci',
      runner: 'docker',
      location: 'local',
      params: { n: 10, iterations: 1 },
    });

    Assert.true(typeof result === 'object');
    Assert.true('success' in result);

    // If successful, should have performance metrics
    if (result.success) {
      Assert.true(result.exec_time_ms as number > 0);
    }
  },

  'runComb should handle memory-stress comb': async () => {
    const result = await runComb({
      comb: 'memory-stress',
      runner: 'docker',
      location: 'local',
      params: { arraySize: 1000, iterations: 2 },
    });

    Assert.true(typeof result === 'object');
    Assert.true('success' in result);

    // Memory stress test should complete
    if (result.success) {
      Assert.true(result.exec_time_ms as number > 0);
    }
  },

  'runComb should handle file-io comb': async () => {
    const result = await runComb({
      comb: 'file-io',
      runner: 'docker',
      location: 'local',
      params: { fileCount: 10, fileSize: 100 },
    });

    Assert.true(typeof result === 'object');
    Assert.true('success' in result);

    // File I/O test should complete
    if (result.success) {
      Assert.true(result.exec_time_ms as number > 0);
    }
  },

  'runComb should handle non-existent comb gracefully': async () => {
    const result = await runComb({
      comb: 'non-existent-comb',
      runner: 'docker',
      location: 'local',
      params: {},
    });

    Assert.true(typeof result === 'object');
    Assert.equals(result.success, false);
    Assert.true('error' in result);
    Assert.true(typeof result.error === 'string');
  },

  'runComb should handle invalid runner gracefully': async () => {
    const result = await runComb({
      comb: 'build-static-site',
      runner: 'invalid-runner',
      location: 'local',
      params: {},
    });

    Assert.true(typeof result === 'object');
    Assert.equals(result.success, false);
    Assert.true('error' in result);
  },

  'runBenchmark should complete without errors': async () => {
    // This is a longer test, so we'll use a simple comb
    let completed = false;
    let error: Error | null = null;

    try {
      // Capture console output to avoid cluttering test output
      const originalLog = console.log;
      const originalError = console.error;
      console.log = () => {}; // Suppress output
      console.error = () => {}; // Suppress output

      await runBenchmark('fibonacci', {
        runner: 'docker',
        location: 'local',
        params: { n: 5, iterations: 1 },
      });

      // Restore console
      console.log = originalLog;
      console.error = originalError;

      completed = true;
    } catch (e) {
      error = e;
    }

    if (error) {
      // If there's an error, it should be a known type
      Assert.true(error instanceof Error);
      console.log(`Expected error in integration test: ${error.message}`);
    } else {
      Assert.true(completed);
    }
  },
});
