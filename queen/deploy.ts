/**
 * Queen Bee orchestration logic
 * Deploys worker bee into specified runtime and tracks execution
 */

import * as Docker from "../runners/docker.ts";
import * as Firecracker from "../runners/firecracker.ts";
import * as Wasm from "../runners/wasm.ts";
import { sanitizeForLogging, validateCombParams } from "../layers/security.ts";
import { createErrorResult, ValidationError, withTimeout } from "../layers/errors.ts";
import { createLogger } from "../layers/logging.ts";
import config from "../layers/config.ts";

// Create a logger for this module
const logger = createLogger("queen");

/**
 * Interface for comb execution parameters
 */
export interface CombParams {
  comb: string;
  runner: string;
  location: string;
  params?: Record<string, unknown>;
}

/**
 * Run a comb in the specified runtime environment
 *
 * @param params The comb execution parameters
 * @returns Performance metrics and execution results
 */
export async function runComb(
  { comb, runner, location, params = {} }: CombParams,
): Promise<Record<string, unknown>> {
  const contextId = crypto.randomUUID();
  const start = Date.now();

  // Validate parameters
  const validation = validateCombParams({ comb, runner, location });
  if (!validation.valid) {
    throw new ValidationError(validation.error || "Invalid parameters");
  }

  // Sanitize inputs for logging
  const sanitizedComb = sanitizeForLogging(comb);
  const sanitizedRunner = sanitizeForLogging(runner);
  const sanitizedLocation = sanitizeForLogging(location);

  logger.info(
    `Queen deploying ${sanitizedComb} to ${sanitizedRunner} in ${sanitizedLocation} environment...`,
    { contextId },
  );

  let result;
  try {
    // Run with timeout based on the runner
    const timeoutMs = config.security.timeouts[runner as keyof typeof config.security.timeouts] ||
      config.security.timeouts.default;

    result = await withTimeout(
      async () => {
        // Select the appropriate runner
        if (runner === "docker") {
          return await Docker.run(comb, location);
        } else if (runner === "firecracker") {
          return await Firecracker.run(comb, location);
        } else if (runner === "wasm") {
          return await Wasm.run(comb, location);
        } else {
          throw new ValidationError(`Unknown runner: ${sanitizedRunner}`);
        }
      },
      timeoutMs,
      `${sanitizedRunner} execution of ${sanitizedComb}`,
    );

    logger.success(
      `${sanitizedComb} execution completed successfully in ${sanitizedRunner}@${sanitizedLocation}`,
      {
        contextId,
        exec_time_ms: result.exec_time_ms,
      },
    );
  } catch (error) {
    logger.error(
      `${sanitizedComb} execution failed in ${sanitizedRunner}@${sanitizedLocation}:`,
      error,
      { contextId },
    );

    // Create standardized error result
    result = createErrorResult(error, runner, location, comb);
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
    timestamp: new Date().toISOString(),
    params,
  };
}
