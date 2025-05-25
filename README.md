# 🍯 Honey Benchmark Swarm

A benchmark system for evaluating different runtime environments for agent workloads.

## Overview

Honey Benchmark Swarm is a system for running the same workload (called a "comb") across different runtime environments and comparing their performance. This helps determine the optimal execution environment for different types of agent workloads.

## Features

- **Multiple Runners**: Execute combs in Docker, Firecracker microVMs, or WebAssembly
- **Performance Metrics**: Measure boot time, execution time, memory usage, and CPU usage
- **Fallback Mechanisms**: Gracefully degrade to simpler execution methods when a runner is unavailable
- **Extensible**: Easy to add new combs and runners
- **Cloud/Local Comparison**: Compare performance between local and cloud environments
- **Security**: Input validation, resource limits, and isolation
- **Error Handling**: Robust error handling with custom error types and recovery mechanisms
- **Logging**: Structured logging with different log levels

## Installation

```bash
# Clone the repository
git clone https://github.com/WesHacixo/Honey.git
cd Honey

# Install Deno if you don't have it already
# https://deno.land/manual/getting_started/installation
```

## Usage

```bash
# Run a benchmark with the default comb
deno run --allow-run --allow-net --allow-env --allow-read bench/index.ts

# Run a specific comb
deno run --allow-run --allow-net --allow-env --allow-read bench/index.ts process-data

# List available combs
deno run --allow-run --allow-net --allow-env --allow-read bench/index.ts --list

# Run with a specific runner
deno run --allow-run --allow-net --allow-env --allow-read bench/index.ts process-data --runner=docker

# Run in a specific location
deno run --allow-run --allow-net --allow-env --allow-read bench/index.ts process-data --location=local
```

## Available Combs

1. **build-static-site**: Builds a static website
2. **process-data**: Processes a dataset with multiple steps
3. **api-server**: Runs a simple API server
4. **train-model**: Trains a simple machine learning model

## Runners

### Docker

Runs combs in Docker containers. Requires Docker to be installed and running.

- **Security Features**: 
  - Container name validation
  - Resource limits (memory, CPU)
  - No-new-privileges security option
  - Read-only mounts
  - Input validation

- **Error Handling**:
  - Timeout support
  - Automatic container cleanup
  - Fallback to direct execution
  - Structured error reporting

### Firecracker

Runs combs in Firecracker microVMs. Requires Firecracker to be installed.

- **Security Features**:
  - Socket path validation
  - Resource limits (memory, vCPUs)
  - File path validation
  - API request validation

- **Error Handling**:
  - Socket creation timeout
  - API error handling
  - Process cleanup
  - Fallback to simulation mode

### WebAssembly (WASM)

Runs combs as WebAssembly modules. Requires combs to be compiled to WASM.

- **Security Features**:
  - Memory limits
  - Input validation
  - Isolated execution environment

- **Error Handling**:
  - Module loading error handling
  - Execution timeout
  - Fallback to simulation mode

## Architecture

```
honey/
├── bench/           # Benchmark orchestration
│   ├── index.ts     # Main benchmark runner
│   └── metrics.ts   # Metrics collection and reporting
├── combs/           # Honeycomb tasks
│   ├── build-static-site.egg.ts
│   ├── process-data.egg.ts
│   ├── api-server.egg.ts
│   └── train-model.egg.ts
├── runners/         # Runtime environments
│   ├── docker.ts    # Docker container runner
│   ├── firecracker.ts # Firecracker microVM runner
│   └── wasm.ts      # WebAssembly runner
├── queen/           # Orchestration logic
│   └── deploy.ts    # Deployment and tracking
└── layers/          # Utility layers
    ├── security.ts  # Security utilities
    ├── errors.ts    # Error handling
    ├── logging.ts   # Logging system
    ├── config.ts    # Configuration management
    └── utils.ts     # Common utilities
```

## Security Features

Honey Benchmark Swarm includes several security features to ensure safe execution of combs:

1. **Input Validation**:
   - Comb name validation
   - File path validation
   - Container name validation
   - Port number validation
   - Location validation
   - Runner validation

2. **Resource Limits**:
   - Memory limits
   - CPU limits
   - Network configuration
   - Disk access restrictions

3. **Docker Security**:
   - No new privileges
   - Read-only mounts
   - Resource constraints
   - Secure container naming

4. **Firecracker Security**:
   - Socket path validation
   - Resource limits
   - API request validation
   - File access controls

5. **WASM Security**:
   - Memory limits
   - Isolated execution environment
   - Module validation

## Error Handling

The system includes robust error handling mechanisms:

1. **Custom Error Classes**:
   - HoneyError base class
   - Runner-specific errors
   - Validation errors
   - Security errors
   - Timeout errors

2. **Error Recovery**:
   - Retry mechanisms
   - Fallback modes
   - Graceful degradation
   - Resource cleanup

3. **Logging**:
   - Structured logging
   - Log levels
   - Component-specific logs
   - Error context

4. **Timeout Handling**:
   - Operation timeouts
   - Cleanup procedures
   - Error reporting
   - Resource recovery

## Creating a New Comb

1. Create a new file in the `combs/` directory with the `.egg.ts` extension
2. Implement the `main()` function that returns a result object
3. Make sure it works when executed directly

Example:

```typescript
// combs/my-comb.egg.ts
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Running my comb...");
  
  // Your comb implementation here
  
  return {
    success: true,
    output: "My comb completed successfully"
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
```

## Configuration

Honey Benchmark Swarm uses a centralized configuration system in `layers/config.ts`. You can customize the behavior by:

1. Modifying the configuration file directly
2. Setting environment variables (e.g., `HONEY_LOG_LEVEL=DEBUG`)
3. Creating environment-specific configurations

## License

MIT

