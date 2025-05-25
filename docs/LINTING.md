# Linting and Formatting Guide

This document describes the linting and formatting setup for the Honey Benchmark
Swarm project.

## Overview

The project uses Deno's built-in linting and formatting tools to maintain code
quality and consistency. The configuration is defined in `deno.json` and
enforced through:

1. **Pre-commit hooks** - Automatically run before each commit
2. **GitHub Actions** - Run on every push and pull request
3. **Manual commands** - Can be run locally during development

## Configuration

### deno.json

The project's linting and formatting rules are configured in `deno.json`:

```json
{
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 80,
    "indentWidth": 2,
    "singleQuote": true,
    "semiColons": true
  }
}
```

### Formatting Rules

- **Spaces over tabs**: Uses 2 spaces for indentation
- **Line width**: Maximum 80 characters per line
- **Single quotes**: Prefers single quotes over double quotes
- **Semicolons**: Always include semicolons

### Linting Rules

- Uses Deno's recommended linting rules
- Includes checks for:
  - Type safety
  - Unused variables
  - Code complexity
  - Best practices

## Setup

### Install Pre-commit Hook

To automatically run linting and formatting before each commit:

```bash
./scripts/setup-hooks.sh
```

This will install a pre-commit hook that:

1. Formats all code with `deno fmt`
2. Runs linting with `deno lint`
3. Performs type checking with `deno check`

### Manual Commands

#### Format Code

```bash
# Format all files
deno fmt

# Check formatting without making changes
deno fmt --check
```

#### Lint Code

```bash
# Lint all files
deno lint

# Lint specific files
deno lint src/file.ts
```

#### Type Check

```bash
# Type check the main entry point
deno check main.ts

# Type check specific files
deno check src/file.ts
```

## GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/lint.yml`)
that automatically:

1. Runs on every push to `main`
2. Runs on every pull request to `main`
3. Checks formatting with `deno fmt --check`
4. Runs linting with `deno lint`

## Bypassing Checks

### Pre-commit Hook

To bypass the pre-commit hook (not recommended):

```bash
git commit --no-verify
```

### Linting Rules

To disable specific linting rules for a line:

```typescript
// deno-lint-ignore no-explicit-any
const data: any = getValue();
```

To disable for an entire file:

```typescript
// deno-lint-ignore-file no-explicit-any
```

## Common Issues

### Control Characters in Regex

When working with regex patterns that intentionally include control characters,
use:

```typescript
// deno-lint-ignore no-control-regex
.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
```

### Type Assertions

Instead of using `any`, create proper type definitions:

```typescript
// Bad
const config = data as any;

// Good
interface Config {
  property: string;
}
const config = data as Config;
```

## Best Practices

1. **Run checks locally** before pushing
2. **Fix linting issues** rather than disabling rules
3. **Use proper types** instead of `any`
4. **Keep lines under 80 characters**
5. **Use consistent formatting** across the codebase

## Troubleshooting

### Deno Not Found

Ensure Deno is installed and in your PATH:

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Add to PATH (add to your shell profile)
export PATH="$HOME/.deno/bin:$PATH"
```

### Hook Not Running

If the pre-commit hook isn't running:

1. Check if it's executable: `ls -la .git/hooks/pre-commit`
2. Re-run setup: `./scripts/setup-hooks.sh`
3. Verify Git hooks are enabled: `git config core.hooksPath`

### CI Failures

If GitHub Actions fail:

1. Run `deno fmt --check` locally
2. Run `deno lint` locally
3. Fix any issues and push again
