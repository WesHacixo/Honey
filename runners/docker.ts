/**
 * Docker Runner for Honeycomb tasks
 * Executes a comb in a Docker container and measures performance metrics
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { executeComb } from "../layers/utils.ts";
import { 
  validateCombName, 
  sanitizeCombName, 
  generateSecureContainerName,
  validateDockerEnvironment
} from "../layers/security.ts";
import { 
  RunnerExecutionError, 
  RunnerNotAvailableError,
  withTimeout,
  withRetry
} from "../layers/errors.ts";
import { createLogger } from "../layers/logging.ts";
import config from "../layers/config.ts";

// Create a logger for this module
const logger = createLogger("docker-runner");

/**
 * Run a comb in a Docker container
 * 
 * @param comb The name of the comb to run
 * @param location The location to run the comb (local or cloud)
 * @returns Performance metrics and execution results
 * @throws RunnerNotAvailableError if Docker is not available
 * @throws RunnerExecutionError if the execution fails
 */
export async function run(comb: string, location: string): Promise<Record<string, unknown>> {
  // Validate inputs
  if (!validateCombName(comb)) {
    throw new Error(`Invalid comb name: ${comb}`);
  }
  
  const sanitizedComb = sanitizeCombName(comb);
  const start = Date.now();
  const containerName = generateSecureContainerName(sanitizedComb);
  
  logger.info(`Starting Docker container for ${sanitizedComb} in ${location} environment...`);
  
  // Check if Docker is available
  const dockerAvailable = await validateDockerEnvironment();
  
  if (!dockerAvailable) {
    logger.warn(`Docker not available, using direct execution for ${sanitizedComb}`);
    return runDirectly(sanitizedComb, location);
  }
  
  // Measure boot time
  const bootStart = Date.now();
  
  try {
    // Run the container with security options and resource limits
    const result = await withTimeout(
      () => runDockerContainer(containerName, sanitizedComb, location),
      config.runners.docker.timeout,
      `Docker execution of ${sanitizedComb}`
    );
    
    const bootTime = result.bootTime;
    
    // Calculate total execution time
    const execTime = Date.now() - start;
    
    return {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      boot_time_ms: bootTime,
      exec_time_ms: execTime,
      memory_usage: result.memoryUsage,
      cpu_usage: result.cpuUsage,
      runner: "docker",
      location
    };
  } catch (error) {
    logger.error(`Error running ${sanitizedComb} in Docker:`, error);
    
    // Fall back to direct execution
    if (error instanceof RunnerNotAvailableError) {
      return runDirectly(sanitizedComb, location);
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Run a Docker container with the specified comb
 * 
 * @param containerName The name for the Docker container
 * @param comb The name of the comb to run
 * @param location The location to run the comb
 * @returns Result of the Docker execution
 * @throws RunnerExecutionError if the execution fails
 */
async function runDockerContainer(
  containerName: string,
  comb: string,
  location: string
): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
  bootTime: number;
  memoryUsage: string;
  cpuUsage: string;
}> {
  const bootStart = Date.now();
  
  try {
    // Run the container with security options and resource limits
    const proc = Deno.run({
      cmd: [
        "docker", "run", 
        "--name", containerName, 
        "--rm",
        // Security options
        "--security-opt", "no-new-privileges",
        // Resource limits
        "--memory", config.runners.docker.resourceLimits.memory,
        "--cpus", config.runners.docker.resourceLimits.cpus,
        // Mount the combs directory
        "-v", `${Deno.cwd()}/combs:/combs:ro`,
        // Use the configured image
        config.runners.docker.image, 
        "sh", "-c", 
        `cd /combs && deno run --allow-read --allow-net --allow-env ${comb}.egg.ts`
      ],
      stdout: "piped",
      stderr: "piped"
    });
    
    const bootTime = Date.now() - bootStart;
    
    // Get container stats for resource usage
    const statsProc = Deno.run({
      cmd: ["docker", "stats", containerName, "--no-stream", "--format", "{{.MemUsage}}|{{.CPUPerc}}"],
      stdout: "piped",
      stderr: "piped"
    });
    
    // Wait for the main process to complete
    const [stdout, stderr, status] = await Promise.all([
      proc.output(),
      proc.stderrOutput(),
      proc.status()
    ]);
    
    // Get the stats output
    const statsOutput = await statsProc.output();
    const statsText = new TextDecoder().decode(statsOutput).trim();
    
    // Parse memory and CPU usage
    let memoryUsage = "N/A";
    let cpuUsage = "N/A";
    
    if (statsText) {
      const [mem, cpu] = statsText.split("|");
      memoryUsage = mem;
      cpuUsage = cpu;
    }
    
    // Clean up
    proc.close();
    statsProc.close();
    
    // Check for execution errors
    if (!status.success) {
      const stdoutText = new TextDecoder().decode(stdout);
      const stderrText = new TextDecoder().decode(stderr);
      
      throw new RunnerExecutionError(
        "docker",
        `Container exited with code ${status.code}`,
        stdoutText,
        stderrText,
        status.code
      );
    }
    
    return {
      success: status.success,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      bootTime,
      memoryUsage,
      cpuUsage
    };
  } catch (error) {
    // Clean up the container if it's still running
    try {
      const cleanup = Deno.run({
        cmd: ["docker", "rm", "-f", containerName],
        stdout: "piped",
        stderr: "piped"
      });
      await cleanup.status();
      cleanup.close();
    } catch (cleanupError) {
      logger.debug(`Error cleaning up container ${containerName}:`, { error: cleanupError });
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Run a comb directly in the current Deno process
 * Used when Docker is not available
 * 
 * @param comb The name of the comb to run
 * @param location The location to run the comb (local or cloud)
 * @returns Performance metrics and execution results
 */
async function runDirectly(comb: string, location: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  
  logger.info(`[DIRECT] Running ${comb} directly in Deno (${location})...`);
  
  // No real boot time for direct execution
  const bootTime = 0;
  
  try {
    // Execute the comb directly
    const result = await executeComb(comb, { location });
    
    // Calculate total execution time
    const execTime = Date.now() - start;
    
    // We don't have real resource usage metrics for direct execution
    const memoryUsage = "N/A";
    const cpuUsage = "N/A";
    
    return {
      success: result !== null,
      stdout: result ? JSON.stringify(result, null, 2) : "",
      stderr: result ? "" : "Failed to execute comb",
      boot_time_ms: bootTime,
      exec_time_ms: execTime,
      memory_usage: memoryUsage,
      cpu_usage: cpuUsage,
      runner: "docker",
      location,
      direct: true,
      result
    };
  } catch (error) {
    logger.error(`Error running ${comb} directly:`, error);
    
    // Calculate total execution time
    const execTime = Date.now() - start;
    
    return {
      success: false,
      stdout: "",
      stderr: error.toString(),
      boot_time_ms: bootTime,
      exec_time_ms: execTime,
      memory_usage: "N/A",
      cpu_usage: "N/A",
      runner: "docker",
      location,
      direct: true
    };
  }
}

