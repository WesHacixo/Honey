/**
 * Benchmark Swarm: Runs a single honeycomb task across all runtime environments
 * Measures and compares performance metrics to determine optimal execution environment
 */

import { runComb } from "../queen/deploy.ts";
import { recordMetrics, summarizeResults } from "./metrics.ts";

// Default comb to benchmark
const DEFAULT_COMB = "build-static-site";

// Available runners
const RUNNERS = ["docker", "firecracker", "wasm"];

// Available locations
const LOCATIONS = ["local", "cloud"];

/**
 * Run a benchmark across all environments
 * 
 * @param comb The name of the comb to benchmark
 */
export async function runBenchmark(comb = DEFAULT_COMB): Promise<void> {
  console.log(`\n🍯 HONEY BENCHMARK SWARM 🐝`);
  console.log(`Running benchmark for comb: ${comb}\n`);
  
  const results: Record<string, unknown>[] = [];
  
  // Run the comb in each environment
  for (const runner of RUNNERS) {
    for (const location of LOCATIONS) {
      console.log(`\n[ RUNNING ] ${runner.toUpperCase()} @ ${location}`);
      
      try {
        // Run the comb
        const result = await runComb({ comb, runner, location });
        
        // Record metrics
        await recordMetrics(result);
        
        // Add to results
        results.push(result);
        
        // Log success
        console.log(`[ SUCCESS ] ${runner}@${location} - ${result.exec_time_ms}ms`);
      } catch (error) {
        console.error(`[ FAILED  ] ${runner}@${location}`, error);
        
        // Add failure to results
        results.push({
          comb,
          runner,
          location,
          success: false,
          error: error.message,
          boot_time_ms: 0,
          exec_time_ms: 0,
          contextId: crypto.randomUUID()
        });
      }
    }
  }
  
  // Generate and display summary
  const summary = summarizeResults(results);
  console.log(`\n${summary}`);
  
  // Determine the best environment
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    // Sort by execution time
    successfulResults.sort((a, b) => (a.exec_time_ms as number) - (b.exec_time_ms as number));
    const fastest = successfulResults[0];
    
    console.log(`\n🏆 RECOMMENDED ENVIRONMENT: ${fastest.runner}@${fastest.location}`);
    console.log(`   Boot Time: ${fastest.boot_time_ms}ms`);
    console.log(`   Exec Time: ${fastest.exec_time_ms}ms`);
    console.log(`   Memory: ${fastest.memory_usage}`);
    console.log(`   CPU: ${fastest.cpu_usage}`);
  } else {
    console.log(`\n❌ No successful executions. Please check the logs for errors.`);
  }
}

// Run the benchmark if this file is executed directly
if (import.meta.main) {
  // Get comb from command line args if provided
  const comb = Deno.args[0] || DEFAULT_COMB;
  await runBenchmark(comb);
}

