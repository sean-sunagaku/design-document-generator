import * as path from 'path';
import chalk from 'chalk';
import { TailwindExtractor } from '../extractors/TailwindExtractor';
import { DesignTokenExtractor } from '../extractors/DesignTokenExtractor';
import { AIDocumentGenerator } from '../generators/AIDocumentGenerator';
import { findFiles, ensureDirectoryExists } from '../utils/fileUtils';

export interface GenerateOptions {
  source: string;
  output: string;
  includeExamples: boolean;
}

export class GenerateCommand {
  private options: GenerateOptions;

  constructor(options: GenerateOptions) {
    this.options = options;
  }

  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve(this.options.output);
    
    console.log(chalk.blue('🔍 Analyzing components...'));

    // Initialize extractors
    const tailwindExtractor = new TailwindExtractor({
      sourceDir: sourcePath,
      ignore: [
        '**/node_modules/**',
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.spec.ts',
        '**/*.stories.tsx',
        '**/*.stories.ts',
        '**/dist/**',
        '**/build/**',
      ],
    });

    const tokenExtractor = new DesignTokenExtractor();
    const documentGenerator = new AIDocumentGenerator();

    // Find all React/TypeScript files
    const patterns = [
      `${sourcePath}/**/*.tsx`,
      `${sourcePath}/**/*.jsx`,
      `${sourcePath}/**/*.ts`,
    ];

    const allFiles = [];
    for (const pattern of patterns) {
      const files = await findFiles(pattern);
      allFiles.push(...files);
    }

    // Filter out non-component files
    const componentFiles = allFiles.filter(file => 
      !file.includes('node_modules') &&
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      !file.includes('.stories.') &&
      (file.endsWith('.tsx') || file.endsWith('.jsx'))
    );

    console.log(chalk.gray(`Found ${componentFiles.length} component files`));

    // Extract components
    const components = [];
    for (const file of componentFiles) {
      const component = await tailwindExtractor.extractFromFile(file);
      if (component) {
        components.push(component);
      }
    }

    console.log(chalk.gray(`Extracted ${components.length} components`));

    // Extract design tokens
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
    const tokens = await tokenExtractor.extractFromTailwindConfig(tailwindConfigPath);

    console.log(chalk.blue('📝 Generating documentation...'));

    // Generate AI document
    const result = await documentGenerator.generate(components, tokens, {
      includeExamples: this.options.includeExamples,
      outputFormat: 'json',
    });

    // Create output directory
    await ensureDirectoryExists(outputPath);

    // Save files
    const jsonOutputPath = path.join(outputPath, 'design-system.json');
    const markdownOutputPath = path.join(outputPath, 'design-system.md');
    const indexOutputPath = path.join(outputPath, 'index.md');

    await documentGenerator.saveAsJSON(result.document, jsonOutputPath);
    await documentGenerator.saveAsMarkdown(result.document, markdownOutputPath);

    // Create index file
    await this.createIndexFile(result.document, indexOutputPath);

    console.log(chalk.green('✅ Documentation generated successfully!'));
    console.log(chalk.gray(`Output directory: ${outputPath}`));
    console.log(chalk.gray(`Files created:`));
    console.log(chalk.gray(`  - design-system.json (${components.length} components)`));
    console.log(chalk.gray(`  - design-system.md (human readable)`));
    console.log(chalk.gray(`  - index.md (overview)`));

    // Display summary
    this.displaySummary(result.document);
  }

  private async createIndexFile(aiDocument: any, outputPath: string): Promise<void> {
    const indexContent = `# Design System Documentation

This directory contains automatically generated documentation for the project's design system.

## Files

- **design-system.json** - Complete design system data in JSON format, optimized for AI consumption
- **design-system.md** - Human-readable documentation in Markdown format
- **index.md** - This overview file

## Summary

- **Project**: ${aiDocument.project.name}
- **Generated**: ${new Date(aiDocument.generated).toLocaleString('ja-JP')}
- **Components**: ${aiDocument.components.length}
- **Design Tokens**: ${Object.keys(aiDocument.tokens.colors).length} colors, ${Object.keys(aiDocument.tokens.spacing).length} spacing
- **Patterns**: ${aiDocument.patterns.length}

## Component Categories

- **Atoms**: ${aiDocument.components.filter((c: any) => c.category === 'atoms').length}
- **Molecules**: ${aiDocument.components.filter((c: any) => c.category === 'molecules').length}
- **Organisms**: ${aiDocument.components.filter((c: any) => c.category === 'organisms').length}
- **Templates**: ${aiDocument.components.filter((c: any) => c.category === 'templates').length}
- **Pages**: ${aiDocument.components.filter((c: any) => c.category === 'pages').length}

## How to Use

1. **For AI/LLM**: Use the \`design-system.json\` file for structured data
2. **For Developers**: Read the \`design-system.md\` file for comprehensive documentation
3. **For Updates**: Re-run \`design-system-doc generate\` to update documentation

## Commands

\`\`\`bash
# Generate documentation
design-system-doc generate

# Create snapshot
design-system-doc snapshot

# Compare changes
design-system-doc diff

# Watch for changes
design-system-doc watch
\`\`\`
`;

    await require('fs').promises.writeFile(outputPath, indexContent, 'utf-8');
  }

  private displaySummary(aiDocument: any): void {
    console.log(chalk.bold('\n📊 Summary:'));
    
    const categoryCounts = {
      atoms: aiDocument.components.filter((c: any) => c.category === 'atoms').length,
      molecules: aiDocument.components.filter((c: any) => c.category === 'molecules').length,
      organisms: aiDocument.components.filter((c: any) => c.category === 'organisms').length,
      templates: aiDocument.components.filter((c: any) => c.category === 'templates').length,
      pages: aiDocument.components.filter((c: any) => c.category === 'pages').length,
    };

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  ${category}: ${count} components`);
      }
    });

    const tokensCount = Object.keys(aiDocument.tokens.colors).length;
    const spacingCount = Object.keys(aiDocument.tokens.spacing).length;
    
    console.log(`  Design tokens: ${tokensCount} colors, ${spacingCount} spacing`);
    console.log(`  Patterns detected: ${aiDocument.patterns.length}`);
    console.log(`  Guidelines: ${aiDocument.guidelines.length}`);

    // Show most used classes
    const allClasses = aiDocument.components.flatMap((c: any) => c.styles.tailwindClasses);
    const classCount = allClasses.reduce((acc: any, cls: string) => {
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});

    const topClasses = Object.entries(classCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([cls, count]) => `${cls}(${count})`);

    if (topClasses.length > 0) {
      console.log(`  Most used classes: ${topClasses.join(', ')}`);
    }
  }
}