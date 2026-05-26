# Git Hooks for Personal Website

This directory contains git hooks to enforce repository conventions.

## Setup

Run once after cloning the repository:

```bash
./scripts/setup-hooks.sh
```

Or manually:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## Hooks

### pre-commit

**Purpose**: Enforce VERSION and CHANGELOG updates for content changes

**What it checks**:
- If content files are modified (src/, static/, Dockerfile, package.json, etc.)
- VERSION file must be updated
- CHANGELOG.md must be updated
- VERSION format must be valid semantic versioning (MAJOR.MINOR.PATCH)

**Exempt files** (don't require VERSION bump):
- `.github/` - CI/CD workflow changes
- `README.md`, `LICENSE`, `.gitignore` - Documentation
- Config files like `.eslintrc`, `tsconfig.json`

**Example workflow**:

```bash
# Make content changes
vim src/lib/components/Hero.svelte

# Bump version
echo "0.2.4" > VERSION

# Update changelog
vim CHANGELOG.md

# Commit (hook runs automatically)
git add .
git commit -m "feat: update hero section"
```

**Bypass hook (emergency only)**:

```bash
git commit --no-verify
```

**Why this exists**: FluxCD ImageUpdateAutomation only triggers on new semantic version tags. Forgetting to bump VERSION means changes won't deploy automatically.

## Testing the Hook

```bash
# Test: Try committing content without VERSION bump (should fail)
echo "test" >> src/lib/components/Hero.svelte
git add src/lib/components/Hero.svelte
git commit -m "test: should fail"

# Test: Commit with VERSION bump (should succeed)
echo "0.2.4" > VERSION
echo "## [0.2.4] - 2026-XX-XX" >> CHANGELOG.md
git add VERSION CHANGELOG.md src/lib/components/Hero.svelte
git commit -m "feat: test commit"
```

## Troubleshooting

**Hook not running?**
- Check: `git config core.hooksPath` (should be `.githooks`)
- Run: `./scripts/setup-hooks.sh`

**Hook permission denied?**
- Run: `chmod +x .githooks/pre-commit`

**Need to bypass for legitimate reason?**
- For documentation-only changes, the hook auto-skips
- For emergency fixes: `git commit --no-verify` (use sparingly)
