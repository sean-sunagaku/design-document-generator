# Contributing to Design System Doc Generator

Thank you for your interest in contributing to the Design System Doc Generator! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 14.0 or higher
- npm 6.0 or higher
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/design-system-doc-generator.git
   cd design-system-doc-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Link for local development**
   ```bash
   npm link
   ```

## Development Workflow

### Project Structure

```
src/
├── cli.ts                 # Main CLI entry point
├── commands/              # Command implementations
│   ├── snapshot.ts
│   ├── generate.ts
│   ├── watch.ts
│   └── diff.ts
├── extractors/            # Component and token extractors
│   ├── TailwindExtractor.ts
│   └── DesignTokenExtractor.ts
├── generators/            # Documentation generators
│   └── AIDocumentGenerator.ts
├── core/                  # Core functionality
│   └── DiffEngine.ts
├── utils/                 # Utility functions
│   ├── fileUtils.ts
│   └── hash.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── __tests__/             # Test files
    ├── unit/
    ├── integration/
    └── fixtures/
```

### Code Style

We use ESLint and Prettier for code formatting. Run these commands before committing:

```bash
npm run lint
npm run format
```

### Testing

We maintain high test coverage. Please ensure your changes include appropriate tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Building

```bash
# Build the project
npm run build

# Clean and rebuild
npm run clean && npm run build
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Test with the sample project
cd sample-project
design-system-doc snapshot --source ./src
design-system-doc generate --source ./src
```

### 4. Commit Your Changes

We use conventional commits. Format your commit messages as:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(extractor): add support for Vue components
fix(cli): handle missing tailwind config gracefully
docs(readme): add installation instructions
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for significant changes)
- [ ] Commit messages follow conventional commit format

### Pull Request Description

Please include:

1. **Description**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Testing**: How was this tested?
4. **Breaking Changes**: Are there any breaking changes?
5. **Screenshots**: If applicable, add screenshots

### Example PR Template

```markdown
## Description
Brief description of the changes

## Motivation
Why this change is needed

## Changes Made
- Added feature X
- Fixed bug Y
- Updated documentation Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Breaking Changes
None / List any breaking changes

## Screenshots
Add screenshots if applicable
```

## Types of Contributions

### 🐛 Bug Reports

When reporting bugs, please include:

- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs
- Sample code if applicable

### 💡 Feature Requests

For new features, please:

- Check if it's already requested
- Explain the use case
- Provide examples
- Consider implementation complexity

### 📚 Documentation

- Fix typos or unclear explanations
- Add examples
- Improve API documentation
- Update README or guides

### 🧪 Testing

- Add missing test cases
- Improve test coverage
- Fix flaky tests
- Add integration tests

### 🔧 Code Improvements

- Performance optimizations
- Code refactoring
- Type safety improvements
- Better error handling

## Development Guidelines

### TypeScript

- Use strict TypeScript settings
- Define proper interfaces and types
- Avoid `any` type when possible
- Use generics for reusable code

### Error Handling

- Use proper error types
- Provide helpful error messages
- Handle edge cases gracefully
- Log errors appropriately

### Performance

- Consider large codebases
- Optimize AST parsing
- Use efficient data structures
- Profile performance-critical code

### Testing

- Write unit tests for pure functions
- Use integration tests for workflows
- Mock external dependencies
- Test error conditions

## Architecture Decisions

When making significant architectural changes:

1. **Discuss First**: Open an issue to discuss the change
2. **Design Document**: Create a design document for complex changes
3. **Backward Compatibility**: Maintain backward compatibility when possible
4. **Performance Impact**: Consider performance implications
5. **Testing Strategy**: Plan comprehensive testing

## Release Process

Releases are handled by maintainers:

1. Version bump based on semantic versioning
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish to npm
5. Update documentation

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat (link in README)

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Please be respectful and inclusive in all interactions.

## Recognition

Contributors are recognized in:
- README.md contributors section
- GitHub contributors graph
- Release notes for significant contributions

Thank you for contributing to Design System Doc Generator! 🎉