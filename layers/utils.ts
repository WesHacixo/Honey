/**
 * Utility functions for Honey Benchmark Swarm
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

/**
 * Load a comb module by name
 * 
 * @param comb The name of the comb to load
 * @returns The loaded comb module or null if not found
 */
export async function loadComb(comb: string): Promise<Record<string, unknown> | null> {
  try {
    const combPath = join(Deno.cwd(), "combs", `${comb}.egg.ts`);
    const module = await import(`file://${combPath}`);
    return module;
  } catch (error) {
    console.error(`Error loading comb ${comb}:`, error);
    return null;
  }
}

/**
 * Execute a comb's main function
 * 
 * @param comb The name of the comb to execute
 * @param params Parameters to pass to the comb
 * @returns The result of the comb execution or null if failed
 */
export async function executeComb(comb: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown> | null> {
  const module = await loadComb(comb);
  
  if (!module) {
    console.error(`Comb ${comb} not found`);
    return null;
  }
  
  if (typeof module.main !== "function") {
    console.error(`Comb ${comb} does not export a main function`);
    return null;
  }
  
  try {
    return await module.main(params);
  } catch (error) {
    console.error(`Error executing comb ${comb}:`, error);
    return null;
  }
}

/**
 * List all available combs
 * 
 * @returns Array of comb names
 */
export async function listCombs(): Promise<string[]> {
  try {
    const combsDir = join(Deno.cwd(), "combs");
    const entries = Deno.readDirSync(combsDir);
    
    const combs = [];
    
    for (const entry of entries) {
      if (entry.isFile && entry.name.endsWith(".egg.ts")) {
        combs.push(entry.name.replace(".egg.ts", ""));
      }
    }
    
    return combs;
  } catch (error) {
    console.error("Error listing combs:", error);
    return [];
  }
}

/**
 * Format a duration in milliseconds to a human-readable string
 * 
 * @param ms Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format bytes to a human-readable string
 * 
 * @param bytes Number of bytes
 * @returns Formatted byte string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
}

/**
 * Parse memory string (e.g., "128MB") to bytes
 * 
 * @param memoryString Memory string to parse
 * @returns Number of bytes or null if invalid
 */
export function parseMemory(memoryString: string): number | null {
  const match = memoryString.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
  
  if (!match) {
    return null;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case "B":
      return value;
    case "KB":
      return value * 1024;
    case "MB":
      return value * 1024 * 1024;
    case "GB":
      return value * 1024 * 1024 * 1024;
    case "TB":
      return value * 1024 * 1024 * 1024 * 1024;
    default:
      return null;
  }
}

