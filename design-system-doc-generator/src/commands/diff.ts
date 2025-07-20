import * as path from 'path';
import chalk from 'chalk';
import { DiffEngine } from '../core/DiffEngine';
import { readJsonFile, fileExists } from '../utils/fileUtils';
import { Snapshot } from '../types';

/**
 * Diffコマンドのオプション設定
 */
export interface DiffOptions {
  /** 比較元スナップショットファイルのパス */
  from: string;
  /** 比較先スナップショットファイルのパス（任意・省略時は最新） */
  to?: string;
}

/**
 * DiffCommand - デザインシステム差分検出・表示コマンド
 * 
 * このクラスは、2つのスナップショット間の差分を検出し、
 * 分かりやすい形式で変更内容を表示します。
 * 
 * 主な機能：
 * 1. スナップショット間の詳細差分計算
 * 2. コンポーネント変更の検出と分類
 * 3. デザイントークン変更の検出
 * 4. 視覚的な差分表示（色分け・統計）
 * 
 * 差分検出内容：
 * - 追加/削除されたコンポーネント
 * - 変更されたTailwindクラス
 * - Props の変更
 * - デザイントークンの変更
 * 
 * 活用場面：
 * - PR レビュー時の変更確認
 * - リリース前の変更サマリー
 * - デザインシステム進化の追跡
 */
export class DiffCommand {
  private options: DiffOptions;
  private diffEngine: DiffEngine;

  /**
   * DiffCommandのコンストラクタ
   * 
   * @param options - 差分検出オプション
   */
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