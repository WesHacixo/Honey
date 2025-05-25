/**
 * Train Model Comb
 * A sample honeycomb task that trains a simple machine learning model
 */

/**
 * Main entry point for the comb
 *
 * @param params Optional parameters for model training
 * @returns Training result
 */
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Training machine learning model...");

  // Get dataset size from params or use default
  const datasetSize = params.datasetSize as number || 1000;

  // Get epochs from params or use default
  const epochs = params.epochs as number || 10;

  // Generate training dataset
  const dataset = generateDataset(datasetSize);

  // Train the model
  const trainingResult = await trainModel(dataset, epochs);

  return {
    success: true,
    output: "Model training completed successfully",
    metrics: trainingResult,
    dataset_size: datasetSize,
    epochs,
  };
}

/**
 * Generate a sample dataset for training
 *
 * @param size Size of the dataset to generate
 * @returns Training dataset
 */
function generateDataset(size: number): Array<Record<string, unknown>> {
  console.log(`Generating dataset with ${size} samples...`);

  const dataset = [];

  for (let i = 0; i < size; i++) {
    // Generate a simple linear relationship with some noise
    const x1 = Math.random() * 10;
    const x2 = Math.random() * 5;
    const noise = (Math.random() - 0.5) * 2;
    const y = 2 * x1 + 3 * x2 + noise;

    dataset.push({
      features: [x1, x2],
      label: y,
    });
  }

  return dataset;
}

/**
 * Train a simple linear regression model
 *
 * @param dataset Training dataset
 * @param epochs Number of training epochs
 * @returns Training metrics
 */
async function trainModel(
  dataset: Array<Record<string, unknown>>,
  epochs: number,
): Promise<Record<string, unknown>> {
  console.log(`Training model for ${epochs} epochs...`);

  // Simple linear regression training simulation
  const weights = [0, 0];
  let bias = 0;
  const learningRate = 0.01;

  // Training history
  const history: Array<Record<string, unknown>> = [];

  // Train for specified number of epochs
  for (let epoch = 0; epoch < epochs; epoch++) {
    console.log(`Epoch ${epoch + 1}/${epochs}...`);

    // Simulate epoch training time
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Compute predictions and update parameters
    let totalLoss = 0;

    for (const sample of dataset) {
      const features = sample.features as number[];
      const label = sample.label as number;

      // Compute prediction
      const prediction = features[0] * weights[0] + features[1] * weights[1] + bias;

      // Compute loss
      const loss = prediction - label;
      totalLoss += loss * loss;

      // Update parameters
      weights[0] -= learningRate * loss * features[0];
      weights[1] -= learningRate * loss * features[1];
      bias -= learningRate * loss;
    }

    // Compute mean squared error
    const mse = totalLoss / dataset.length;

    // Record metrics for this epoch
    history.push({
      epoch: epoch + 1,
      mse,
      weights: [...weights],
      bias,
    });
  }

  // Final model parameters
  const finalModel = {
    weights,
    bias,
  };

  return {
    model: finalModel,
    history,
    final_mse: history[history.length - 1].mse,
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
