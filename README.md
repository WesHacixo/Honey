# 🍯 Honey Benchmark Swarm

A comprehensive benchmark system for evaluating different runtime environments for agent workloads.

[![CI/CD Pipeline](https://github.com/WesHacixo/Honey/actions/workflows/ci.yml/badge.svg)](https://github.com/WesHacixo/Honey/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-1.40+-blue.svg)](https://deno.land/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## Overview

Honey Benchmark Swarm is a system for running the same workload (called a "comb") across different runtime environments and comparing their performance. This helps determine the optimal execution environment for different types of agent workloads.

## ✨ Features

- **Multiple Runners**: Execute combs in Docker, Firecracker microVMs, or WebAssembly
- **Performance Metrics**: Measure boot time, execution time, memory usage, and CPU usage
- **Fallback Mechanisms**: Gracefully degrade to simpler execution methods when a runner is unavailable
- **Extensible**: Easy to add new combs and runners
- **Cloud/Local Comparison**: Compare performance between local and cloud environments
- **Security**: Input validation, resource limits, and isolation
- **Error Handling**: Robust error handling with custom error types and recovery mechanisms
- **Logging**: Structured logging with different log levels and sanitization
- **Testing**: Comprehensive test suite with unit and integration tests
- **CI/CD**: Automated testing, security scanning, and releases
- **Docker Support**: Ready-to-use Docker containers and compose setup
- **Documentation**: Complete API docs and getting started guides

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.40.0 or later
- [Docker](https://www.docker.com/) (optional, for Docker runner)

### Installation

```bash
# Clone the repository
git clone https://github.com/WesHacixo/Honey.git
cd Honey

# Run your first benchmark
deno run --allow-all bench/index.ts
```

### Using Make (Recommended)

```bash
# Setup development environment
make dev-setup

# Run default benchmark
make run

# List available combs
make run-list

# Run specific comb
make run-comb COMB=fibonacci

# Run tests
make test

# Run quality assurance checks
make qa
```

### Using Docker

```bash
# Build and run with Docker
make docker-build
make docker-run

# Or use Docker Compose for full stack
make docker-compose-up
```

## 📊 Usage Examples

### Basic Usage

```bash
# Run default benchmark
deno run --allow-all bench/index.ts

# List available combs
deno run --allow-all bench/index.ts --list

# Run specific comb
deno run --allow-all bench/index.ts fibonacci

# Run with specific runner
deno run --allow-all bench/index.ts process-data --runner=docker

# Run in specific location
deno run --allow-all bench/index.ts api-server --location=local
```

### Advanced Configuration

```bash
# Set environment variables
export HONEY_LOG_LEVEL=DEBUG
export HONEY_DOCKER_TIMEOUT=30000

# Run with debug logging
HONEY_LOG_LEVEL=DEBUG deno run --allow-all bench/index.ts
```

## 🧪 Available Combs

| Comb                | Description                | Use Case                  |
| ------------------- | -------------------------- | ------------------------- |
| `build-static-site` | Builds a static website    | Web development workflows |
| `process-data`      | Processes datasets         | Data processing pipelines |
| `api-server`        | Runs HTTP API server       | API performance testing   |
| `train-model`       | Trains ML model            | ML workflow benchmarking  |
| `fibonacci`         | CPU-intensive calculations | Mathematical operations   |
| `memory-stress`     | Memory allocation testing  | Memory performance        |
| `file-io`           | File system I/O testing    | Storage performance       |

## 🏃‍♂️ Runners

### Docker

- **Best for:** Isolated, reproducible environments
- **Security:** Container isolation, resource limits, no-new-privileges
- **Requirements:** Docker daemon running

### Firecracker

- **Best for:** Lightweight virtualization
- **Security:** VM isolation, resource limits, API validation
- **Requirements:** Firecracker binary and kernel/rootfs images

### WebAssembly (WASM)

- **Best for:** Lightweight, fast execution
- **Security:** Sandboxed execution, memory limits
- **Requirements:** WASM-compiled combs

## 🏗️ Architecture

```
honey/
├── bench/           # Benchmark orchestration
│   ├── index.ts     # Main benchmark runner
│   └── metrics.ts   # Metrics collection and reporting
├── combs/           # Honeycomb tasks
│   ├── build-static-site.egg.ts
│   ├── fibonacci.egg.ts
│   ├── memory-stress.egg.ts
│   └── file-io.egg.ts
├── runners/         # Runtime environments
│   ├── docker.ts    # Docker container runner
│   ├── firecracker.ts # Firecracker microVM runner
│   └── wasm.ts      # WebAssembly runner
├── queen/           # Orchestration logic
│   └── deploy.ts    # Deployment and tracking
├── layers/          # Utility layers
│   ├── security.ts  # Security utilities
│   ├── errors.ts    # Error handling
│   ├── logging.ts   # Logging system
│   ├── config.ts    # Configuration management
│   └── utils.ts     # Common utilities
├── tests/           # Test suite
│   ├── *.test.ts    # Unit tests
│   └── integration.test.ts # Integration tests
└── docs/            # Documentation
    ├── API.md       # API reference
    └── GETTING_STARTED.md # Getting started guide
```

## 🔒 Security Features

1. **Input Validation**: All user inputs are validated and sanitized
2. **Log Injection Prevention**: Sanitization prevents log injection attacks
3. **Path Traversal Protection**: File operations are secured against path traversal
4. **Container Security**: Docker containers run with security restrictions
5. **Resource Limits**: Memory and CPU limits prevent resource exhaustion
6. **Isolated Execution**: Each runner provides appropriate isolation

## 🧪 Testing

```bash
# Run all tests
make test

# Run only unit tests
deno run --allow-all tests/run_tests.ts --unit

# Run only integration tests (requires Docker)
deno run --allow-all tests/run_tests.ts --integration

# Run tests in watch mode
make test-watch
```

## 📚 Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Step-by-step setup and usage
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Changelog](CHANGELOG.md)** - Version history and changes

## 🛠️ Development

### Setup Development Environment

```bash
# Clone and setup
git clone https://github.com/WesHacixo/Honey.git
cd Honey
make dev-setup
```

### Quality Assurance

```bash
# Run all QA checks
make qa

# Individual checks
make lint          # Run linter
make format-check  # Check formatting
make check         # Type checking
make test          # Run tests
```

### Creating Custom Combs

```typescript
// combs/my-comb.egg.ts
export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  console.log("Running my comb...");

  // Your comb implementation here

  return {
    success: true,
    output: "My comb completed successfully",
  };
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
}
```

## 🐳 Docker Support

### Using Docker

```bash
# Build image
docker build -t honey-benchmark .

# Run container
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock honey-benchmark
```

### Using Docker Compose

```bash
# Start full stack (includes MongoDB, Redis, Dashboard)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ⚙️ Configuration

### Environment Variables

| Variable                    | Description                          | Default |
| --------------------------- | ------------------------------------ | ------- |
| `HONEY_LOG_LEVEL`           | Log level (DEBUG, INFO, WARN, ERROR) | `INFO`  |
| `HONEY_DOCKER_ENABLED`      | Enable Docker runner                 | `true`  |
| `HONEY_DOCKER_TIMEOUT`      | Docker operation timeout (ms)        | `60000` |
| `HONEY_FIRECRACKER_ENABLED` | Enable Firecracker runner            | `true`  |
| `HONEY_WASM_ENABLED`        | Enable WASM runner                   | `true`  |
| `HONEY_METRICS_ENABLED`     | Enable metrics collection            | `true`  |
| `HONEY_MONGODB_URI`         | MongoDB connection URI               | -       |
| `HONEY_PINECONE_API_KEY`    | Pinecone API key                     | -       |

### Configuration File

Modify `layers/config.ts` for persistent configuration changes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`make qa`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Deno](https://deno.land/) for modern TypeScript development
- Inspired by the need for better runtime environment benchmarking
- Security best practices from OWASP guidelines
