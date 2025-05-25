/**
 * Security utilities for Honey Benchmark Swarm
 * Provides functions for input validation, sanitization, and security checks
 */

/**
 * Validate a comb name to prevent path traversal and command injection
 *
 * @param combName The comb name to validate
 * @returns True if the comb name is valid, false otherwise
 */
export function validateCombName(combName: string): boolean {
  // Only allow alphanumeric characters, hyphens, and underscores
  // Prevent path traversal and command injection
  const validNamePattern = /^[a-zA-Z0-9-_]+$/;
  return validNamePattern.test(combName);
}

/**
 * Sanitize a comb name for safe use in file paths and commands
 *
 * @param combName The comb name to sanitize
 * @returns Sanitized comb name
 */
export function sanitizeCombName(combName: string): string {
  // Replace any non-alphanumeric characters with underscores
  return combName.replace(/[^a-zA-Z0-9-_]/g, "_");
}

/**
 * Validate a location string
 *
 * @param location The location to validate
 * @returns True if the location is valid, false otherwise
 */
export function validateLocation(location: string): boolean {
  // Only allow specific location values
  const validLocations = ["local", "cloud"];
  return validLocations.includes(location);
}

/**
 * Validate a runner string
 *
 * @param runner The runner to validate
 * @returns True if the runner is valid, false otherwise
 */
export function validateRunner(runner: string): boolean {
  // Only allow specific runner values
  const validRunners = ["docker", "firecracker", "wasm"];
  return validRunners.includes(runner);
}

/**
 * Validate Docker container name to prevent command injection
 *
 * @param containerName The container name to validate
 * @returns True if the container name is valid, false otherwise
 */
export function validateContainerName(containerName: string): boolean {
  // Docker container names must match this pattern
  const validNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/;
  return validNamePattern.test(containerName);
}

/**
 * Generate a secure container name for Docker
 *
 * @param comb The comb name
 * @returns A secure container name
 */
export function generateSecureContainerName(comb: string): string {
  const sanitizedComb = sanitizeCombName(comb);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `honeycomb-${sanitizedComb}-${timestamp}-${randomSuffix}`;
}

/**
 * Escape shell arguments to prevent command injection
 *
 * @param arg The argument to escape
 * @returns Escaped argument
 */
export function escapeShellArg(arg: string): string {
  // Replace single quotes with escaped single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Validate port number for security
 *
 * @param port The port number to validate
 * @returns True if the port is valid, false otherwise
 */
export function validatePort(port: number): boolean {
  // Ports should be between 1024 and 65535 for non-root users
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}

/**
 * Validate file path to prevent path traversal
 *
 * @param path The file path to validate
 * @returns True if the path is valid, false otherwise
 */
export function validateFilePath(path: string): boolean {
  // Prevent path traversal attacks
  return !path.includes("..") && !path.includes("~") && !path.startsWith("/");
}

/**
 * Sanitize a string for safe logging
 *
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeForLogging(input: string): string {
  if (typeof input !== "string") {
    return String(input);
  }

  // Remove or replace control characters and other potentially dangerous characters
  return input
    .replace(/[\n\r\t\v\f]/g, " ") // Replace newlines, tabs, etc. with spaces
    .replace(/[^\x20-\x7E]/g, "") // Remove non-printable ASCII characters
    .replace(/[\\'"]/g, "\\$&"); // Escape quotes and backslashes
}

/**
 * Check if Docker is available and validate its version
 *
 * @returns Promise resolving to true if Docker is available and valid, false otherwise
 */
export async function validateDockerEnvironment(): Promise<boolean> {
  try {
    const process = new Deno.Command("docker", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const result = await process.output();
    const output = new TextDecoder().decode(result.stdout);

    if (!result.success) {
      console.error("Docker is not available");
      return false;
    }

    // Validate Docker version (example: require version 20.0.0 or higher)
    const versionMatch = output.match(/Docker version (\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1], 10);
      if (major < 20) {
        console.warn(
          `Docker version ${major}.x.x may not be fully supported. Version 20.0.0 or higher is recommended.`,
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Error validating Docker environment:", error);
    return false;
  }
}

/**
 * Validate parameters for a comb execution
 *
 * @param params The parameters to validate
 * @returns Object with validation result and error message if any
 */
export function validateCombParams(
  params: Record<string, unknown>,
): { valid: boolean; error?: string } {
  // Validate required parameters
  if (!params.comb || typeof params.comb !== "string") {
    return { valid: false, error: "Missing or invalid comb name" };
  }

  if (!params.runner || typeof params.runner !== "string") {
    return { valid: false, error: "Missing or invalid runner" };
  }

  if (!params.location || typeof params.location !== "string") {
    return { valid: false, error: "Missing or invalid location" };
  }

  // Validate comb name
  if (!validateCombName(params.comb as string)) {
    return { valid: false, error: "Invalid comb name format" };
  }

  // Validate runner
  if (!validateRunner(params.runner as string)) {
    return { valid: false, error: "Invalid runner. Must be one of: docker, firecracker, wasm" };
  }

  // Validate location
  if (!validateLocation(params.location as string)) {
    return { valid: false, error: "Invalid location. Must be one of: local, cloud" };
  }

  return { valid: true };
}
