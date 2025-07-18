import * as chokidar from 'chokidar';
import * as path from 'path';
import chalk from 'chalk';
import { SnapshotCommand } from './snapshot';
import { fileExists } from '../utils/fileUtils';

export interface WatchOptions {
  source: string;
  config?: string;
}

export class WatchCommand {
  private options: WatchOptions;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(options: WatchOptions) {
    this.options = options;
  }

  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve('./.design-system-snapshots/snapshot.json');

    // Check if source directory exists
    if (!await fileExists(sourcePath)) {
      console.error(chalk.red(`Source directory not found: ${sourcePath}`));
      process.exit(1);
    }

    // Create initial snapshot
    console.log(chalk.blue('Creating initial snapshot...'));
    const snapshotCommand = new SnapshotCommand({
      source: this.options.source,
      config: this.options.config,
      output: outputPath,
      format: 'json',
    });
    await snapshotCommand.execute();

    // Watch for changes
    const watchPatterns = [
      `${sourcePath}/**/*.tsx`,
      `${sourcePath}/**/*.jsx`,
      `${sourcePath}/**/*.ts`,
      './tailwind.config.js',
      './tailwind.config.ts',
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: [
        '**/node_modules/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/dist/**',
        '**/build/**',
        '**/.design-system-snapshots/**',
      ],
      persistent: true,
      ignoreInitial: true,
    });

    console.log(chalk.green('👀 Watching for changes...'));
    console.log(chalk.gray('Press Ctrl+C to stop'));

    let updateTimeout: NodeJS.Timeout | null = null;

    const updateSnapshot = async () => {
      try {
        console.log(chalk.yellow('🔄 Updating snapshot...'));
        await snapshotCommand.execute();
        console.log(chalk.green('✅ Snapshot updated'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to update snapshot:'), error);
      }
    };

    this.watcher
      .on('change', (filePath) => {
        console.log(chalk.blue(`📝 Changed: ${path.relative(process.cwd(), filePath)}`));
        
        // Debounce updates
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('add', (filePath) => {
        console.log(chalk.green(`➕ Added: ${path.relative(process.cwd(), filePath)}`));
        
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('unlink', (filePath) => {
        console.log(chalk.red(`🗑️ Removed: ${path.relative(process.cwd(), filePath)}`));
        
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('error', (error) => {
        console.error(chalk.red('❌ Watcher error:'), error);
      });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping file watcher...'));
      if (this.watcher) {
        this.watcher.close();
      }
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
  }
}