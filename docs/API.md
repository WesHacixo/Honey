# Honey Benchmark Swarm API Documentation

## Overview

Honey Benchmark Swarm provides a comprehensive API for benchmarking different
runtime environments. This document covers all the modules, functions, and
interfaces available.

## Core Modules

### Benchmark Runner (`bench/index.ts`)

The main entry point for running benchmarks.

#### Functions

##### `runBenchmark(comb: string, options?: BenchmarkOptions): Promise<void>`

Runs a benchmark for the specified comb across all configured environments.

**Parameters:**

- `comb`: Name of the comb to benchmark
- `options`: Optional configuration object

**Options:**

```typescript
interface BenchmarkOptions {
  runner?: string; // Specific runner to use
  location?: string; // Specific location to use
  params?: Record<string, unknown>; // Parameters to pass to comb
}
```

**Example:**

```typescript
import { runBenchmark } from './bench/index.ts';

// Run default benchmark
await runBenchmark('build-static-site');

// Run with specific options
await runBenchmark('process-data', {
  runner: 'docker',
  location: 'local',
  params: { dataSize: 'large' },
});
```

##### `listAvailableCombs(): Promise<void>`

Lists all available combs in the system.

### Metrics (`bench/metrics.ts`)

Handles recording and summarizing benchmark results.

#### Functions

##### `recordMetrics(result: BenchmarkResult): Promise<void>`

Records benchmark metrics to configured storage backends.

**Parameters:**

- `result`: Benchmark result object

##### `summarizeResults(results: BenchmarkResult[]): string`

Generates a formatted summary of benchmark results.

**Parameters:**

- `results`: Array of benchmark results

**Returns:** Formatted markdown table with results

### Security (`layers/security.ts`)

Provides input validation and sanitization functions.

#### Functions

##### `validateCombName(name: string): boolean`

Validates that a comb name is safe to use.

##### `sanitizeCombName(name: string): string`

Sanitizes a comb name for safe usage.

##### `sanitizeForLogging(input: unknown): string`

Sanitizes input for safe logging (prevents log injection).

##### `validateFilePath(path: string): boolean`

Validates that a file path is safe (prevents path traversal).

##### `validateContainerName(name: string): boolean`

Validates Docker container names.

##### `validatePort(port: number): boolean`

Validates port numbers (1-65535).

##### `validateLocation(location: string): boolean`

Validates location names.

##### `validateRunner(runner: string): boolean`

Validates runner names.

### Error Handling (`layers/errors.ts`)

Custom error classes and error handling utilities.

#### Error Classes

##### `HoneyError`

Base error class for all Honey-specific errors.

##### `CombNotFoundError`

Thrown when a requested comb cannot be found.

##### `RunnerNotAvailableError`

Thrown when a requested runner is not available.

##### `RunnerExecutionError`

Thrown when runner execution fails.

##### `ValidationError`

Thrown when input validation fails.

##### `SecurityError`

Thrown when security checks fail.

##### `TimeoutError`

Thrown when operations timeout.

##### `ResourceNotAvailableError`

Thrown when required resources are unavailable.

#### Utility Functions

##### `createErrorResult(error: Error, runner: string, location: string, comb: string): BenchmarkResult`

Creates a standardized error result object.

##### `withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, operationName: string): Promise<T>`

Executes a function with a timeout.

##### `withRetry<T>(fn: () => Promise<T>, maxRetries?: number, initialDelayMs?: number, maxDelayMs?: number): Promise<T>`

Retries a function with exponential backoff.

### Utilities (`layers/utils.ts`)

Common utility functions.

#### Functions

##### `formatDuration(ms: number): string`

Formats milliseconds into human-readable duration.

##### `parseMemory(memoryString: string): number | null`

Parses memory strings (e.g., "1GB") into bytes.

##### `formatMemory(bytes: number): string`

Formats bytes into human-readable memory size.

##### `generateContextId(): string`

Generates a unique context ID (UUID v4).

##### `sleep(ms: number): Promise<void>`

Async sleep function.

##### `isValidUrl(url: string): boolean`

Validates HTTP/HTTPS URLs.

##### `sanitizeFilename(filename: string): string`

Sanitizes filenames for safe filesystem usage.

##### `getFileExtension(filename: string): string`

Extracts file extension from filename.

##### `ensureDirectory(path: string): Promise<void>`

Ensures a directory exists, creating it if necessary.

##### `listCombs(): Promise<string[]>`

Lists all available combs in the combs directory.

