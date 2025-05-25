/**
 * Process Data Comb
 * A sample honeycomb task that processes a dataset
 */

/**
 * Main entry point for the comb
 * 
 * @param params Optional parameters for the data processing
 * @returns Processing result
 */
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Processing data...");
  
  // Get dataset size from params or use default
  const datasetSize = params.datasetSize as number || 1000;
  
  // Generate sample dataset
  const dataset = generateDataset(datasetSize);
  
  // Process the dataset
  const result = await processDataset(dataset);
  
  return {
    success: true,
    output: "Data processing completed successfully",
    stats: result,
    processed_items: datasetSize
  };
}

/**
 * Generate a sample dataset
 * 
 * @param size Size of the dataset to generate
 * @returns Array of data items
 */
function generateDataset(size: number): Array<Record<string, unknown>> {
  console.log(`Generating dataset with ${size} items...`);
  
  const dataset = [];
  
  for (let i = 0; i < size; i++) {
    dataset.push({
      id: i,
      value: Math.random() * 100,
      category: ["A", "B", "C"][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    });
  }
  
  return dataset;
}

/**
 * Process a dataset
 * 
 * @param dataset Array of data items to process
 * @returns Processing statistics
 */
async function processDataset(dataset: Array<Record<string, unknown>>): Promise<Record<string, unknown>> {
  console.log("Processing dataset...");
  
  // Simulate processing steps
  await simulateProcessingSteps(dataset);
  
  // Calculate statistics
  const stats = calculateStatistics(dataset);
  
  return stats;
}

/**
 * Simulate the steps involved in processing a dataset
 * 
 * @param dataset Array of data items to process
 */
async function simulateProcessingSteps(dataset: Array<Record<string, unknown>>): Promise<void> {
  // Step 1: Data cleaning
  console.log("Step 1: Cleaning data...");
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 2: Feature extraction
  console.log("Step 2: Extracting features...");
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Step 3: Normalization
  console.log("Step 3: Normalizing data...");
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 4: Aggregation
  console.log("Step 4: Aggregating results...");
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log("Processing completed!");
}

/**
 * Calculate statistics for a dataset
 * 
 * @param dataset Array of data items
 * @returns Statistical summary
 */
function calculateStatistics(dataset: Array<Record<string, unknown>>): Record<string, unknown> {
  // Calculate average value
  const sum = dataset.reduce((acc, item) => acc + (item.value as number), 0);
  const average = sum / dataset.length;
  
  // Count items by category
  const categoryCounts: Record<string, number> = {};
  dataset.forEach(item => {
    const category = item.category as string;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Find min and max values
  const values = dataset.map(item => item.value as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    count: dataset.length,
    average,
    min,
    max,
    categories: categoryCounts
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}

