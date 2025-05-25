/**
 * Benchmark Swarm: Runs a single honeycomb task across all runtime environments
 * Measures and compares performance metrics to determine optimal execution environment
 */

import { runComb } from "../queen/deploy.ts";
import { recordMetrics, summarizeResults } from "./metrics.ts";
import { listCombs, formatDuration, parseMemory } from "../layers/utils.ts";
import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

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
 * @param options Benchmark options
 */
export async function runBenchmark(comb: string, options: Record<string, unknown> = {}): Promise<void> {
  console.log(`\n🍯 HONEY BENCHMARK SWARM 🐝`);
  console.log(`Running benchmark for comb: ${comb}\n`);
  
  // Filter runners if specified
  const runners = options.runner ? [options.runner as string] : RUNNERS;
  
  // Filter locations if specified
  const locations = options.location ? [options.location as string] : LOCATIONS;
  
  const results: Record<string, unknown>[] = [];
  
  // Run the comb in each environment
  for (const runner of runners) {
    for (const location of locations) {
      console.log(`\n[ RUNNING ] ${runner.toUpperCase()} @ ${location}`);
      
      try {
        // Run the comb
        const result = await runComb({ 
          comb, 
          runner, 
          location,
          params: options.params as Record<string, unknown> || {}
        });
        
        // Record metrics
        await recordMetrics(result);
        
        // Add to results
        results.push(result);
        
        // Log success
        console.log(`[ SUCCESS ] ${runner}@${location} - ${formatDuration(result.exec_time_ms as number)}`);
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
    
    // Sort by memory usage if available
    const memoryResults = successfulResults.filter(r => {
      const mem = r.memory_usage as string;
      return mem && mem !== "N/A" && parseMemory(mem) !== null;
    });
    
    let mostMemoryEfficient = null;
    if (memoryResults.length > 0) {
      memoryResults.sort((a, b) => {
        const memA = parseMemory(a.memory_usage as string) || 0;
        const memB = parseMemory(b.memory_usage as string) || 0;
        return memA - memB;
      });
      mostMemoryEfficient = memoryResults[0];
    }
    
    console.log(`\n🏆 RECOMMENDED ENVIRONMENT: ${fastest.runner}@${fastest.location}`);
    console.log(`   Boot Time: ${formatDuration(fastest.boot_time_ms as number)}`);
    console.log(`   Exec Time: ${formatDuration(fastest.exec_time_ms as number)}`);
    console.log(`   Memory: ${fastest.memory_usage}`);
    console.log(`   CPU: ${fastest.cpu_usage}`);
    
    if (mostMemoryEfficient && mostMemoryEfficient !== fastest) {
      console.log(`\n💾 MOST MEMORY-EFFICIENT: ${mostMemoryEfficient.runner}@${mostMemoryEfficient.location}`);
      console.log(`   Memory: ${mostMemoryEfficient.memory_usage}`);
    }
  } else {
    console.log(`\n❌ No successful executions. Please check the logs for errors.`);
  }
}

/**
 * List all available combs
 */
export async function listAvailableCombs(): Promise<void> {
  const combs = await listCombs();
  
  console.log("\n🍯 Available Combs:");
  
  if (combs.length === 0) {
    console.log("No combs found.");
    return;
  }
  
  for (const comb of combs) {
    console.log(`- ${comb}`);
  }
  
  console.log("\nRun a benchmark with: deno run --allow-all bench/index.ts <comb-name>");
}

// Run the benchmark if this file is executed directly
if (import.meta.main) {
  // Parse command line arguments
  const args = parse(Deno.args, {
    string: ["runner", "location"],
    boolean: ["list"],
    default: { list: false }
  });
  
  // List available combs if requested
  if (args.list) {
    await listAvailableCombs();
    Deno.exit(0);
  }
  
  // Get comb from command line args if provided
  const comb = args._[0] ? String(args._[0]) : "build-static-site";
  
  // Extract options
  const options: Record<string, unknown> = {};
  if (args.runner) options.runner = args.runner;
  if (args.location) options.location = args.location;
  
  // Run the benchmark
  await runBenchmark(comb, options);
}
