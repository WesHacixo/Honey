/**
 * Tests for Honey Benchmark Swarm
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { runComb } from './queen/deploy.ts';
import * as Docker from './runners/docker.ts';
import * as Firecracker from './runners/firecracker.ts';
import * as Wasm from './runners/wasm.ts';
import { summarizeResults } from './bench/metrics.ts';

// Test the Docker runner
Deno.test('Docker runner', async () => {
  // Skip actual Docker execution in CI environments
  if (Deno.env.get('CI') === 'true') {
    return;
  }

  const result = await Docker.run('test-comb', 'local');

  assertExists(result);
  assertEquals(typeof result.boot_time_ms, 'number');
  assertEquals(typeof result.exec_time_ms, 'number');
  assertEquals(result.runner, 'docker');
  assertEquals(result.location, 'local');
});

// Test the Firecracker runner stub
Deno.test('Firecracker runner stub', async () => {
  const result = await Firecracker.run('test-comb', 'local');

  assertExists(result);
  assertEquals(typeof result.boot_time_ms, 'number');
  assertEquals(typeof result.exec_time_ms, 'number');
  assertEquals(result.runner, 'firecracker');
  assertEquals(result.location, 'local');
});

// Test the WASM runner stub
Deno.test('WASM runner stub', async () => {
  const result = await Wasm.run('test-comb', 'local');

  assertExists(result);
  assertEquals(typeof result.boot_time_ms, 'number');
  assertEquals(typeof result.exec_time_ms, 'number');
  assertEquals(result.runner, 'wasm');
  assertEquals(result.location, 'local');
});

// Test the Queen deploy module
Deno.test('Queen deploy module', async () => {
  // Use WASM runner for faster test execution
  const result = await runComb({
    comb: 'test-comb',
    runner: 'wasm',
    location: 'local',
  });

  assertExists(result);
  assertEquals(result.comb, 'test-comb');
  assertEquals(result.runner, 'wasm');
  assertEquals(result.location, 'local');
  assertExists(result.contextId);
  assertEquals(typeof result.total_time_ms, 'number');
});

// Test the metrics summarizer
Deno.test('Metrics summarizer', () => {
  const results = [
    {
      comb: 'test-comb',
      runner: 'docker',
      location: 'local',
      boot_time_ms: 500,
      exec_time_ms: 1000,
      memory_usage: '100MB',
      cpu_usage: '10%',
      success: true,
    },
    {
      comb: 'test-comb',
      runner: 'wasm',
      location: 'local',
      boot_time_ms: 10,
      exec_time_ms: 500,
      memory_usage: '20MB',
      cpu_usage: '5%',
      success: true,
    },
  ];

  const summary = summarizeResults(results);

  assertExists(summary);
  assertEquals(typeof summary, 'string');
  assertEquals(summary.includes('test-comb'), true);
  assertEquals(summary.includes('docker'), true);
  assertEquals(summary.includes('wasm'), true);
});
