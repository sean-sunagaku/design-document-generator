# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of design-system-doc-generator
- Tailwind CSS class extraction from React/TypeScript components
- Design token extraction from tailwind.config.js
- Automatic component categorization using Atomic Design principles
- Snapshot generation and diff detection functionality
- AI-friendly documentation generation in JSON format
- Human-readable Markdown documentation output
- CLI commands: `snapshot`, `generate`, `watch`, `diff`
- File watching mode for real-time updates
- TypeScript support with full type definitions
- Comprehensive test coverage
- Sample React/TypeScript project for testing
- Support for responsive classes (sm:, md:, lg:, xl:, 2xl:)
- Support for state classes (hover:, focus:, active:, disabled:)
- Support for dark mode classes (dark:)
- Support for animation classes (animate-, transition-, duration-)
- Component props extraction and documentation
- Design pattern detection (Button systems, Form systems, etc.)
- Guidelines generation based on usage patterns
- Related component detection
- Configuration file support (.design-system-doc.config.js)
- CI/CD integration examples

### Features
- **Component Analysis**: Automatically extracts components from JSX/TSX files
- **Tailwind Class Detection**: Identifies and categorizes Tailwind CSS classes
- **Design Token Extraction**: Extracts colors, spacing, typography, and other tokens
- **Atomic Design Categorization**: Automatically categorizes components as atoms, molecules, organisms, templates, or pages
- **Snapshot Comparison**: Tracks changes over time with detailed diff reports
- **AI-Optimized Output**: Generates structured data perfect for LLM consumption
- **Multi-format Output**: Supports both JSON and Markdown formats
- **Real-time Monitoring**: Watch mode for continuous updates
- **Pattern Recognition**: Automatically detects common design patterns

### Technical Details
- Built with TypeScript for type safety
- Uses AST parsing for accurate code analysis
- Comprehensive test coverage with Jest
- Supports Node.js 14+
- Compatible with React 16.8+, TypeScript 4.0+, Tailwind CSS 3.0+

### Documentation
- Complete README with usage examples
- API documentation for all public interfaces
- Configuration guide
- Troubleshooting section
- CI/CD integration examples
- Sample project for testing and learning

### Known Limitations
- Currently supports only React/TypeScript projects
- Requires Tailwind CSS for styling
- AST parsing may not capture all dynamic class generation patterns
- Does not analyze CSS-in-JS solutions other than Tailwind

### Next Version Plans
- Vue.js support
- Styled-components integration
- Visual regression testing
- Component usage statistics
- Performance optimization for large codebases