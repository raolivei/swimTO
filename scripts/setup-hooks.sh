#!/bin/bash
# Setup script to install git hooks for personal-website repo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Setting up git hooks for personal-website..."

# Configure git to use .githooks directory
git config core.hooksPath .githooks

# Make hooks executable
chmod +x "$REPO_ROOT/.githooks"/*

echo "✓ Git hooks installed successfully"
echo ""
echo "Hooks configured:"
echo "  - pre-commit: Enforces VERSION and CHANGELOG updates for content changes"
echo ""
echo "To bypass hook (emergency only): git commit --no-verify"
