# Honey Benchmark Swarm Makefile
# Provides convenient commands for development and deployment

.PHONY: help install test lint format check build run clean docker-build docker-run docker-compose-up docker-compose-down docs

# Default target
help: ## Show this help message
	@echo "Honey Benchmark Swarm - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
install: ## Install dependencies and setup development environment
	@echo "🔧 Setting up development environment..."
	@deno cache bench/index.ts
	@deno cache tests/run_tests.ts
	@echo "✅ Development environment ready!"

test: ## Run all tests
	@echo "🧪 Running tests..."
	@deno run --allow-all tests/run_tests.ts

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	@deno run --allow-all --watch tests/run_tests.ts

lint: ## Run linter
	@echo "🔍 Running linter..."
	@deno lint

format: ## Format code
	@echo "✨ Formatting code..."
	@deno fmt

format-check: ## Check code formatting
	@echo "🔍 Checking code formatting..."
	@deno fmt --check

check: ## Run type checking
	@echo "🔍 Running type checking..."
	@deno check **/*.ts

# Quality assurance
qa: lint format-check check test ## Run all quality assurance checks

# Benchmark commands
run: ## Run default benchmark
	@echo "🍯 Running default benchmark..."
	@deno run --allow-all bench/index.ts

run-list: ## List available combs
	@echo "📋 Listing available combs..."
	@deno run --allow-all bench/index.ts --list

run-comb: ## Run specific comb (usage: make run-comb COMB=fibonacci)
	@echo "🍯 Running comb: $(COMB)"
	@deno run --allow-all bench/index.ts $(COMB)

run-docker: ## Run benchmark with Docker runner only
	@echo "🐳 Running benchmark with Docker runner..."
	@deno run --allow-all bench/index.ts --runner=docker

run-debug: ## Run benchmark with debug logging
	@echo "🐛 Running benchmark with debug logging..."
	@HONEY_LOG_LEVEL=DEBUG deno run --allow-all bench/index.ts

# Build commands
build: ## Build project (cache dependencies)
	@echo "🔨 Building project..."
	@deno cache bench/index.ts
	@deno cache tests/run_tests.ts
	@echo "✅ Build complete!"

# Docker commands
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t honey-benchmark:latest .
	@echo "✅ Docker image built!"

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	@docker run --rm -it \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/results:/app/results \
		honey-benchmark:latest

docker-shell: ## Open shell in Docker container
	@echo "🐳 Opening shell in Docker container..."
	@docker run --rm -it \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/app \
		--entrypoint /bin/bash \
		honey-benchmark:latest

# Docker Compose commands
docker-compose-up: ## Start all services with Docker Compose
	@echo "🐳 Starting services with Docker Compose..."
	@docker-compose up -d
	@echo "✅ Services started! Dashboard: http://localhost:8080"

docker-compose-down: ## Stop all services
	@echo "🐳 Stopping services..."
	@docker-compose down

docker-compose-logs: ## View logs from all services
	@docker-compose logs -f

docker-compose-rebuild: ## Rebuild and restart services
	@echo "🐳 Rebuilding services..."
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d

# Documentation commands
docs: ## Generate documentation
	@echo "📚 Documentation available in docs/ directory"
	@echo "  - docs/API.md - API documentation"
	@echo "  - docs/GETTING_STARTED.md - Getting started guide"
	@echo "  - README.md - Project overview"

docs-serve: ## Serve documentation locally (requires Python)
	@echo "📚 Serving documentation at http://localhost:8000"
	@cd docs && python3 -m http.server 8000

# Utility commands
clean: ## Clean temporary files and caches
	@echo "🧹 Cleaning temporary files..."
	@rm -rf .tmp temp-* test-temp-* results/
	@echo "✅ Cleanup complete!"

clean-docker: ## Clean Docker images and containers
	@echo "🧹 Cleaning Docker resources..."
	@docker system prune -f
	@docker image prune -f

# Development utilities
dev-setup: install ## Setup development environment
	@echo "🚀 Development environment setup complete!"
	@echo ""
	@echo "Quick start:"
	@echo "  make run          # Run default benchmark"
	@echo "  make test         # Run tests"
	@echo "  make qa           # Run all quality checks"

# Performance testing
perf-test: ## Run performance-focused benchmarks
	@echo "⚡ Running performance tests..."
	@deno run --allow-all bench/index.ts fibonacci
	@deno run --allow-all bench/index.ts memory-stress
	@deno run --allow-all bench/index.ts file-io

# CI/CD simulation
ci: qa build ## Simulate CI pipeline locally
	@echo "🚀 CI pipeline simulation complete!"

# Release preparation
release-check: ci docs ## Check if ready for release
	@echo "🔍 Checking release readiness..."
	@echo "✅ All checks passed! Ready for release."

# Environment setup
env-example: ## Create example environment file
	@echo "📝 Creating example environment file..."
	@cat > .env.example << 'EOF'
# Honey Benchmark Swarm Environment Configuration

# Log level (DEBUG, INFO, WARN, ERROR, NONE)
HONEY_LOG_LEVEL=INFO

# Runner configuration
HONEY_DOCKER_ENABLED=true
HONEY_DOCKER_TIMEOUT=60000
HONEY_DOCKER_IMAGE=denoland/deno:alpine
HONEY_FIRECRACKER_ENABLED=false
HONEY_WASM_ENABLED=true

# Metrics configuration
HONEY_METRICS_ENABLED=true
HONEY_MONGODB_URI=mongodb://localhost:27017
HONEY_PINECONE_API_KEY=

# Security settings
HONEY_VALIDATE_INPUTS=true
HONEY_SANITIZE_OUTPUTS=true
EOF
	@echo "✅ Example environment file created: .env.example"

# Show project status
status: ## Show project status and useful information
	@echo "🍯 Honey Benchmark Swarm Status"
	@echo ""
	@echo "📊 Project Statistics:"
	@echo "  TypeScript files: $$(find . -name '*.ts' | wc -l)"
	@echo "  Test files: $$(find tests/ -name '*.test.ts' 2>/dev/null | wc -l || echo 0)"
	@echo "  Combs: $$(find combs/ -name '*.egg.ts' 2>/dev/null | wc -l || echo 0)"
	@echo ""
	@echo "🔧 Environment:"
	@echo "  Deno version: $$(deno --version | head -1)"
	@echo "  Docker available: $$(docker --version >/dev/null 2>&1 && echo 'Yes' || echo 'No')"
	@echo ""
	@echo "📋 Available combs:"
	@find combs/ -name '*.egg.ts' 2>/dev/null | sed 's|combs/||' | sed 's|.egg.ts||' | sed 's|^|  - |' || echo "  No combs found"

# Variables for parameterized commands
COMB ?= build-static-site
RUNNER ?= 
LOCATION ?= 
LOG_LEVEL ?= INFO

