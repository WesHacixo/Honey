/**
 * API Server Comb
 * A sample honeycomb task that starts a simple API server
 */

/**
 * Main entry point for the comb
 *
 * @param params Optional parameters for the API server
 * @returns Server result
 */
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Starting API server...");

  // Get port from params or use default
  const port = params.port as number || 8000;

  // Get duration from params or use default (5 seconds)
  const duration = params.duration as number || 5000;

  // Start the server
  const server = await startServer(port);

  // Simulate server running for a duration
  console.log(`Server running on port ${port}...`);
  await new Promise(resolve => setTimeout(resolve, duration));

  // Stop the server
  await stopServer(server);

  return {
    success: true,
    output: `API server ran successfully for ${duration}ms on port ${port}`,
    port,
    duration
  };
}

/**
 * Start a simple API server
 *
 * @param port Port to listen on
 * @returns Server object
 */
async function startServer(port: number): Promise<Deno.Listener> {
  console.log(`Starting server on port ${port}...`);

  // Create a TCP server
  const server = Deno.listen({ port });

  // Handle connections
  handleConnections(server);

  return server;
}

/**
 * Handle incoming connections
 *
 * @param server Server listener
 */
async function handleConnections(server: Deno.Listener): Promise<void> {
  // Handle connections in the background
  (async () => {
    for await (const conn of server) {
      handleConnection(conn);
    }
  })();
}

/**
 * Handle a single connection
 *
 * @param conn TCP connection
 */
async function handleConnection(conn: Deno.Conn): Promise<void> {
  // Handle HTTP connection
  const httpConn = Deno.serveHttp(conn);

  try {
    for await (const requestEvent of httpConn) {
      // Get the request URL
      const url = new URL(requestEvent.request.url);
      const path = url.pathname;

      // Handle different routes
      let response;

      if (path === "/" || path === "/health") {
        response = new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else if (path === "/info") {
        response = new Response(JSON.stringify({
          name: "Honey API Server",
          version: "1.0.0",
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        response = new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Send the response
      await requestEvent.respondWith(response);
    }
  } catch (error) {
    console.error("Error handling connection:", error);
  }
}

/**
 * Stop the server
 *
 * @param server Server to stop
 */
async function stopServer(server: Deno.Listener): Promise<void> {
  console.log("Stopping server...");
  server.close();
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}

