#!/bin/bash
# Development Environment Setup Script for Honey
# This script sets up linting, formatting, and git hooks

set -e

echo "🍯 Setting up Honey development environment..."

# Check if deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed"
    echo "📥 Installing Deno..."
    curl -fsSL https://deno.land/x/install/install.sh | sh
    export PATH="$HOME/.deno/bin:$PATH"
    echo "✅ Deno installed successfully"
else
    echo "✅ Deno is already installed"
fi

# Verify deno installation
echo "🔍 Deno version: $(deno --version | head -n1)"

# Set up git hooks
echo "🪝 Setting up git hooks..."
if [ -f ".git/hooks/pre-commit" ]; then
    echo "✅ Pre-commit hook already exists"
else
    echo "❌ Pre-commit hook not found"
    echo "Please ensure you're in the repository root directory"
    exit 1
fi

# Make sure the hook is executable
chmod +x .git/hooks/pre-commit
echo "✅ Pre-commit hook is executable"

# Install VS Code extensions (if VS Code is available)
if command -v code &> /dev/null; then
    echo "🔧 Setting up VS Code extensions..."
    code --install-extension denoland.vscode-deno
    echo "✅ Deno VS Code extension installed"
else
    echo "ℹ️ VS Code not found, skipping extension installation"
fi

# Create VS Code settings for the project
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false,
  "deno.suggest.imports.hosts": {
    "https://deno.land": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[javascript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
EOF
echo "✅ VS Code settings configured"

# Test the setup
echo "🧪 Testing the development setup..."

echo "  📝 Testing formatting..."
if deno fmt --check; then
    echo "  ✅ Code formatting check passed"
else
    echo "  ⚠️ Some files need formatting, running formatter..."
    deno fmt
    echo "  ✅ Code formatted successfully"
fi

echo "  🔍 Testing linting..."
if deno lint; then
    echo "  ✅ Linting check passed"
else
    echo "  ❌ Linting issues found"
    echo "  💡 Please fix linting issues before continuing"
    exit 1
fi

echo "  🔍 Testing type checking..."
if deno check **/*.ts; then
    echo "  ✅ Type checking passed"
else
    echo "  ❌ Type checking failed"
    echo "  💡 Please fix type errors before continuing"
    exit 1
fi

# Show available tasks
echo ""
echo "🎯 Available development tasks:"
echo "  deno task lint          - Run linter"
echo "  deno task lint:fix      - Run linter with auto-fix"
echo "  deno task fmt           - Format code"
echo "  deno task fmt:check     - Check code formatting"
echo "  deno task check         - Run type checking"
echo "  deno task test          - Run tests"
echo "  deno task benchmark     - Run benchmarks"
echo ""

echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Make some changes to your code"
echo "  2. Commit your changes (pre-commit hook will run automatically)"
echo "  3. Push to GitHub (CI/CD pipeline will validate your code)"
echo ""
echo "💡 Pro tips:"
echo "  - Use 'deno task fmt' before committing to ensure proper formatting"
echo "  - Use 'deno task lint:fix' to automatically fix linting issues"
echo "  - The pre-commit hook will automatically format and lint your code"
echo ""

