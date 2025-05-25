# Getting Started with Honey Benchmark Swarm

## Quick Start

Honey Benchmark Swarm is a powerful benchmarking system for evaluating different runtime environments. Get up and running in minutes!

### Prerequisites

- [Deno](https://deno.land/) 1.40.0 or later
- [Docker](https://www.docker.com/) (optional, for Docker runner)
- [Git](https://git-scm.com/) for cloning the repository

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/WesHacixo/Honey.git
   cd Honey
   ```

2. **Verify installation:**
   ```bash
   deno run --allow-all bench/index.ts --list
   ```

   You should see a list of available combs.

### Your First Benchmark

Run your first benchmark with the default comb:

```bash
deno run --allow-all bench/index.ts
```

This will:

- Run the `build-static-site` comb across all available runners
- Measure performance metrics (boot time, execution time, memory, CPU)
- Display a summary with recommendations

### Understanding the Output

```
🍯 HONEY BENCHMARK SWARM 🐝
Running benchmark for comb: build-static-site

[ RUNNING ] DOCKER @ local
[ SUCCESS ] docker@local - 1.25s

[ RUNNING ] FIRECRACKER @ local
[ FAILED  ] firecracker@local - Runner not available: firecracker

[ RUNNING ] WASM @ local
[ SUCCESS ] wasm@local - 850ms

## build-static-site

| Runner | Location | Boot Time | Exec Time | Memory | CPU | Success |
|--------|----------|-----------|-----------|--------|-----|---------|
| wasm | local | 50ms | 850ms | 45MB | 15% | true |
| docker | local | 200ms | 1.25s | 128MB | 25% | true |

**Fastest Runner:** wasm@local (850ms)
**Most Memory-Efficient:** wasm@local (45MB)

🏆 RECOMMENDED ENVIRONMENT: wasm@local
   Boot Time: 50ms
   Exec Time: 850ms
   Memory: 45MB
   CPU: 15%
```

## Available Commands

### List Available Combs

```bash
deno run --allow-all bench/index.ts --list
```

### Run Specific Comb

```bash
deno run --allow-all bench/index.ts process-data
```

### Run with Specific Runner

```bash
deno run --allow-all bench/index.ts build-static-site --runner=docker
```

### Run in Specific Location

```bash
deno run --allow-all bench/index.ts api-server --location=local
```

### Combine Options

```bash
deno run --allow-all bench/index.ts train-model --runner=docker --location=cloud
```

## Available Combs

Honey comes with several built-in combs:

### 1. build-static-site

Simulates building a static website with multiple steps.

**What it does:**

- Sets up build environment
- Processes templates
- Compiles assets
- Generates output

**Use case:** Web development workflows

### 2. process-data

Processes a dataset through multiple transformation steps.

**What it does:**

- Loads sample data
- Applies transformations
- Validates results
- Exports processed data

**Use case:** Data processing pipelines

### 3. api-server

Runs a simple HTTP API server.

**What it does:**

- Starts HTTP server
- Handles sample requests
- Processes responses
- Measures throughput

**Use case:** API performance testing

### 4. train-model

Simulates training a simple machine learning model.

**What it does:**

- Generates training data
- Trains model
- Validates accuracy
- Exports model

**Use case:** ML workflow benchmarking

## Runners Explained

### Docker Runner

- **Best for:** Isolated, reproducible environments
- **Pros:** Strong isolation, consistent environment
- **Cons:** Higher overhead, slower startup
- **Requirements:** Docker daemon running

### Firecracker Runner

- **Best for:** Lightweight virtualization
- **Pros:** Fast startup, good isolation
- **Cons:** Linux only, requires setup
- **Requirements:** Firecracker binary and kernel/rootfs images

### WASM Runner

- **Best for:** Lightweight, fast execution
- **Pros:** Very fast startup, minimal overhead
- **Cons:** Limited system access
- **Requirements:** WASM-compiled combs

## Creating Your First Custom Comb

1. **Create a new comb file:**
   ```bash
   touch combs/my-first-comb.egg.ts
   ```

2. **Add the basic structure:**
   ```typescript
   // combs/my-first-comb.egg.ts
   export async function main(
     params: Record<string, unknown> = {},
   ): Promise<Record<string, unknown>> {
     console.log("🚀 Running my first comb!");

     // Simulate some work
     await new Promise((resolve) => setTimeout(resolve, 100));

     return {
       success: true,
       message: "Hello from my first comb!",
       processingTime: 100,
     };
   }

   // Allow running directly
   if (import.meta.main) {
     const result = await main();
     console.log(JSON.stringify(result, null, 2));
   }
   ```

3. **Test your comb:**
   ```bash
   # Test directly
   deno run --allow-all combs/my-first-comb.egg.ts

   # Run through benchmark system
   deno run --allow-all bench/index.ts my-first-comb
   ```

## Configuration

### Environment Variables

Control Honey's behavior with environment variables:

```bash
# Set log level
export HONEY_LOG_LEVEL=DEBUG

# Disable specific runners
export HONEY_FIRECRACKER_ENABLED=false

# Configure Docker
export HONEY_DOCKER_IMAGE=node:18-alpine
export HONEY_DOCKER_TIMEOUT=30000

# Enable metrics storage
export HONEY_MONGODB_URI=mongodb://localhost:27017
export HONEY_PINECONE_API_KEY=your-api-key
```

### Configuration File

Modify `layers/config.ts` for persistent configuration changes:

```typescript
// Example: Disable Firecracker by default
const defaultConfig = {
  // ... other config
  runners: {
    docker: { enabled: true /* ... */ },
    firecracker: { enabled: false /* ... */ }, // Disabled
    wasm: { enabled: true /* ... */ },
  },
};
```

## Troubleshooting

### Common Issues

#### "Runner not available" errors

- **Docker:** Ensure Docker daemon is running
- **Firecracker:** Install Firecracker and configure paths
- **WASM:** Ensure combs are compiled to WASM

#### Permission errors

Make sure to run with appropriate permissions:

```bash
deno run --allow-all bench/index.ts
```

#### Slow performance

- Check system resources
- Reduce concurrent runners
- Use faster storage (SSD)

### Debug Mode

Enable debug logging for detailed information:

```bash
export HONEY_LOG_LEVEL=DEBUG
deno run --allow-all bench/index.ts
```

### Getting Help

1. **Check the logs:** Debug mode provides detailed information
2. **Review documentation:** See `docs/` directory for detailed guides
3. **Check issues:** Look for similar issues on GitHub
4. **Create an issue:** Report bugs or request features

## Next Steps

Now that you're up and running:

1. **Explore existing combs** to understand patterns
2. **Create custom combs** for your specific use cases
3. **Configure runners** for your environment
4. **Set up CI/CD** to run benchmarks automatically
5. **Integrate with your workflow** using the API

## Advanced Usage

### Running Tests

```bash
# Run all tests
deno run --allow-all tests/run_tests.ts

# Run specific test suite
deno run --allow-all tests/security.test.ts
```

### Docker Integration

```bash
# Build Docker image (when Dockerfile is added)
docker build -t honey-benchmark .

# Run in container
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock honey-benchmark
```

### CI/CD Integration

The included GitHub Actions workflow automatically:

- Runs tests on every PR
- Performs security scans
- Creates releases on main branch pushes

See `.github/workflows/ci.yml` for details.

## Performance Tips

1. **Use SSD storage** for better I/O performance
2. **Allocate sufficient memory** for concurrent runners
3. **Close unnecessary applications** during benchmarking
4. **Run multiple iterations** for consistent results
5. **Use dedicated hardware** for production benchmarks

Happy benchmarking! 🍯🐝
