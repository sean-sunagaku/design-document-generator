#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SnapshotCommand } from './commands/snapshot';
import { WatchCommand } from './commands/watch';
import { DiffCommand } from './commands/diff';
import { GenerateCommand } from './commands/generate';
import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('design-system-doc')
  .description('React/TypeScript プロジェクトのデザインシステムを自動ドキュメント化')
  .version(packageJson.version);

// スナップショット生成コマンド
program
  .command('snapshot')
  .description('デザインシステムのスナップショットを生成')
  .option('-s, --source <dir>', 'ソースディレクトリ', './src')
  .option('-c, --config <path>', '設定ファイルパス')
  .option('-o, --output <path>', '出力ファイルパス', './.design-system-snapshots/snapshot.json')
  .option('-f, --format <type>', '出力形式 (json|markdown)', 'json')
  .action(async (options) => {
    const spinner = ora('スナップショットを生成中...').start();
    try {
      const command = new SnapshotCommand(options);
      await command.execute();
      spinner.succeed(chalk.green('スナップショット生成完了！'));
    } catch (error) {
      spinner.fail(chalk.red('エラーが発生しました'));
      console.error(error);
      process.exit(1);
    }
  });

// ファイル監視コマンド
program
  .command('watch')
  .description('ファイル変更を監視して自動更新')
  .option('-s, --source <dir>', 'ソースディレクトリ', './src')
  .option('-c, --config <path>', '設定ファイルパス')
  .action(async (options) => {
    console.log(chalk.blue('ファイル監視を開始します...'));
    const command = new WatchCommand(options);
    await command.execute();
  });

// 差分表示コマンド
program
  .command('diff')
  .description('前回のスナップショットとの差分を表示')
  .option('--from <path>', '比較元のスナップショット', './.design-system-snapshots/snapshot.json')
  .option('--to <path>', '比較先のスナップショット')
  .action(async (options) => {
    const command = new DiffCommand(options);
    await command.execute();
  });

// AIドキュメント生成コマンド
program
  .command('generate')
  .description('AI理解可能なドキュメントを生成')
  .option('-s, --source <dir>', 'ソースディレクトリ', './src')
  .option('-o, --output <path>', '出力ディレクトリ', './docs/design-system')
  .option('--include-examples', 'コード例を含める', false)
  .action(async (options) => {
    const spinner = ora('AIドキュメントを生成中...').start();
    try {
      const command = new GenerateCommand(options);
      await command.execute();
      spinner.succeed(chalk.green('ドキュメント生成完了！'));
    } catch (error) {
      spinner.fail(chalk.red('エラーが発生しました'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();