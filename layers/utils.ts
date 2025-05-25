/**
 * Utility functions for Honey Benchmark Swarm
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { createLogger } from "./logging.ts";
import { CombNotFoundError } from "./errors.ts";
import { sanitizeForLogging } from "./security.ts";

// Create a logger for this module
const logger = createLogger("utils");

/**
 * Load a comb module by name
 *
 * @param comb The name of the comb to load
 * @returns The loaded comb module or null if not found
 * @throws CombNotFoundError if the comb is not found
 */
export async function loadComb(comb: string): Promise<Record<string, unknown>> {
  try {
    const sanitizedComb = sanitizeForLogging(comb);
    const combPath = join(Deno.cwd(), "combs", `${comb}.egg.ts`);
    const module = await import(`file://${combPath}`);
    return module;
  } catch (error) {
    logger.error(`Error loading comb ${sanitizeForLogging(comb)}:`, error);
    throw new CombNotFoundError(comb);
  }
}

/**
 * Execute a comb's main function
 *
 * @param comb The name of the comb to execute
 * @param params Parameters to pass to the comb
 * @returns The result of the comb execution
 * @throws CombNotFoundError if the comb is not found
 * @throws Error if the comb does not export a main function
 */
export async function executeComb(comb: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const module = await loadComb(comb);

  if (typeof module.main !== "function") {
    throw new Error(`Comb ${sanitizeForLogging(comb)} does not export a main function`);
  }

  try {
    return await module.main(params);
  } catch (error) {
    logger.error(`Error executing comb ${sanitizeForLogging(comb)}:`, error);
    throw error;
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
    logger.error("Error listing combs:", error);
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

/**
 * Generate a random ID
 *
 * @param length Length of the ID
 * @returns Random ID string
 */
export function generateId(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Deep clone an object
 *
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a command is available in the system
 *
 * @param command Command to check
 * @returns Promise resolving to true if the command is available, false otherwise
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    const process = Deno.run({
      cmd: ["which", command],
      stdout: "piped",
      stderr: "piped"
    });

    const status = await process.status();
    process.close();

    return status.success;
  } catch (error) {
    logger.debug(`Command ${sanitizeForLogging(command)} not available:`, { error });
    return false;
  }
}

/**
 * Run a shell command and capture its output
 *
 * @param cmd Command to run
 * @param args Command arguments
 * @returns Promise resolving to the command output
 */
export async function runCommand(cmd: string, args: string[] = []): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}> {
  try {
    const process = Deno.run({
      cmd: [cmd, ...args],
      stdout: "piped",
      stderr: "piped"
    });

    const [status, stdout, stderr] = await Promise.all([
      process.status(),
      process.output(),
      process.stderrOutput()
    ]);

    process.close();

    return {
      success: status.success,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      code: status.code
    };
  } catch (error) {
    // Sanitize command and args for logging
    const sanitizedCmd = sanitizeForLogging(cmd);
    const sanitizedArgs = args.map(arg => sanitizeForLogging(arg));
    logger.error(`Error running command ${sanitizedCmd} ${sanitizedArgs.join(" ")}:`, error);

    return {
      success: false,
      stdout: "",
      stderr: error.toString(),
      code: -1
    };
  }
}

/**
 * Sleep for a specified duration
 *
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the current timestamp in ISO format
 *
 * @returns Current timestamp string
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if a file exists
 *
 * @param path File path
 * @returns Promise resolving to true if the file exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists
 *
 * @param path Directory path
 * @returns Promise resolving to true if the directory exists, false otherwise
 */
export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (error) {
    return false;
  }
}

