# Development Guide

This guide covers the development workflow, code quality standards, and tooling
for the Honey benchmark system.

## 🚀 Quick Start

1. **Setup Development Environment**
   ```bash
   ./scripts/setup-dev.sh
   ```

2. **Run Tests**
   ```bash
   deno task test
   ```

3. **Start Development**
   ```bash
   deno task benchmark
   ```

## 📋 Code Quality Standards

### Linting Rules

The project uses comprehensive linting rules to ensure code quality:

- **Recommended Rules**: All Deno recommended linting rules are enabled
- **Strict Type Checking**: TypeScript strict mode with additional checks
- **Security Rules**: No eval, no hardcoded secrets, proper error handling
- **Style Rules**: Consistent naming, prefer const, single var declarators

### Formatting Standards

- **Line Width**: 80 characters
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **File Types**: TypeScript, JavaScript, JSON, Markdown

### Pre-commit Hooks

Every commit automatically runs:

1. **Code Formatting** (`deno fmt`)
2. **Linting** (`deno lint`)
3. **Type Checking** (`deno check`)

If any check fails, the commit is rejected.

## 🛠️ Development Tasks

### Available Commands

```bash
# Code Quality
deno task lint          # Run linter
deno task lint:fix      # Auto-fix linting issues
deno task fmt           # Format code
deno task fmt:check     # Check formatting
deno task check         # Type checking

# Testing & Benchmarking
deno task test          # Run tests
deno task benchmark     # Run benchmarks

# Specific Runners
deno task benchmark:docker      # Docker runner
deno task benchmark:firecracker # Firecracker runner
deno task benchmark:wasm        # WASM runner
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following the style guide
   - Add tests for new functionality
   - Update documentation as needed

3. **Validate Changes**
   ```bash
   deno task fmt        # Format code
   deno task lint       # Check linting
   deno task check      # Type checking
   deno task test       # Run tests
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```
   The pre-commit hook will automatically run quality checks.

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🔍 CI/CD Pipeline

### Automated Checks

Every push and pull request triggers:

1. **Code Quality Checks**
   - Formatting validation
   - Linting
   - Type checking
   - Security scanning

2. **Testing**
   - Unit tests
   - Integration tests
   - Benchmark validation

3. **Build Validation**
   - Docker build test
   - Cross-platform compatibility

### Security Scanning

Automated security checks include:

- Hardcoded secrets detection
- Dangerous function usage (eval, etc.)
- Console statement detection in production code
- Dependency vulnerability scanning

## 📝 Code Style Guide

### TypeScript/JavaScript

```typescript
// ✅ Good
export interface BenchmarkConfig {
  name: string;
  timeout: number;
  retries?: number;
}

export const runBenchmark = async (
  config: BenchmarkConfig,
): Promise<BenchmarkResult> => {
  const startTime = performance.now();

  try {
    const result = await executeBenchmark(config);
    return {
      ...result,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    throw new Error(`Benchmark failed: ${error.message}`);
  }
};

// ❌ Bad
export interface benchmarkConfig {
  name: string;
  timeout: number;
  retries?: number;
}

export const runBenchmark = async (config) => {
  var startTime = performance.now();

  try {
    let result = await executeBenchmark(config);
    return {
      ...result,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    throw new Error('Benchmark failed: ' + error.message);
  }
};
```

### File Organization

```
honey/
├── bench/          # Benchmark implementations
├── combs/          # Benchmark configurations
├── docs/           # Documentation
├── layers/         # Runtime layers
├── queen/          # Orchestration logic
├── runners/        # Runtime implementations
├── scripts/        # Development scripts
└── tests/          # Test files
```

### Naming Conventions

- **Files**: kebab-case (`benchmark-runner.ts`)
- **Directories**: kebab-case (`runtime-layers/`)
- **Variables/Functions**: camelCase (`benchmarkConfig`)
- **Classes/Interfaces**: PascalCase (`BenchmarkRunner`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

## 🐛 Troubleshooting

### Common Issues

1. **Pre-commit Hook Fails**
   ```bash
   # Fix formatting
   deno fmt

   # Fix linting issues
   deno task lint:fix

   # Check types
   deno task check
   ```

2. **VS Code Not Recognizing Deno**
   - Install the Deno extension
   - Enable Deno in workspace settings
   - Restart VS Code

3. **Import Errors**
   - Use explicit file extensions (`.ts`)
   - Use absolute imports from project root
   - Check `deno.json` import map

### Getting Help

- Check the [README](../README.md) for basic setup
- Review [test files](../tests/) for usage examples
- Open an issue for bugs or feature requests

## 🔧 Configuration Files

### `deno.json`

Main configuration file containing:

- Task definitions
- Linting rules
- Formatting options
- Compiler options

### `.github/workflows/`

CI/CD pipeline definitions:

- `ci.yml`: Main CI/CD pipeline
- `lint.yml`: Dedicated linting workflow

### `.git/hooks/pre-commit`

Pre-commit hook that runs:

- Code formatting
- Linting
- Type checking

## 📚 Additional Resources

- [Deno Manual](https://deno.land/manual)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Deno Style Guide](https://deno.land/manual/references/contributing/style_guide)
