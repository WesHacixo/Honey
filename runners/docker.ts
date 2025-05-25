/**
 * Docker Runner for Honeycomb tasks
 * Executes a comb in a Docker container and measures performance metrics
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { executeComb } from "../layers/utils.ts";

/**
 * Check if Docker is available on the system
 * 
 * @returns True if Docker is available, false otherwise
 */
async function isDockerAvailable(): Promise<boolean> {
  try {
    const process = Deno.run({
      cmd: ["docker", "--version"],
      stdout: "piped",
      stderr: "piped"
    });
    
    const status = await process.status();
    process.close();
    
    return status.success;
  } catch (error) {
    console.error("Error checking for Docker:", error);
    return false;
  }
}

/**
 * Run a comb in a Docker container
 * 
 * @param comb The name of the comb to run
 * @param location The location to run the comb (local or cloud)
 * @returns Performance metrics and execution results
 */
export async function run(comb: string, location: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  const containerName = `honeycomb-${comb}-${Date.now()}`;
  
  console.log(`Starting Docker container for ${comb} in ${location} environment...`);
  
  // Check if Docker is available
  const dockerAvailable = await isDockerAvailable();
  
  if (!dockerAvailable) {
    console.log(`Docker not available, using direct execution for ${comb}`);
    return runDirectly(comb, location);
  }
  
  // Measure boot time
  const bootStart = Date.now();
  
  try {
    // Run the container
    // In a real implementation, this would use the actual comb file
    const proc = Deno.run({
      cmd: [
        "docker", "run", "--name", containerName, "--rm",
        "-v", `${Deno.cwd()}/combs:/combs`,
        "denoland/deno:alpine", "sh", "-c", 
        `cd /combs && deno run --allow-all ${comb}.egg.ts`
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
    
    // Calculate total execution time
    const execTime = Date.now() - start;
    
    // Clean up
    proc.close();
    statsProc.close();
    
    return {
      success: status.success,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      boot_time_ms: bootTime,
      exec_time_ms: execTime,
      memory_usage: memoryUsage,
      cpu_usage: cpuUsage,
      runner: "docker",
      location
    };
  } catch (error) {
    console.error(`Error running ${comb} in Docker:`, error);
    
    // Fall back to direct execution
    return runDirectly(comb, location);
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
  
  console.log(`[DIRECT] Running ${comb} directly in Deno (${location})...`);
  
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
    console.error(`Error running ${comb} directly:`, error);
    
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
