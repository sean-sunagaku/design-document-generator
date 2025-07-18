# API Reference

This document provides detailed API documentation for the Design System Doc Generator.

## CLI Commands

### `design-system-doc snapshot`

Generates a snapshot of the current design system state.

```bash
design-system-doc snapshot [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source <dir>` | `-s` | Source directory to analyze | `./src` |
| `--config <path>` | `-c` | Configuration file path | - |
| `--output <path>` | `-o` | Output file path | `./.design-system-snapshots/snapshot.json` |
| `--format <type>` | `-f` | Output format (json\|markdown) | `json` |

#### Examples

```bash
# Basic snapshot
design-system-doc snapshot

# Custom source and output
design-system-doc snapshot --source ./components --output ./snapshots/current.json

# Generate markdown format
design-system-doc snapshot --format markdown --output ./docs/snapshot.md
```

### `design-system-doc generate`

Generates AI-optimized documentation from the design system.

```bash
design-system-doc generate [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source <dir>` | `-s` | Source directory to analyze | `./src` |
| `--output <path>` | `-o` | Output directory | `./docs/design-system` |
| `--include-examples` | - | Include code examples | `false` |

#### Examples

```bash
# Basic documentation generation
design-system-doc generate

# With examples
design-system-doc generate --include-examples

# Custom output directory
design-system-doc generate --output ./documentation
```

### `design-system-doc watch`

Watches for file changes and automatically updates snapshots.

```bash
design-system-doc watch [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source <dir>` | `-s` | Source directory to watch | `./src` |
| `--config <path>` | `-c` | Configuration file path | - |

#### Examples

```bash
# Watch current directory
design-system-doc watch

# Watch specific directory
design-system-doc watch --source ./components
```

### `design-system-doc diff`

Compares two snapshots and displays differences.

```bash
design-system-doc diff [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from <path>` | Source snapshot file | `./.design-system-snapshots/snapshot.json` |
| `--to <path>` | Target snapshot file | Latest snapshot |

#### Examples

```bash
# Compare with previous snapshot
design-system-doc diff

# Compare specific snapshots
design-system-doc diff --from ./old.json --to ./new.json
```

## TypeScript API

### Core Classes

#### `TailwindExtractor`

Extracts Tailwind CSS classes from React/TypeScript components.

```typescript
import { TailwindExtractor } from 'design-system-doc-generator';

const extractor = new TailwindExtractor({
  sourceDir: './src',
  ignore: ['**/*.test.tsx']
});

const component = await extractor.extractFromFile('./Button.tsx');
```

##### Constructor Options

```typescript
interface ExtractorConfig {
  sourceDir: string;
  tsConfigPath?: string;
  ignore?: string[];
}
```

##### Methods

```typescript
class TailwindExtractor {
  constructor(config: ExtractorConfig);
  
  async extractFromFile(filePath: string): Promise<ExtractedComponent | null>;
}
```

#### `DesignTokenExtractor`

Extracts design tokens from Tailwind configuration.

```typescript
import { DesignTokenExtractor } from 'design-system-doc-generator';

const extractor = new DesignTokenExtractor();
const tokens = await extractor.extractFromTailwindConfig('./tailwind.config.js');
```

##### Methods

```typescript
class DesignTokenExtractor {
  async extractFromTailwindConfig(configPath: string): Promise<DesignTokens>;
}
```

#### `AIDocumentGenerator`

Generates AI-optimized documentation.

```typescript
import { AIDocumentGenerator } from 'design-system-doc-generator';

const generator = new AIDocumentGenerator();
const document = await generator.generate(components, tokens, options);
```

##### Methods

```typescript
class AIDocumentGenerator {
  async generate(
    components: ExtractedComponent[],
    tokens: DesignTokens,
    options: GeneratorOptions
  ): Promise<AIDocument>;
  
  async saveAsJSON(document: AIDocument, outputPath: string): Promise<void>;
  async saveAsMarkdown(document: AIDocument, outputPath: string): Promise<void>;
}
```

