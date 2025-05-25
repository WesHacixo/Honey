/**
 * Metrics logger and summarizer for benchmark swarm
 * Records benchmark results to MongoDB and Pinecone
 */

// Import database layers
// These would be imported from the agent_data_layer in the final integration
// For now, we'll use placeholder functions
async function insertToMongo(contextId: string, summary: string, agentId: string): Promise<string> {
  console.log(`[MongoDB] Storing benchmark result for ${contextId}`);
  return contextId;
}

async function embedToPinecone(text: string, metadata: Record<string, string>): Promise<string> {
  console.log(`[Pinecone] Embedding benchmark summary: ${text}`);
  return crypto.randomUUID();
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
  
  console.log(`Recording metrics for ${record.comb} on ${record.runner}@${record.location}`);
  
  try {
    // Store the full result in MongoDB
    await insertToMongo(
      record.contextId as string || "unknown", 
      JSON.stringify(record), 
      record.agentId as string
    );
    
    // Create a summary for vector embedding
    const summary = `Benchmark: ${record.comb} on ${record.runner}@${record.location} - ` +
      `Boot: ${record.boot_time_ms}ms, Exec: ${record.exec_time_ms}ms, ` +
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
    
    console.log(`Metrics recorded successfully for ${record.comb}`);
  } catch (error) {
    console.error(`Failed to record metrics:`, error);
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
    combData.sort((a, b) => (a.exec_time_ms as number) - (b.exec_time_ms as number));
    
    for (const result of combData) {
      summary.push(
        `| ${result.runner} | ${result.location} | ` +
        `${result.boot_time_ms}ms | ${result.exec_time_ms}ms | ` +
        `${result.memory_usage} | ${result.cpu_usage} | ${result.success} |`
      );
    }
    
    // Find the fastest runner
    const fastest = combData[0];
    summary.push(`\n**Fastest Runner:** ${fastest.runner}@${fastest.location} (${fastest.exec_time_ms}ms)`);
    
    // Find the most memory-efficient runner (if we have actual numbers)
    // This is a placeholder since we're using string representations for memory
    summary.push(`**Most Memory-Efficient:** ${combData[0].runner}@${combData[0].location} (${combData[0].memory_usage})`);
  }
  
  return summary.join("\n");
}

