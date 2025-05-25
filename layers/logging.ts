/**
 * Logging utilities for Honey Benchmark Swarm
 * Provides structured logging functions with different log levels
 */

import { sanitizeForLogging } from "./security.ts";

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Current log level (can be changed at runtime)
let currentLogLevel = LogLevel.INFO;

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

/**
 * Set the current log level
 * 
 * @param level The log level to set
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current log level
 * 
 * @returns The current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Sanitize an object for logging to prevent log injection
 * 
 * @param obj The object to sanitize
 * @returns Sanitized object
 */
function sanitizeObjectForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeForLogging(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObjectForLogging(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeForLogging(item) 
          : (item && typeof item === 'object' 
              ? sanitizeObjectForLogging(item as Record<string, unknown>) 
              : item)
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Format a log message with timestamp and level
 * 
 * @param level The log level
 * @param message The message to log
 * @param context Additional context information
 * @returns Formatted log message
 */
function formatLogMessage(level: string, message: string, context: Record<string, unknown> = {}): string {
  const timestamp = new Date().toISOString();
  // Sanitize the message to prevent log injection
  const sanitizedMessage = sanitizeForLogging(message);
  // Sanitize the context object
  const sanitizedContext = sanitizeObjectForLogging(context);
  const contextStr = Object.keys(sanitizedContext).length > 0 ? ` ${JSON.stringify(sanitizedContext)}` : '';
  return `[${timestamp}] [${level}] ${sanitizedMessage}${contextStr}`;
}

/**
 * Log a debug message
 * 
 * @param message The message to log
 * @param context Additional context information
 */
export function debug(message: string, context: Record<string, unknown> = {}): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.debug(colors.dim + formatLogMessage('DEBUG', message, context) + colors.reset);
  }
}

/**
 * Log an info message
 * 
 * @param message The message to log
 * @param context Additional context information
 */
export function info(message: string, context: Record<string, unknown> = {}): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(colors.green + formatLogMessage('INFO', message, context) + colors.reset);
  }
}

/**
 * Log a warning message
 * 
 * @param message The message to log
 * @param context Additional context information
 */
export function warn(message: string, context: Record<string, unknown> = {}): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(colors.yellow + formatLogMessage('WARN', message, context) + colors.reset);
  }
}

/**
 * Log an error message
 * 
 * @param message The message to log
 * @param error The error object
 * @param context Additional context information
 */
export function error(message: string, error?: Error, context: Record<string, unknown> = {}): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    const errorContext = {
      ...context,
      ...(error && {
        error_type: error.name,
        error_message: sanitizeForLogging(error.message),
        error_stack: error.stack ? sanitizeForLogging(error.stack) : undefined
      })
    };
    console.error(colors.red + formatLogMessage('ERROR', message, errorContext) + colors.reset);
  }
}

/**
 * Log a success message
 * 
 * @param message The message to log
 * @param context Additional context information
 */
export function success(message: string, context: Record<string, unknown> = {}): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(colors.bright + colors.green + formatLogMessage('SUCCESS', message, context) + colors.reset);
  }
}

/**
 * Create a logger for a specific component
 * 
 * @param component The component name
 * @returns Logger object with component context
 */
export function createLogger(component: string): {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
  success: (message: string, context?: Record<string, unknown>) => void;
} {
  return {
    debug: (message: string, context: Record<string, unknown> = {}) => 
      debug(message, { component, ...context }),
    info: (message: string, context: Record<string, unknown> = {}) => 
      info(message, { component, ...context }),
    warn: (message: string, context: Record<string, unknown> = {}) => 
      warn(message, { component, ...context }),
    error: (message: string, error?: Error, context: Record<string, unknown> = {}) => 
      error(message, error, { component, ...context }),
    success: (message: string, context: Record<string, unknown> = {}) => 
      success(message, { component, ...context })
  };
}

/**
 * Create a benchmark logger that tracks execution time
 * 
 * @param operation The operation name
 * @returns Object with start and end functions
 */
export function createBenchmarkLogger(operation: string): {
  start: () => void;
  end: () => number;
} {
  let startTime = 0;
  
  return {
    start: () => {
      startTime = performance.now();
      info(`Starting operation: ${sanitizeForLogging(operation)}`);
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      success(`Completed operation: ${sanitizeForLogging(operation)}`, { duration_ms: duration });
      return duration;
    }
  };
}

