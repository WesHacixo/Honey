/**
 * Error handling utilities for Honey Benchmark Swarm
 * Provides custom error classes and error handling functions
 */

/**
 * Base error class for Honey Benchmark Swarm
 */
export class HoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a comb is not found
 */
export class CombNotFoundError extends HoneyError {
  constructor(combName: string) {
    super(`Comb not found: ${combName}`);
  }
}

/**
 * Error thrown when a runner is not available
 */
export class RunnerNotAvailableError extends HoneyError {
  constructor(runner: string) {
    super(`Runner not available: ${runner}`);
  }
}

/**
 * Error thrown when a runner execution fails
 */
export class RunnerExecutionError extends HoneyError {
  public readonly stdout: string;
  public readonly stderr: string;
  public readonly exitCode: number;

  constructor(runner: string, message: string, stdout = "", stderr = "", exitCode = -1) {
    super(`Runner execution failed (${runner}): ${message}`);
    this.stdout = stdout;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends HoneyError {
  constructor(message: string) {
    super(`Validation error: ${message}`);
  }
}

/**
 * Error thrown when a security check fails
 */
export class SecurityError extends HoneyError {
  constructor(message: string) {
    super(`Security error: ${message}`);
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends HoneyError {
  constructor(operation: string, timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms: ${operation}`);
  }
}

/**
 * Error thrown when a resource is not available
 */
export class ResourceNotAvailableError extends HoneyError {
  constructor(resource: string) {
    super(`Resource not available: ${resource}`);
  }
}

/**
 * Create a standardized error result object
 * 
 * @param error The error that occurred
 * @param runner The runner that was being used
 * @param location The location that was being used
 * @param comb The comb that was being executed
 * @returns Standardized error result object
 */
export function createErrorResult(
  error: Error,
  runner: string,
  location: string,
  comb: string
): Record<string, unknown> {
  // Extract stdout and stderr if available
  let stdout = "";
  let stderr = "";
  let exitCode = -1;
  
  if (error instanceof RunnerExecutionError) {
    stdout = error.stdout;
    stderr = error.stderr;
    exitCode = error.exitCode;
  }
  
  return {
    success: false,
    error: error.message,
    error_type: error.name,
    stdout,
    stderr: stderr || error.stack || "",
    exit_code: exitCode,
    boot_time_ms: 0,
    exec_time_ms: 0,
    runner,
    location,
    comb,
    contextId: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Execute a function with a timeout
 * 
 * @param fn The function to execute
 * @param timeoutMs The timeout in milliseconds
 * @param operationName Name of the operation for error reporting
 * @returns Promise resolving to the function result
 * @throws TimeoutError if the operation times out
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutId: number | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return result as T;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelayMs Initial delay in milliseconds
 * @param maxDelayMs Maximum delay in milliseconds
 * @returns Promise resolving to the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 100,
  maxDelayMs = 5000
): Promise<T> {
  let lastError: Error | undefined;
  let delay = initialDelayMs;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(delay * 2, maxDelayMs);
      delay = delay * (0.5 + Math.random() * 0.5); // Add jitter
    }
  }
  
  throw lastError;
}

/**
 * Log an error with consistent formatting
 * 
 * @param error The error to log
 * @param context Additional context information
 */
export function logError(error: Error, context: Record<string, unknown> = {}): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error_type: error.name,
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  console.error(`[ERROR] ${errorInfo.error_type}: ${errorInfo.message}`);
  console.error(JSON.stringify(errorInfo, null, 2));
}

