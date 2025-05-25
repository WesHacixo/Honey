/**
 * Benchmark Swarm: Runs a single honeycomb task across all runtime environments
 * Measures and compares performance metrics to determine optimal execution environment
 */

import { runComb } from "../queen/deploy.ts";
import { recordMetrics, summarizeResults } from "./metrics.ts";
import { 
  validateCombName, 
  sanitizeCombName 
} from "../layers/security.ts";
import { 
  ValidationError, 
  logError 
} from "../layers/errors.ts";
import { 
  createLogger, 
  setLogLevel 
} from "../layers/logging.ts";
import { 
  listCombs, 
  formatDuration, 
  parseMemory 
} from "../layers/utils.ts";
import config from "../layers/config.ts";
import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

// Create a logger for this module
const logger = createLogger("benchmark");

// Set log level from config
setLogLevel(config.logLevel);

// Default comb to benchmark
const DEFAULT_COMB = "build-static-site";

// Available runners (from config)
const RUNNERS = Object.keys(config.runners).filter(
  runner => config.runners[runner as keyof typeof config.runners].enabled
);

// Available locations (from config)
const LOCATIONS = Object.keys(config.locations).filter(
  location => config.locations[location as keyof typeof config.locations].enabled
);

/**
 * Run a benchmark across all environments
 * 
 * @param comb The name of the comb to benchmark
 * @param options Benchmark options
 */
export async function runBenchmark(comb: string, options: Record<string, unknown> = {}): Promise<void> {
  // Validate comb name
  if (!validateCombName(comb)) {
    throw new ValidationError(`Invalid comb name: ${comb}`);
  }
  
  const sanitizedComb = sanitizeCombName(comb);
  
  logger.info(`\n🍯 HONEY BENCHMARK SWARM 🐝`);
  logger.info(`Running benchmark for comb: ${sanitizedComb}\n`);
  
  // Filter runners if specified
  const runners = options.runner ? [options.runner as string] : RUNNERS;
  
  // Filter locations if specified
  const locations = options.location ? [options.location as string] : LOCATIONS;
  
  const results: Record<string, unknown>[] = [];
  
  // Run the comb in each environment
  for (const runner of runners) {
    for (const location of locations) {
      logger.info(`\n[ RUNNING ] ${runner.toUpperCase()} @ ${location}`);
      
      try {
        // Run the comb
        const result = await runComb({ 
          comb: sanitizedComb, 
          runner, 
          location,
          params: options.params as Record<string, unknown> || {}
        });
        
        // Record metrics
        if (config.metrics.enabled) {
          await recordMetrics(result);
        }
        
        // Add to results
        results.push(result);
        
        // Log success or failure
        if (result.success) {
          logger.success(
            `[ SUCCESS ] ${runner}@${location} - ${formatDuration(result.exec_time_ms as number)}`,
            { exec_time_ms: result.exec_time_ms }
          );
        } else {
          logger.error(
            `[ FAILED  ] ${runner}@${location} - ${result.error}`,
            undefined,
            { error: result.error }
          );
        }
      } catch (error) {
        logger.error(`[ FAILED  ] ${runner}@${location}`, error);
        
        // Add failure to results
        results.push({
          comb: sanitizedComb,
          runner,
          location,
          success: false,
          error: error.message,
          error_type: error.name,
          boot_time_ms: 0,
          exec_time_ms: 0,
          contextId: crypto.randomUUID()
        });
      }
    }
  }
  
  // Generate and display summary
  const summary = summarizeResults(results);
  logger.info(`\n${summary}`);
  
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
    
    logger.success(`\n🏆 RECOMMENDED ENVIRONMENT: ${fastest.runner}@${fastest.location}`);
    logger.info(`   Boot Time: ${formatDuration(fastest.boot_time_ms as number)}`);
    logger.info(`   Exec Time: ${formatDuration(fastest.exec_time_ms as number)}`);
    logger.info(`   Memory: ${fastest.memory_usage}`);
    logger.info(`   CPU: ${fastest.cpu_usage}`);
    
    if (mostMemoryEfficient && mostMemoryEfficient !== fastest) {
      logger.info(`\n💾 MOST MEMORY-EFFICIENT: ${mostMemoryEfficient.runner}@${mostMemoryEfficient.location}`);
      logger.info(`   Memory: ${mostMemoryEfficient.memory_usage}`);
    }
  } else {
    logger.error(`\n❌ No successful executions. Please check the logs for errors.`);
  }
}

/**
 * List all available combs
 */
export async function listAvailableCombs(): Promise<void> {
  const combs = await listCombs();
  
  logger.info("\n🍯 Available Combs:");
  
  if (combs.length === 0) {
    logger.info("No combs found.");
    return;
  }
  
  for (const comb of combs) {
    logger.info(`- ${comb}`);
  }
  
  logger.info("\nRun a benchmark with: deno run --allow-all bench/index.ts <comb-name>");
}

// Run the benchmark if this file is executed directly
if (import.meta.main) {
  try {
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
    const comb = args._[0] ? String(args._[0]) : DEFAULT_COMB;
    
    // Extract options
    const options: Record<string, unknown> = {};
    if (args.runner) options.runner = args.runner;
    if (args.location) options.location = args.location;
    
    // Run the benchmark
    await runBenchmark(comb, options);
  } catch (error) {
    logError(error, { component: "benchmark" });
    Deno.exit(1);
  }
}

