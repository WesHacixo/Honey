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
  validateDockerEnvironment,
  sanitizeForLogging
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
    throw new Error(`Invalid comb name: ${sanitizeForLogging(comb)}`);
  }

  const sanitizedComb = sanitizeCombName(comb);
  const sanitizedLocation = sanitizeForLogging(location);
  const start = Date.now();
  const containerName = generateSecureContainerName(sanitizedComb);

  logger.info(`Starting Docker container for ${sanitizeForLogging(sanitizedComb)} in ${sanitizedLocation} environment...`);

  // Check if Docker is available
  const dockerAvailable = await validateDockerEnvironment();

  if (!dockerAvailable) {
    logger.warn(`Docker not available, using direct execution for ${sanitizeForLogging(sanitizedComb)}`);
    return runDirectly(sanitizedComb, location);
  }

  // Measure boot time
  const bootStart = Date.now();

  try {
    // Run the container with security options and resource limits
    const result = await withTimeout(
      () => runDockerContainer(containerName, sanitizedComb, location),
      config.runners.docker.timeout,
      `Docker execution of ${sanitizeForLogging(sanitizedComb)}`
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
    logger.error(`Error running ${sanitizeForLogging(sanitizedComb)} in Docker:`, error);

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
  const sanitizedComb = sanitizeForLogging(comb);
  const sanitizedLocation = sanitizeForLogging(location);

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
    const [status, stdout, stderr] = await Promise.all([
      proc.status(),
      proc.output(),
      proc.stderrOutput()
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

    // Clean up processes
    proc.close();
    statsProc.close();

    // Check if the execution was successful
    if (!status.success) {
      const stdoutText = new TextDecoder().decode(stdout);
      const stderrText = new TextDecoder().decode(stderr);

      throw new RunnerExecutionError(
        "docker",
        `Container execution failed with exit code ${status.code}`,
        sanitizeForLogging(stdoutText),
        sanitizeForLogging(stderrText),
        status.code
      );
    }

    return {
      success: true,
      stdout: sanitizeForLogging(new TextDecoder().decode(stdout)),
      stderr: sanitizeForLogging(new TextDecoder().decode(stderr)),
      bootTime,
      memoryUsage,
      cpuUsage
    };
  } catch (error) {
    // Clean up the container if it's still running
    try {
      const cleanupProc = Deno.run({
        cmd: ["docker", "rm", "-f", containerName],
        stdout: "piped",
        stderr: "piped"
      });
      await cleanupProc.status();
      cleanupProc.close();
    } catch (cleanupError) {
      logger.debug(`Error cleaning up container ${sanitizeForLogging(containerName)}:`, { error: cleanupError });
    }

    // Re-throw the original error
    throw error;
  }
}

/**
 * Run a comb directly in the current process
 * Used as a fallback when Docker is not available
 *
 * @param comb The name of the comb to run
 * @param location The location to run the comb
 * @returns Performance metrics and execution results
 */
async function runDirectly(comb: string, location: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  const sanitizedComb = sanitizeForLogging(comb);
  const sanitizedLocation = sanitizeForLogging(location);

  logger.info(`[DIRECT] Running ${sanitizedComb} directly in current process (${sanitizedLocation})...`);

  try {
    // Execute the comb directly
    const result = await executeComb(comb, { location });

    // Calculate execution time
    const execTime = Date.now() - start;

    return {
      success: true,
      stdout: `[DIRECT] ${result.output || `Successfully executed ${sanitizedComb} directly`}`,
      stderr: "",
      boot_time_ms: 0, // No boot time for direct execution
      exec_time_ms: execTime,
      memory_usage: "N/A", // We don't measure memory usage for direct execution
      cpu_usage: "N/A", // We don't measure CPU usage for direct execution
      runner: "docker",
      location,
      direct: true
    };
  } catch (error) {
    logger.error(`Error running ${sanitizedComb} directly:`, error);

    return {
      success: false,
      error: error.message,
      stdout: "",
      stderr: error.stack || "",
      boot_time_ms: 0,
      exec_time_ms: Date.now() - start,
      memory_usage: "N/A",
      cpu_usage: "N/A",
      runner: "docker",
      location,
      direct: true
    };
  }
}

