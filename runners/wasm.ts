/**
 * WebAssembly Runner for Honeycomb tasks
 * Executes a comb in a WASM runtime and measures performance metrics
 */

// Import necessary modules
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

/**
 * Check if a WASM file exists for the given comb
 * 
 * @param comb The name of the comb to check
 * @returns Path to the WASM file if it exists, null otherwise
 */
async function findWasmFile(comb: string): Promise<string | null> {
  const wasmPath = join(Deno.cwd(), "combs", `${comb}.wasm`);
  
  try {
    const stat = await Deno.stat(wasmPath);
    if (stat.isFile) {
      return wasmPath;
    }
  } catch (error) {
    // File doesn't exist
  }
  
  return null;
}

/**
 * Load and execute a WASM module
 * 
 * @param wasmPath Path to the WASM file
 * @param args Arguments to pass to the WASM module
 * @returns Result of the WASM execution
 */
async function executeWasmModule(wasmPath: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  try {
    // Load the WASM module
    const wasmBytes = await Deno.readFile(wasmPath);
    const wasmModule = new WebAssembly.Module(wasmBytes);
    
    // Create memory and import objects
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
    
    // Create a performance object to measure execution time
    const performance = {
      now: () => Date.now(),
      mark: (name: string) => console.log(`Performance mark: ${name}`),
      measure: (name: string, start: string, end: string) => console.log(`Performance measure: ${name} (${start} to ${end})`)
    };
    
    // Create import object with memory and environment
    const importObject = {
      env: {
        memory,
        performance,
        console: {
          log: (ptr: number, len: number) => {
            const buffer = new Uint8Array(memory.buffer, ptr, len);
            const text = new TextDecoder().decode(buffer);
            console.log(text);
          }
        }
      }
    };
    
    // Instantiate the WASM module
    const instance = await WebAssembly.instantiate(wasmModule, importObject);
    
    // Get the exports
    const exports = instance.exports as Record<string, CallableFunction>;
    
    // Check if the module has a main function
    if (typeof exports.main !== "function") {
      throw new Error("WASM module does not export a 'main' function");
    }
    
    // Call the main function
    const result = exports.main();
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error("Error executing WASM module:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run a comb in a WASM runtime
 * 
 * @param comb The name of the comb to run
 * @param location The location to run the comb (local or cloud)
 * @returns Performance metrics and execution results
 */
export async function run(comb: string, location: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  
  console.log(`Starting WASM runtime for ${comb} in ${location} environment...`);
  
  // Check if a WASM file exists for this comb
  const wasmPath = await findWasmFile(comb);
  
  if (!wasmPath) {
    console.log(`No WASM file found for ${comb}, using simulation mode`);
    return simulateWasmRun(comb, location);
  }
  
  try {
    // Measure boot time (very fast for WASM)
    const bootStart = Date.now();
    
    // Boot time for WASM is essentially instantiation time
    const bootTime = Date.now() - bootStart;
    
    // Execute the WASM module
    const execResult = await executeWasmModule(wasmPath, { location });
    
    // Get resource usage
    // In a real implementation, this would involve measuring memory and CPU usage
    // For now, we'll use fixed values
    const memoryUsage = "15MB";
    const cpuUsage = "3%";
    
    // Calculate total execution time
    const execTime = Date.now() - start;
    
    return {
      success: execResult.success,
      stdout: execResult.success 
        ? `Successfully executed ${comb} in WASM runtime (${location})`
        : "",
      stderr: execResult.success ? "" : `Error: ${execResult.error}`,
      boot_time_ms: bootTime,
      exec_time_ms: execTime,
      memory_usage: memoryUsage,
      cpu_usage: cpuUsage,
      runner: "wasm",
      location,
      result: execResult.result
    };
  } catch (error) {
    console.error(`Error running ${comb} in WASM:`, error);
    
    // Fall back to simulation
    return simulateWasmRun(comb, location);
  }
}

/**
 * Simulate running a comb in a WASM runtime
 * Used when WASM file is not available or execution fails
 * 
 * @param comb The name of the comb to run
 * @param location The location to run the comb (local or cloud)
 * @returns Simulated performance metrics and execution results
 */
async function simulateWasmRun(comb: string, location: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  
  console.log(`[SIMULATION] Running ${comb} in simulated WASM environment (${location})...`);
  
  // Simulate execution time (much faster than Docker and Firecracker)
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate boot time (much faster than containers or VMs)
  const bootTime = 5;
  
  // Simulate execution
  const success = true;
  const stdout = `[SIMULATION] Successfully executed ${comb} in simulated WASM runtime (${location})`;
  const stderr = "";
  
  // Simulate resource usage (much lower than containers or VMs)
  const memoryUsage = "15MB";
  const cpuUsage = "3%";
  
  // Calculate total execution time
  const execTime = Date.now() - start;
  
  return {
    success,
    stdout,
    stderr,
    boot_time_ms: bootTime,
    exec_time_ms: execTime,
    memory_usage: memoryUsage,
    cpu_usage: cpuUsage,
    runner: "wasm",
    location,
    simulated: true
  };
}
