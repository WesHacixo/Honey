/**
 * Fibonacci calculation comb
 * Tests CPU-intensive mathematical operations
 */

import { sanitizeForLogging } from '../layers/security.ts';

export function main(
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  const n = (params.n as number) || 35;
  const iterations = (params.iterations as number) || 1;

  // Input validation for security and performance
  if (n < 0 || n > 45) {
    throw new Error(
      'Fibonacci input must be between 0 and 45 for performance reasons',
    );
  }
  if (iterations < 1 || iterations > 100) {
    throw new Error('Iterations must be between 1 and 100');
  }

  console.log(
    `🔢 Calculating Fibonacci(${sanitizeForLogging(n)}) ${
      sanitizeForLogging(iterations)
    } time(s)`,
  );

  const startTime = performance.now();
  const results: number[] = [];

  // Calculate Fibonacci sequence
  // Note: Intentionally using recursive implementation for CPU load testing
  function fibonacci(num: number): number {
    if (num <= 1) return num;
    return fibonacci(num - 1) + fibonacci(num - 2);
  }

  // Run multiple iterations
  for (let i = 0; i < iterations; i++) {
    const result = fibonacci(n);
    results.push(result);
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;

  console.log(
    `✅ Completed ${sanitizeForLogging(iterations)} iterations in ${
      sanitizeForLogging(totalTime.toFixed(2))
    }ms`,
  );
  console.log(
    `📊 Average time per calculation: ${
      sanitizeForLogging(avgTime.toFixed(2))
    }ms`,
  );
  console.log(
    `🎯 Fibonacci(${sanitizeForLogging(n)}) = ${
      sanitizeForLogging(results[0])
    }`,
  );

  return {
    success: true,
    input: n,
    iterations,
    results: results.slice(0, 5), // Only return first 5 results to avoid large output
    totalTime,
    averageTime: avgTime,
    operationsPerSecond: 1000 / avgTime,
    metrics: {
      cpuIntensive: true,
      memoryUsage: 'low',
      ioUsage: 'none',
    },
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main({ n: 30, iterations: 3 });
  console.log(JSON.stringify(result, null, 2));
}
