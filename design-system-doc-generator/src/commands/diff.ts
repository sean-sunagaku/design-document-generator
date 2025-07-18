import * as path from 'path';
import chalk from 'chalk';
import { DiffEngine } from '../core/DiffEngine';
import { readJsonFile, fileExists } from '../utils/fileUtils';
import { Snapshot } from '../types';

export interface DiffOptions {
  from: string;
  to?: string;
}

export class DiffCommand {
  private options: DiffOptions;
  private diffEngine: DiffEngine;

  constructor(options: DiffOptions) {
    this.options = options;
    this.diffEngine = new DiffEngine();
  }

  async execute(): Promise<void> {
    const fromPath = path.resolve(this.options.from);
    let toPath: string;

    if (this.options.to) {
      toPath = path.resolve(this.options.to);
    } else {
      // Compare with current snapshot
      const snapshotDir = path.resolve('./.design-system-snapshots');
      toPath = path.join(snapshotDir, 'snapshot.json');
    }

    // Check if files exist
    if (!await fileExists(fromPath)) {
      console.error(chalk.red(`From snapshot not found: ${fromPath}`));
      process.exit(1);
    }

    if (!await fileExists(toPath)) {
      console.error(chalk.red(`To snapshot not found: ${toPath}`));
      console.log(chalk.yellow('💡 Tip: Run `design-system-doc snapshot` to create a snapshot first'));
      process.exit(1);
    }

    try {
      // Load snapshots
      console.log(chalk.blue('📊 Loading snapshots...'));
      const fromSnapshot: Snapshot = await readJsonFile(fromPath);
      const toSnapshot: Snapshot = await readJsonFile(toPath);

      console.log(chalk.gray(`From: ${fromPath} (${fromSnapshot.timestamp})`));
      console.log(chalk.gray(`To: ${toPath} (${toSnapshot.timestamp})`));

      // Compare snapshots
      const diffResult = await this.diffEngine.compareSnapshots(fromSnapshot, toSnapshot);

      // Display results
      this.diffEngine.displayDiff(diffResult);

      // Exit with appropriate code
      if (diffResult.hasChanges) {
        console.log(chalk.yellow('\n⚠️  Changes detected'));
        process.exit(1);
      } else {
        console.log(chalk.green('\n✅ No changes detected'));
        process.exit(0);
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to compare snapshots:'), error);
      process.exit(1);
    }
  }
}