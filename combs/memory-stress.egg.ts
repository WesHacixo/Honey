/**
 * Memory stress test comb for Honey Benchmark Swarm
 * Tests memory allocation and garbage collection performance
 */

import { sanitizeForLogging } from '../layers/security.ts';

export async function main(
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const arraySize = (params.arraySize as number) || 1000000; // 1M elements
  const iterations = (params.iterations as number) || 10;
  const objectSize = (params.objectSize as number) || 100; // Properties per object

  // Input validation for security and performance
  if (arraySize < 1 || arraySize > 10000000) {
    throw new Error('Array size must be between 1 and 10,000,000');
  }
  if (iterations < 1 || iterations > 100) {
    throw new Error('Iterations must be between 1 and 100');
  }
  if (objectSize < 1 || objectSize > 1000) {
    throw new Error('Object size must be between 1 and 1000 properties');
  }

  console.log(
    `🧠 Memory stress test: ${sanitizeForLogging(arraySize)} objects, ${
      sanitizeForLogging(iterations)
    } iterations`,
  );

  const startTime = performance.now();
  let totalAllocated = 0;
  let peakMemory = 0;

  // Type definition for performance.memory (Chrome-specific)
  interface PerformanceMemory {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }

  interface ExtendedPerformance extends Performance {
    memory?: PerformanceMemory;
  }

  // Track memory usage if available
  const getMemoryUsage = () => {
    try {
      return (performance as ExtendedPerformance).memory?.usedJSHeapSize || 0;
    } catch {
      return 0;
    }
  };

  const initialMemory = getMemoryUsage();

  for (let iteration = 0; iteration < iterations; iteration++) {
    console.log(
      `📊 Iteration ${sanitizeForLogging(iteration + 1)}/${
        sanitizeForLogging(iterations)
      }`,
    );

    // Create large array of objects
    const largeArray: Record<string, unknown>[] = [];

    for (let i = 0; i < arraySize; i++) {
      const obj: Record<string, unknown> = {};

      // Fill object with properties
      for (let j = 0; j < objectSize; j++) {
        obj[`prop_${j}`] = `value_${i}_${j}`;
      }

      largeArray.push(obj);
    }

    totalAllocated += arraySize * objectSize;

    // Check memory usage
    const currentMemory = getMemoryUsage();
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }

    // Perform some operations on the array
    const filtered = largeArray.filter((_, index) => index % 2 === 0);
    const _mapped = filtered.map((obj) => ({ ...obj, processed: true }));

    // Force garbage collection opportunity
    largeArray.length = 0;

    // Small delay to allow GC
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const finalMemory = getMemoryUsage();

  console.log(
    `✅ Completed memory stress test in ${
      sanitizeForLogging(totalTime.toFixed(2))
    }ms`,
  );
  console.log(
    `📈 Peak memory usage: ${
      sanitizeForLogging((peakMemory / 1024 / 1024).toFixed(2))
    }MB`,
  );
  console.log(
    `🗑️ Memory after cleanup: ${
      sanitizeForLogging((finalMemory / 1024 / 1024).toFixed(2))
    }MB`,
  );

  return {
    success: true,
    arraySize,
    iterations,
    objectSize,
    totalTime,
    totalObjectsCreated: totalAllocated,
    memoryStats: {
      initial: initialMemory,
      peak: peakMemory,
      final: finalMemory,
      allocated: peakMemory - initialMemory,
      cleaned: peakMemory - finalMemory,
    },
    performance: {
      objectsPerSecond: (totalAllocated / totalTime) * 1000,
      memoryThroughput:
        ((peakMemory - initialMemory) / 1024 / 1024 / totalTime) * 1000, // MB/s
    },
    metrics: {
      cpuIntensive: false,
      memoryUsage: 'high',
      ioUsage: 'none',
      gcPressure: 'high',
    },
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main({ arraySize: 100000, iterations: 5 });
  console.log(JSON.stringify(result, null, 2));
}
