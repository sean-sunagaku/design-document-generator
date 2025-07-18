import * as path from 'path';
import { TailwindExtractor } from '../extractors/TailwindExtractor';
import { DesignTokenExtractor } from '../extractors/DesignTokenExtractor';
import { findFiles, writeJsonFile, ensureDirectoryExists } from '../utils/fileUtils';
import { Snapshot } from '../types';

export interface SnapshotOptions {
  source: string;
  config?: string;
  output: string;
  format: 'json' | 'markdown';
}

export class SnapshotCommand {
  private options: SnapshotOptions;

  constructor(options: SnapshotOptions) {
    this.options = options;
  }

  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve(this.options.output);
    
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

    console.log(`Found ${componentFiles.length} component files`);

    // Extract components
    const components = [];
    for (const file of componentFiles) {
      const component = await tailwindExtractor.extractFromFile(file);
      if (component) {
        components.push(component);
      }
    }

    console.log(`Extracted ${components.length} components`);

    // Extract design tokens
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
    const tokens = await tokenExtractor.extractFromTailwindConfig(tailwindConfigPath);

    // Get project info
    const projectInfo = await this.getProjectInfo();

    // Create snapshot
    const snapshot: Snapshot = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      components,
      tokens,
      project: projectInfo,
    };

    // Save snapshot
    await ensureDirectoryExists(path.dirname(outputPath));
    await writeJsonFile(outputPath, snapshot);

    console.log(`Snapshot saved to: ${outputPath}`);
    console.log(`Components: ${components.length}`);
    console.log(`Tokens: ${Object.keys(tokens.colors).length} colors, ${Object.keys(tokens.spacing).length} spacing`);
  }

  private async getProjectInfo() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = require(packageJsonPath);
      
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    } catch {
      return {
        name: 'unknown',
        version: '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    }
  }
}