/**
 * Build Static Site Comb
 * A sample honeycomb task that builds a static website
 */

/**
 * Main entry point for the comb
 *
 * @param params Optional parameters for the build
 * @returns Build result
 */
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Building static site...");

  // Simulate build steps
  await simulateBuildSteps();

  return {
    success: true,
    output: "Static site built successfully",
    artifacts: [
      "dist/index.html",
      "dist/styles.css",
      "dist/main.js",
    ],
  };
}

/**
 * Simulate the steps involved in building a static site
 */
async function simulateBuildSteps(): Promise<void> {
  // Step 1: Clean output directory
  console.log("Step 1: Cleaning output directory...");
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Step 2: Compile templates
  console.log("Step 2: Compiling templates...");
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Step 3: Process CSS
  console.log("Step 3: Processing CSS...");
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Step 4: Bundle JavaScript
  console.log("Step 4: Bundling JavaScript...");
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Step 5: Optimize images
  console.log("Step 5: Optimizing images...");
  await new Promise((resolve) => setTimeout(resolve, 250));

  // Step 6: Generate sitemap
  console.log("Step 6: Generating sitemap...");
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log("Build completed!");
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
