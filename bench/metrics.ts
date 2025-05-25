/**
 * Metrics collection and storage for Honey Benchmark Swarm
 * Handles benchmark result storage and vector embeddings
 */

import { createLogger } from '../layers/logging.ts';
import { formatDuration } from '../layers/utils.ts';
import { sanitizeForLogging } from '../layers/security.ts';
import config from '../layers/config.ts';

// Create a logger for this module
const logger = createLogger('metrics');

// Define interface for benchmark metrics
export interface BenchmarkMetrics {
  comb: string;
  runner: string;
  location: string;
  success: boolean;
  boot_time_ms?: number;
  exec_time_ms?: number;
  memory_usage?: string;
  cpu_usage?: string;
  agentId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// Import database layers
// These would be imported from the agent_data_layer in the final integration
// For now, we'll use placeholder functions
function storeInMongoDB(_metrics: Record<string, unknown>): string {
  const contextId = crypto.randomUUID();

  // In a real implementation, this would connect to MongoDB and insert the record
  // For now, we'll just simulate success
  logger.info(`Storing metrics in MongoDB with context ID: ${contextId}`);

  return contextId;
}

function embedToPinecone(
  text: string,
  metadata: Record<string, string>,
): string {
  if (!config.metrics.pinecone.enabled) {
    logger.debug(
      `Pinecone metrics disabled, skipping embedding for ${
        sanitizeForLogging(metadata.contextId)
      }`,
    );
    return crypto.randomUUID();
  }

  // Sanitize text for logging
  const sanitizedText = sanitizeForLogging(text);
  logger.info(
    `Embedding benchmark summary in Pinecone: ${
      sanitizedText.substring(0, 50)
    }...`,
  );

  try {
    // In a real implementation, this would connect to Pinecone and embed the text
    // For now, we'll just simulate success
    return crypto.randomUUID();
  } catch (error: unknown) {
    logger.error(
      `Failed to embed metrics in Pinecone:`,
      error instanceof Error ? error : new Error(String(error)),
    );
    return crypto.randomUUID();
  }
}

/**
 * Record benchmark metrics to databases
 *
 * @param result The benchmark result to record
 */
export function recordMetrics(result: BenchmarkMetrics): void {
  const record: BenchmarkMetrics = {
    ...result,
    agentId: 'honey-benchmark',
    timestamp: new Date().toISOString(),
  };

  // Sanitize inputs for logging
  const sanitizedComb = sanitizeForLogging(record.comb);
  const sanitizedRunner = sanitizeForLogging(record.runner);
  const sanitizedLocation = sanitizeForLogging(record.location);

  logger.info(
    `Recording metrics for ${sanitizedComb} on ${sanitizedRunner}@${sanitizedLocation}`,
  );

  try {
    // Store the full result in MongoDB
    storeInMongoDB(record);

    // Create a summary for vector embedding
    const summary =
      `Benchmark: ${sanitizedComb} on ${sanitizedRunner}@${sanitizedLocation} - ` +
      `Boot: ${formatDuration(record.boot_time_ms as number)}, ` +
      `Exec: ${formatDuration(record.exec_time_ms as number)}, ` +
      `Memory: ${record.memory_usage}, CPU: ${record.cpu_usage}, ` +
      `Success: ${record.success}`;

    // Store the summary in Pinecone for semantic search
    embedToPinecone(summary, {
      contextId: record.contextId as string,
      comb: sanitizedComb,
      runner: sanitizedRunner,
      location: sanitizedLocation,
      success: String(record.success),
    });

    logger.success(`Metrics recorded successfully for ${sanitizedComb}`);
  } catch (error: unknown) {
    logger.error(
      `Failed to record metrics:`,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Generate a summary of benchmark results
 *
 * @param results Array of benchmark results
 * @returns A formatted summary string
 */
export function summarizeResults(results: BenchmarkMetrics[]): string {
  const summary = ['# Benchmark Results Summary\n'];

  // Group results by comb
  const combResults: Record<string, BenchmarkMetrics[]> = {};

  for (const result of results) {
    const comb = result.comb as string;
    if (!combResults[comb]) {
      combResults[comb] = [];
    }
    combResults[comb].push(result);
  }

  // Generate summary for each comb
  for (const [comb, combData] of Object.entries(combResults)) {
    summary.push(`\n## ${sanitizeForLogging(comb)}\n`);
    summary.push(
      '| Runner | Location | Boot Time | Exec Time | Memory | CPU | Success |',
    );
    summary.push(
      '|--------|----------|-----------|-----------|--------|-----|---------|',
    );

    // Sort by execution time
    combData.sort((a, b) => {
      // Handle failed executions (put them at the end)
      if (!a.success && b.success) return 1;
      if (a.success && !b.success) return -1;

      // Sort successful executions by time
      return (a.exec_time_ms as number) - (b.exec_time_ms as number);
    });

    for (const result of combData) {
      summary.push(
        `| ${sanitizeForLogging(result.runner as string)} | ${
          sanitizeForLogging(result.location as string)
        } | ` +
          `${formatDuration(result.boot_time_ms as number)} | ${
            formatDuration(result.exec_time_ms as number)
          } | ` +
          `${result.memory_usage} | ${result.cpu_usage} | ${result.success} |`,
      );
    }

    // Find the fastest successful runner
    const successfulResults = combData.filter((r) => r.success);

    if (successfulResults.length > 0) {
      const fastest = successfulResults[0];
      summary.push(
        `\n**Fastest Runner:** ${
          sanitizeForLogging(fastest.runner as string)
        }@${sanitizeForLogging(fastest.location as string)} (${
          formatDuration(fastest.exec_time_ms as number)
        })`,
      );

      // Find the most memory-efficient runner (if we have actual numbers)
      const memoryResults = successfulResults.filter((r) => {
        const mem = r.memory_usage as string;
        return mem && mem !== 'N/A' && /^\d+(\.\d+)?[KMG]?B$/.test(mem);
      });

      if (memoryResults.length > 0) {
        // Sort by memory usage (simple string comparison for now)
        memoryResults.sort((a, b) => {
          const memA = a.memory_usage as string;
          const memB = b.memory_usage as string;

          // Extract numeric part and unit
          const matchA = memA.match(/^(\d+(\.\d+)?)([KMG]?B)$/);
          const matchB = memB.match(/^(\d+(\.\d+)?)([KMG]?B)$/);

          if (!matchA || !matchB) return 0;

          const valueA = parseFloat(matchA[1]);
          const valueB = parseFloat(matchB[1]);
          const unitA = matchA[3];
          const unitB = matchB[3];

          // Compare units first
          const unitOrder = { 'B': 0, 'KB': 1, 'MB': 2, 'GB': 3 };
          if (unitA !== unitB) {
            return (unitOrder[unitA as keyof typeof unitOrder] || 0) -
              (unitOrder[unitB as keyof typeof unitOrder] || 0);
          }

          // Then compare values
          return valueA - valueB;
        });

        const mostMemoryEfficient = memoryResults[0];
        summary.push(
          `**Most Memory-Efficient:** ${
            sanitizeForLogging(mostMemoryEfficient.runner as string)
          }@${
            sanitizeForLogging(mostMemoryEfficient.location as string)
          } (${mostMemoryEfficient.memory_usage})`,
        );
      }
    } else {
      summary.push(`\n**No successful executions for this comb**`);
    }
  }

  return summary.join('\n');
}
