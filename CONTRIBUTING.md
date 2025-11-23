# Contributing to ZKForge zkSTARK

Thank you for your interest in contributing to ZKForge zkSTARK! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/zkstark.git`
3. Create a branch: `git checkout -b feature/my-feature`
4. Install dependencies: `npm install`

## Development Workflow

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Running Examples

```bash
npm run example:fibonacci
npm run example:range-proof
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass: `npm test`
4. Update the README.md if needed
5. Create a pull request with a clear description

## Coding Standards

- Use TypeScript strict mode
- Follow existing code style
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Write descriptive variable names

## Testing Guidelines

- Write unit tests for all new functions
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add polynomial division algorithm
fix: correct field element inverse calculation
docs: update API reference
test: add tests for Merkle tree
```

## Questions?

Open an issue or join our Discord community for help.

Thank you for contributing!
