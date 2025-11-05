# 🤝 Contributing to SwimTO

> **Note:** SwimTO is a private commercial project. This guide is for authorized developers only.

Thank you for your interest in contributing to SwimTO! This document provides guidelines and best practices for authorized team members.

## Git Branch Strategy

We follow a feature-branch workflow with separation of concerns:

### Branch Naming Convention

```
main                    # Production-ready code
dev                     # Development branch
feature/<name>          # New features
feature/api/<name>      # Backend features
feature/web/<name>      # Frontend features
feature/pipeline/<name> # Data pipeline features
fix/<name>              # Bug fixes
infra/k8s/<name>        # Kubernetes manifests
infra/terraform/<name>  # Terraform infrastructure
docs/<name>             # Documentation updates
test/<name>             # Test improvements
```

### Examples

```bash
# Backend API work
git checkout -b feature/api/add-search-endpoint

# Frontend component
git checkout -b feature/web/facility-card

# Infrastructure
git checkout -b infra/k8s/add-ingress

# Data pipeline
git checkout -b feature/pipeline/improve-scraper

# Bug fix
git checkout -b fix/map-clustering-issue

# Documentation
git checkout -b docs/update-api-guide
```

## Workflow

### 1. Create a Feature Branch

```bash
# Update dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 3. Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat(api): add facility search endpoint"

# Bug fix
git commit -m "fix(web): resolve map marker z-index issue"

# Documentation
git commit -m "docs: update deployment guide"

# Test
git commit -m "test(api): add schedule endpoint tests"

# Infrastructure
git commit -m "infra(k8s): add resource limits"

# Refactor
git commit -m "refactor(pipeline): extract scraper utils"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `infra`: Infrastructure changes
- `perf`: Performance improvements

### 4. Run Tests

```bash
# All tests
./scripts/test-all.sh

# API tests only
cd apps/api && make test

# Frontend tests only
cd apps/web && npm test
```

### 5. Push and Create PR

```bash
# Push to origin
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Target: dev branch (not main!)
```

## Code Style

### Python (Backend)

Follow PEP 8 with these tools:

```bash
cd apps/api

# Format code
make format

# Run linters
make lint
```

**Guidelines:**
- Use type hints
- Write docstrings for functions/classes
- Keep functions small and focused
- Use meaningful variable names

**Example:**
```python
def get_facility_by_id(db: Session, facility_id: str) -> Optional[Facility]:
    """
    Get a facility by its ID.
    
    Args:
        db: Database session
        facility_id: Unique facility identifier
        
    Returns:
        Facility object if found, None otherwise
    """
    return db.query(Facility).filter(
        Facility.facility_id == facility_id
    ).first()
```

### TypeScript (Frontend)

Use ESLint and Prettier:

```bash
cd apps/web

# Lint
npm run lint

# Format (via IDE)
```

**Guidelines:**
- Use TypeScript strictly (avoid `any`)
- Prefer functional components with hooks
- Use meaningful component/variable names
- Extract reusable logic into hooks

**Example:**
```typescript
interface FacilityCardProps {
  facility: Facility
  onSelect?: (facility: Facility) => void
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ 
  facility, 
  onSelect 
}) => {
  const handleClick = () => {
    onSelect?.(facility)
  }
  
  return (
    <div onClick={handleClick}>
      <h3>{facility.name}</h3>
      <p>{facility.address}</p>
    </div>
  )
}
```

### YAML (Infrastructure)

**Guidelines:**
- Use 2 spaces for indentation
- Group related resources
- Add comments for complex configurations
- Keep secrets in separate files (never commit)

## Testing

### Backend Tests

```python
# apps/api/tests/test_feature.py
def test_get_facility_success(client, sample_facility):
    """Test successful facility retrieval."""
    response = client.get(f"/facilities/{sample_facility.facility_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["facility_id"] == sample_facility.facility_id
```

### Frontend Tests

```typescript
// apps/web/src/tests/Component.test.tsx
import { render, screen } from '@testing-library/react'
import { FacilityCard } from '@/components/FacilityCard'

test('renders facility name', () => {
  const facility = { name: 'Test Pool', ... }
  render(<FacilityCard facility={facility} />)
  expect(screen.getByText('Test Pool')).toBeInTheDocument()
})
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:

```
feat(api): add facility search endpoint
fix(web): resolve map clustering issue
docs: update deployment guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Infrastructure change

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings

## Related Issues
Fixes #123
```

### Review Process

1. Create PR targeting `dev` branch
2. Ensure CI passes (linting + tests)
3. Request review from maintainer
4. Address feedback
5. Squash and merge when approved

## Separate Concerns

### Infrastructure vs Application Code

**Keep infrastructure separate:**

```
✅ Good:
feature/api/add-endpoint
infra/k8s/add-resource-limits

❌ Bad:
feature/add-endpoint-and-k8s-changes
```

### Helm vs Terraform

When adding infrastructure as code:

```
infra/helm/add-chart          # For Helm charts
infra/terraform/add-module    # For Terraform modules
```

Keep them in separate PRs unless tightly coupled.

## Documentation

Update documentation for:
- New features → Update relevant docs
- API changes → Update API.md
- New endpoints → Update API.md
- Deployment changes → Update DEPLOYMENT_PI.md
- New scripts → Update LOCAL_DEVELOPMENT.md

## Common Tasks

### Adding a New API Endpoint

1. Create branch: `feature/api/your-endpoint`
2. Add route in `apps/api/app/routes/`
3. Add schema in `apps/api/app/schemas.py`
4. Add tests in `apps/api/tests/`
5. Update `docs/API.md`

### Adding a New Frontend Component

1. Create branch: `feature/web/your-component`
2. Create component in `apps/web/src/components/`
3. Add types in `apps/web/src/types/`
4. Add tests in `apps/web/src/tests/`
5. Export from index if reusable

### Updating K8s Manifests

1. Create branch: `infra/k8s/your-change`
2. Update relevant YAML in `k8s/`
3. Test locally: `kubectl apply -f k8s/ --dry-run=client`
4. Update `docs/DEPLOYMENT_PI.md` if needed

## Getting Help

- **Questions**: Contact the project maintainer
- **Bugs**: Open an Issue with reproduction steps (private repository)
- **Feature Requests**: Open an Issue with use case

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Respect proprietary nature of code

## Confidentiality

This is proprietary software. By contributing, you agree to:
- Keep all code and discussions confidential
- Not share or distribute code without permission
- Follow the terms outlined in the LICENSE file

Thank you for contributing to SwimTO! 🏊‍♂️