#### `DiffEngine`

Compares snapshots and detects changes.

```typescript
import { DiffEngine } from 'design-system-doc-generator';

const diffEngine = new DiffEngine();
const result = await diffEngine.compareSnapshots(oldSnapshot, newSnapshot);
diffEngine.displayDiff(result);
```

##### Methods

```typescript
class DiffEngine {
  async compareSnapshots(
    oldSnapshot: Snapshot,
    newSnapshot: Snapshot
  ): Promise<DiffResult>;
  
  displayDiff(result: DiffResult): void;
}
```

### Type Definitions

#### `ExtractedComponent`

Represents a component extracted from the codebase.

```typescript
interface ExtractedComponent {
  filePath: string;
  componentName: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages';
  tailwindClasses: string[];
  props: PropInfo[];
  dependencies: string[];
  hash: string;
}
```

#### `PropInfo`

Information about a component prop.

```typescript
interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}
```

#### `DesignTokens`

Design tokens extracted from Tailwind configuration.

```typescript
interface DesignTokens {
  colors: Record<string, ColorToken>;
  spacing: Record<string, string>;
  typography: TypographyTokens;
  breakpoints: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  custom: Record<string, any>;
}
```

#### `ColorToken`

Color token with metadata.

```typescript
interface ColorToken {
  value: string;
  rgb?: string;
  usage?: string[];
}
```

#### `TypographyTokens`

Typography-related tokens.

```typescript
interface TypographyTokens {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
}
```

#### `Snapshot`

Complete snapshot of the design system state.

```typescript
interface Snapshot {
  version: string;
  timestamp: string;
  components: ExtractedComponent[];
  tokens: DesignTokens;
  project: ProjectInfo;
}
```

#### `DiffResult`

Result of comparing two snapshots.

```typescript
interface DiffResult {
  hasChanges: boolean;
  changes: {
    components: {
      added: ExtractedComponent[];
      removed: ExtractedComponent[];
      modified: ModifiedComponent[];
    };
    tokens: {
      added: Record<string, any>;
      removed: Record<string, any>;
      modified: Record<string, any>;
    };
  };
  summary: DiffSummary;
}
```

#### `AIDocument`

AI-optimized documentation structure.

```typescript
interface AIDocument {
  version: string;
  generated: string;
  project: ProjectInfo;
  tokens: DesignTokens;
  components: ComponentDoc[];
  patterns: DesignPattern[];
  guidelines: string[];
}
```

#### `ComponentDoc`

Detailed component documentation.

```typescript
interface ComponentDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
  props: PropDoc[];
  styles: StyleInfo;
  examples: CodeExample[];
  relatedComponents: string[];
}
```

### Utility Functions

#### File Utilities

```typescript
import { fileUtils } from 'design-system-doc-generator';

// Check if file exists
const exists = await fileUtils.fileExists('./path/to/file.tsx');

// Read JSON file
const data = await fileUtils.readJsonFile<MyType>('./data.json');

// Write JSON file
await fileUtils.writeJsonFile('./output.json', data);

// Find files matching pattern
const files = await fileUtils.findFiles('**/*.tsx');

// Ensure directory exists
await fileUtils.ensureDirectoryExists('./output/directory');
```

#### Hash Utilities

```typescript
import { hashUtils } from 'design-system-doc-generator';

// Generate content hash
const hash = hashUtils.generateHash('file content');

// Generate component ID
const id = hashUtils.generateComponentId('atoms', 'Button');
```

## Configuration

### Configuration File Format

Create a `.design-system-doc.config.js` file in your project root:

