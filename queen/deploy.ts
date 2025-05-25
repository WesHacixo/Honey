/**
 * Queen Bee orchestration logic
 * Deploys worker bee into specified runtime and tracks execution
 */

import * as Docker from "../runners/docker.ts";
import * as Firecracker from "../runners/firecracker.ts";
import * as Wasm from "../runners/wasm.ts";

/**
 * Interface for comb execution parameters
 */
export interface CombParams {
  comb: string;
  runner: string;
  location: string;
}

/**
 * Run a comb in the specified runtime environment
 * 
 * @param params The comb execution parameters
 * @returns Performance metrics and execution results
 */
export async function runComb({ comb, runner, location }: CombParams): Promise<Record<string, unknown>> {
  const contextId = crypto.randomUUID();
  const start = Date.now();
  
  console.log(`Queen deploying ${comb} to ${runner} in ${location} environment...`);
  
  let result;
  try {
    // Select the appropriate runner
    if (runner === "docker") {
      result = await Docker.run(comb, location);
    } else if (runner === "firecracker") {
      result = await Firecracker.run(comb, location);
    } else if (runner === "wasm") {
      result = await Wasm.run(comb, location);
    } else {
      throw new Error(`Unknown runner: ${runner}`);
    }
    
    console.log(`Queen: ${comb} execution completed successfully in ${runner}@${location}`);
  } catch (error) {
    console.error(`Queen: ${comb} execution failed in ${runner}@${location}:`, error);
    
    // Return error result
    result = {
      success: false,
      error: error.message,
      stdout: "",
      stderr: error.stack || "",
      boot_time_ms: 0,
      exec_time_ms: 0,
      runner,
      location
    };
  }
  
  const end = Date.now();
  
  // Combine results with metadata
  return {
    ...result,
    comb,
    runner,
    location,
    contextId,
    total_time_ms: end - start,
    timestamp: new Date().toISOString()
  };
}

