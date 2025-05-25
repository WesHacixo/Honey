# 🍯 Honey Benchmark Swarm

A benchmark system for evaluating and comparing different runtime environments for agent tasks. Honey helps determine the optimal execution environment for your workloads by running the same task across multiple runtimes and measuring performance metrics.

> **Note:** This repository is intended to be merged with [CLIaigen](https://github.com/WesHacixo/CLIaigen) as an integral part of that software.

## 🐝 Overview

Honey Benchmark Swarm runs a standard task (e.g., `build-static-site`) across 6 honeycomb environments:

- **Docker-local**
- **Docker-cloud**
- **Firecracker-local**
- **Firecracker-cloud**
- **WASM-local**
- **WASM-cloud**

For each environment, it measures and records:

| Metric | Description |
|--------|-------------|
| `boot_time_ms` | Time to start the runtime environment |
| `exec_time_ms` | Duration of task execution |
| `memory_usage` | Memory consumed during execution |
| `cpu_usage` | CPU utilization during execution |
| `success` | Whether the task completed successfully |

## 📁 Repository Structure

```
honey/
├── bench/
│   ├── index.ts       # Benchmark runner
│   └── metrics.ts     # Metrics logger and summarizer
├── combs/
│   └── build-static-site.egg.ts  # Sample comb task
├── runners/
│   ├── docker.ts      # Docker runner implementation
│   ├── firecracker.ts # Firecracker runner (stub)
│   └── wasm.ts        # WebAssembly runner (stub)
└── queen/
    └── deploy.ts      # Orchestration logic
```

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) 1.32.0 or later
- [Docker](https://www.docker.com/) for Docker runner
- [Firecracker](https://firecracker-microvm.github.io/) for Firecracker runner (optional)
- WebAssembly runtime for WASM runner (optional)

### Running a Benchmark

```bash
# Run the default benchmark (build-static-site)
deno run --allow-run --allow-net --allow-env --allow-read honey/bench/index.ts

# Run a specific comb
deno run --allow-run --allow-net --allow-env --allow-read honey/bench/index.ts my-custom-comb
```

## 🔍 How It Works

1. The benchmark runner (`bench/index.ts`) iterates through all combinations of runners and locations.
2. For each combination, it uses the Queen orchestration (`queen/deploy.ts`) to deploy the comb to the appropriate runtime.
3. The runner executes the comb and collects performance metrics.
4. Metrics are recorded to MongoDB and Pinecone via the metrics module (`bench/metrics.ts`).
5. A summary is generated comparing all environments.
6. The optimal environment is recommended based on the metrics.

## 🧩 Integration with CLIaigen

Honey is designed to be integrated with CLIaigen to provide runtime environment optimization. When integrated:

1. CLIaigen can use Honey to determine the best runtime for a given task.
2. Performance metrics will be stored in the same database layer used by CLIaigen.
3. Semantic search capabilities will allow finding similar past executions.

## 🛠️ Development

### Creating a New Comb

1. Create a new file in the `combs/` directory with the `.egg.ts` extension.
2. Implement the `main()` function as the entry point.
3. Return a result object with at least a `success` property.

Example:

```typescript
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  // Implement your task here
  return {
    success: true,
    output: "Task completed successfully"
  };
}
```

### Implementing a New Runner

1. Create a new file in the `runners/` directory.
2. Implement the `run(comb: string, location: string)` function.
3. Return performance metrics and execution results.
4. Update `queen/deploy.ts` to use the new runner.

## 📊 Benefits

- **Self-Optimizing**: Pick the best environment for a task based on real data.
- **Pluggable Future**: Easy to add more runtimes (e.g., Podman, gVisor).
- **Transparent Tradeoffs**: Make speed vs. isolation vs. memory tradeoffs visible.
- **Dev-Ready**: Build confidence in deploy pipelines with real metrics.

## 📝 License

MIT

