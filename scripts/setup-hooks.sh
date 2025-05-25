#!/bin/bash
# Setup script for Git hooks

echo "Setting up Git hooks for Honey Benchmark Swarm..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not in a Git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook installed successfully!"
echo "The hook will automatically run deno fmt, deno lint, and deno check before each commit."
echo ""
echo "To bypass the hook (not recommended), use: git commit --no-verify"