```javascript
module.exports = {
  // Source directory to analyze
  source: './src',
  
  // Output directory for generated documentation
  output: './docs/design-system',
  
  // Component categorization rules
  categories: {
    atoms: ['atoms', 'components/atoms'],
    molecules: ['molecules', 'components/molecules'],
    organisms: ['organisms', 'components/organisms'],
    templates: ['templates', 'components/templates'],
    pages: ['pages', 'components/pages'],
  },
  
  // Files to ignore
  ignore: [
    '**/*.test.tsx',
    '**/*.test.ts',
    '**/*.stories.tsx',
    '**/*.stories.ts',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
  
  // Tailwind configuration file path
  tailwindConfig: './tailwind.config.js',
  
  // TypeScript configuration file path
  tsConfig: './tsconfig.json',
  
  // Custom Tailwind class patterns
  tailwindPatterns: [
    /^custom-/,
    /^app-/,
  ],
  
  // Output options
  output: {
    // Include code examples in documentation
    includeExamples: true,
    
    // Output formats to generate
    formats: ['json', 'markdown'],
    
    // Include private components (those starting with _)
    includePrivate: false,
  },
  
  // Hooks for custom processing
  hooks: {
    // Called before processing each component
    beforeComponent: (component) => {
      // Custom processing
      return component;
    },
    
    // Called after processing all components
    afterExtraction: (components, tokens) => {
      // Custom processing
      return { components, tokens };
    },
  },
};
```

### Environment Variables

You can also configure the tool using environment variables:

```bash
# Source directory
DESIGN_SYSTEM_SOURCE=./src

# Output directory
DESIGN_SYSTEM_OUTPUT=./docs

# Configuration file path
DESIGN_SYSTEM_CONFIG=./config.js

# Tailwind config path
DESIGN_SYSTEM_TAILWIND_CONFIG=./tailwind.config.js
```

## Error Handling

The library uses structured error handling. All errors extend the base `DesignSystemError` class:

```typescript
class DesignSystemError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DesignSystemError';
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `FILE_NOT_FOUND` | Source file or directory not found |
| `PARSE_ERROR` | Failed to parse TypeScript/JSX file |
| `CONFIG_ERROR` | Invalid configuration |
| `TAILWIND_CONFIG_ERROR` | Failed to load Tailwind configuration |
| `WRITE_ERROR` | Failed to write output files |

### Error Handling Example

```typescript
try {
  const extractor = new TailwindExtractor(config);
  const component = await extractor.extractFromFile('./Button.tsx');
} catch (error) {
  if (error instanceof DesignSystemError) {
    console.error(`Error ${error.code}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

### Large Codebases

For large codebases, consider:

1. **Incremental Processing**: Use snapshots and diff to process only changed files
2. **Parallel Processing**: The tool automatically processes files in parallel
3. **Memory Management**: Increase Node.js memory limit if needed

```bash
NODE_OPTIONS="--max-old-space-size=8192" design-system-doc generate
```

### Optimization Tips

1. **Ignore Patterns**: Use comprehensive ignore patterns to exclude unnecessary files
2. **Cache Results**: Snapshots serve as cache for unchanged files
3. **Watch Mode**: Use watch mode for development to avoid full rebuilds

## Integration Examples

### With Next.js

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Generate design system docs during build
      require('./scripts/generate-design-docs');
    }
    return config;
  },
};
```

### With Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { generateDesignSystemDocs } from './scripts/design-system';

export default defineConfig({
  plugins: [
    {
      name: 'design-system-docs',
      buildStart() {
        generateDesignSystemDocs();
      },
    },
  ],
});
```

### With Webpack

```javascript
// webpack.config.js
const { DesignSystemDocsPlugin } = require('./plugins/design-system-docs');

module.exports = {
  plugins: [
    new DesignSystemDocsPlugin({
      source: './src',
      output: './docs/design-system',
    }),
  ],
};
```

## Best Practices

1. **Regular Snapshots**: Generate snapshots before major changes
2. **Version Control**: Commit snapshots to track design system evolution
3. **CI Integration**: Automate documentation generation in CI/CD
4. **Review Process**: Include design system changes in code review
5. **Documentation**: Keep generated docs up-to-date with deployments