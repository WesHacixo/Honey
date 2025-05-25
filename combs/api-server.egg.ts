/**
 * API Server Comb
 * A sample honeycomb task that starts a simple API server
 */

/**
 * Main function for the API server comb
 *
 * @param params Optional parameters for the API server
 * @returns Execution result
 */
export async function main(params?: Record<string, unknown>) {
  console.log("Starting API server...");

  // Get port from params or use default
  const port = (params?.port as number) || 8080;
  const duration = (params?.duration as number) || 5000;

  console.log(`Server will run on port ${port} for ${duration}ms`);

  // Start the server
  const server = startServer(port);

  // Simulate server running for a duration
  console.log(`Server running for ${duration}ms...`);
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Stop the server
  await stopServer(server);

  return {
    success: true,
    output: `API server ran successfully for ${duration}ms on port ${port}`,
  };
}

/**
 * Start a simple API server
 *
 * @param port Port to listen on
 * @returns Server instance
 */
function startServer(port: number): Deno.HttpServer {
  console.log(`Starting server on port ${port}...`);

  // Create HTTP server using new Deno.serve API
  const server = Deno.serve({
    port,
    handler: handleRequest,
  });

  return server;
}

/**
 * Handle HTTP requests
 *
 * @param request HTTP request
 * @returns HTTP response
 */
function handleRequest(request: Request): Response {
  // Get the request URL
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle different routes
  if (path === "/" || path === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else if (path === "/info") {
    return new Response(
      JSON.stringify({
        name: "Honey API Server",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } else {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Stop the server
 *
 * @param server Server to stop
 */
async function stopServer(server: Deno.HttpServer): Promise<void> {
  console.log("Stopping server...");
  await server.shutdown();
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
