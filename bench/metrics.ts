/**
 * Metrics logger and summarizer for benchmark swarm
 * Records benchmark results to MongoDB and Pinecone
 */

import { createLogger } from "../layers/logging.ts";
import { formatDuration } from "../layers/utils.ts";
import config from "../layers/config.ts";

// Create a logger for this module
const logger = createLogger("metrics");

// Import database layers
// These would be imported from the agent_data_layer in the final integration
// For now, we'll use placeholder functions
async function insertToMongo(contextId: string, summary: string, agentId: string): Promise<string> {
  if (!config.metrics.mongodb.enabled) {
    logger.debug(`MongoDB metrics disabled, skipping record for ${contextId}`);
    return contextId;
  }
  
  logger.info(`Storing benchmark result for ${contextId} in MongoDB`);
  
  try {
    // In a real implementation, this would connect to MongoDB and insert the record
    // For now, we'll just simulate success
    return contextId;
  } catch (error) {
    logger.error(`Failed to store metrics in MongoDB:`, error);
    return contextId;
  }
}

async function embedToPinecone(text: string, metadata: Record<string, string>): Promise<string> {
  if (!config.metrics.pinecone.enabled) {
    logger.debug(`Pinecone metrics disabled, skipping embedding for ${metadata.contextId}`);
    return crypto.randomUUID();
  }
  
  logger.info(`Embedding benchmark summary in Pinecone: ${text.substring(0, 50)}...`);
  
  try {
    // In a real implementation, this would connect to Pinecone and embed the text
    // For now, we'll just simulate success
    return crypto.randomUUID();
  } catch (error) {
    logger.error(`Failed to embed metrics in Pinecone:`, error);
    return crypto.randomUUID();
  }
}

/**
 * Record benchmark metrics to databases
 * 
 * @param result The benchmark result to record
 */
export async function recordMetrics(result: Record<string, unknown>): Promise<void> {
  const record = {
    ...result,
    agentId: "honey-benchmark",
    timestamp: new Date().toISOString()
  };
  
  logger.info(`Recording metrics for ${record.comb} on ${record.runner}@${record.location}`);
  
  try {
    // Store the full result in MongoDB
    await insertToMongo(
      record.contextId as string || "unknown", 
      JSON.stringify(record), 
      record.agentId as string
    );
    
    // Create a summary for vector embedding
    const summary = `Benchmark: ${record.comb} on ${record.runner}@${record.location} - ` +
      `Boot: ${formatDuration(record.boot_time_ms as number)}, ` +
      `Exec: ${formatDuration(record.exec_time_ms as number)}, ` +
      `Memory: ${record.memory_usage}, CPU: ${record.cpu_usage}, ` +
      `Success: ${record.success}`;
    
    // Store the summary in Pinecone for semantic search
    await embedToPinecone(summary, {
      contextId: record.contextId as string,
      comb: record.comb as string,
      runner: record.runner as string,
      location: record.location as string,
      success: String(record.success)
    });
    
    logger.success(`Metrics recorded successfully for ${record.comb}`);
  } catch (error) {
    logger.error(`Failed to record metrics:`, error);
  }
}

/**
 * Generate a summary of benchmark results
 * 
 * @param results Array of benchmark results
 * @returns A formatted summary string
 */
export function summarizeResults(results: Record<string, unknown>[]): string {
  const summary = ["# Benchmark Results Summary\n"];
  
  // Group results by comb
  const combResults: Record<string, Record<string, unknown>[]> = {};
  
  for (const result of results) {
    const comb = result.comb as string;
    if (!combResults[comb]) {
      combResults[comb] = [];
    }
    combResults[comb].push(result);
  }
  
  // Generate summary for each comb
  for (const [comb, combData] of Object.entries(combResults)) {
    summary.push(`\n## ${comb}\n`);
    summary.push("| Runner | Location | Boot Time | Exec Time | Memory | CPU | Success |");
    summary.push("|--------|----------|-----------|-----------|--------|-----|---------|");
    
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
        `| ${result.runner} | ${result.location} | ` +
        `${formatDuration(result.boot_time_ms as number)} | ${formatDuration(result.exec_time_ms as number)} | ` +
        `${result.memory_usage} | ${result.cpu_usage} | ${result.success} |`
      );
    }
    
    // Find the fastest successful runner
    const successfulResults = combData.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      const fastest = successfulResults[0];
      summary.push(`\n**Fastest Runner:** ${fastest.runner}@${fastest.location} (${formatDuration(fastest.exec_time_ms as number)})`);
      
      // Find the most memory-efficient runner (if we have actual numbers)
      const memoryResults = successfulResults.filter(r => {
        const mem = r.memory_usage as string;
        return mem && mem !== "N/A" && /^\d+(\.\d+)?[KMG]?B$/.test(mem);
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
          const unitOrder = { "B": 0, "KB": 1, "MB": 2, "GB": 3 };
          if (unitA !== unitB) {
            return (unitOrder[unitA as keyof typeof unitOrder] || 0) - 
                   (unitOrder[unitB as keyof typeof unitOrder] || 0);
          }
          
          // Then compare values
          return valueA - valueB;
        });
        
        const mostMemoryEfficient = memoryResults[0];
        summary.push(`**Most Memory-Efficient:** ${mostMemoryEfficient.runner}@${mostMemoryEfficient.location} (${mostMemoryEfficient.memory_usage})`);
      }
    } else {
      summary.push(`\n**No successful executions for this comb**`);
    }
  }
  
  return summary.join("\n");
}