### Configuration (`layers/config.ts`)

Centralized configuration management.

#### Configuration Structure

```typescript
interface Config {
  appName: string;
  version: string;
  logLevel: LogLevel;
  runners: {
    docker: DockerConfig;
    firecracker: FirecrackerConfig;
    wasm: WasmConfig;
  };
  locations: {
    local: LocalConfig;
    cloud: CloudConfig;
  };
  metrics: MetricsConfig;
  security: SecurityConfig;
}
```

#### Environment Variables

- `HONEY_ENV`: Environment (development, test, production)
- `HONEY_LOG_LEVEL`: Log level (DEBUG, INFO, WARN, ERROR, NONE)
- `HONEY_DOCKER_ENABLED`: Enable/disable Docker runner
- `HONEY_DOCKER_TIMEOUT`: Docker operation timeout
- `HONEY_DOCKER_IMAGE`: Default Docker image
- `HONEY_FIRECRACKER_ENABLED`: Enable/disable Firecracker runner
- `HONEY_WASM_ENABLED`: Enable/disable WASM runner
- `HONEY_METRICS_ENABLED`: Enable/disable metrics collection
- `HONEY_MONGODB_URI`: MongoDB connection URI
- `HONEY_PINECONE_API_KEY`: Pinecone API key

### Logging (`layers/logging.ts`)

Structured logging system with sanitization.

#### Functions

##### `createLogger(component: string): Logger`

Creates a component-specific logger.

##### `setLogLevel(level: LogLevel): void`

Sets the global log level.

#### Logger Interface

```typescript
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void;
  success(message: string, context?: Record<string, unknown>): void;
}
```

## Runners

### Docker Runner (`runners/docker.ts`)

Executes combs in Docker containers.

#### Configuration

```typescript
interface DockerConfig {
  enabled: boolean;
  timeout: number;
  image: string;
  maxRetries: number;
  securityOpts: string[];
  resourceLimits: {
    memory: string;
    cpus: string;
  };
}
```

### Firecracker Runner (`runners/firecracker.ts`)

Executes combs in Firecracker microVMs.

#### Configuration

```typescript
interface FirecrackerConfig {
  enabled: boolean;
  timeout: number;
  socketPath: string;
  kernelPath: string;
  rootfsPath: string;
  maxRetries: number;
  resourceLimits: {
    memory: string;
    vcpus: number;
  };
}
```

### WASM Runner (`runners/wasm.ts`)

Executes combs as WebAssembly modules.

#### Configuration

```typescript
interface WasmConfig {
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  memory: {
    initial: number;
    maximum: number;
  };
}
```

## Data Types

### BenchmarkResult

```typescript
interface BenchmarkResult {
  success: boolean;
  comb: string;
  runner: string;
  location: string;
  boot_time_ms: number;
  exec_time_ms: number;
  memory_usage: string;
  cpu_usage: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  error?: string;
  error_type?: string;
  contextId: string;
  timestamp: string;
}
```

### CombInterface

```typescript
interface CombInterface {
  main(params?: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

## Examples

### Creating a Custom Comb

```typescript
// combs/my-custom-comb.egg.ts
export async function main(
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  console.log('Running my custom comb...');

  // Your comb logic here
  const result = await performSomeWork(params);

  return {
    success: true,
    output: result,
    metrics: {
      itemsProcessed: 100,
      averageTime: 50,
    },
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
```

### Using the API Programmatically

```typescript
import { runBenchmark } from './bench/index.ts';
import { createLogger } from './layers/logging.ts';

const logger = createLogger('my-app');

try {
  // Run a specific benchmark
  await runBenchmark('my-custom-comb', {
    runner: 'docker',
    location: 'local',
    params: {
      dataSize: 'large',
      iterations: 1000,
    },
  });

  logger.success('Benchmark completed successfully');
} catch (error) {
  logger.error('Benchmark failed', error);
}
```

### Error Handling

```typescript
import { TimeoutError, withRetry, withTimeout } from './layers/errors.ts';

try {
  // Execute with timeout
  const result = await withTimeout(
    async () => {
      return await someSlowOperation();
    },
    5000, // 5 second timeout
    'slow operation',
  );

  // Execute with retry
  const retryResult = await withRetry(
    async () => {
      return await unreliableOperation();
    },
    3, // max 3 retries
    100, // 100ms initial delay
    5000, // 5s max delay
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Operation timed out');
  } else {
    console.log('Operation failed:', error.message);
  }
}
```
