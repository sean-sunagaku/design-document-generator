import * as chokidar from 'chokidar';
import * as path from 'path';
import chalk from 'chalk';
import { SnapshotCommand } from './snapshot';
import { fileExists } from '../utils/fileUtils';

/**
 * Watchコマンドのオプション設定
 */
export interface WatchOptions {
  /** 監視対象のソースディレクトリのパス */
  source: string;
  /** 設定ファイルのパス（任意） */
  config?: string;
}

/**
 * WatchCommand - リアルタイムファイル監視・自動スナップショット更新コマンド
 * 
 * このクラスは、指定されたディレクトリ内のコンポーネントファイルを
 * リアルタイムで監視し、変更を検出した際に自動的にスナップショットを
 * 更新する継続的な監視システムを提供します。
 * 
 * 主な機能：
 * 1. ファイルシステムの変更検出（追加・変更・削除）
 * 2. 自動スナップショット更新（debounce機能付き）
 * 3. リアルタイム変更通知と視覚的フィードバック
 * 4. グレースフルシャットダウン対応
 * 
 * 監視対象：
 * - React/TypeScriptコンポーネントファイル（.tsx、.jsx、.ts）
 * - Tailwind設定ファイル（tailwind.config.js/ts）
 * - テストファイル等は除外（.test.、.spec.、.stories.）
 * 
 * 活用場面：
 * - 開発中の継続的なデザインシステム状態追跡
 * - CI/CDでの自動化されたスナップショット管理
 * - チーム開発での変更リアルタイム共有
 * - 長時間稼働する開発環境での自動化
 * 
 * 技術的特徴：
 * - chokidarベースの高性能ファイル監視
 * - debounce機能による無駄な更新抑制（1秒間隔）
 * - SIGINT対応のグレースフルシャットダウン
 * - 分かりやすい色分けされたコンソール出力
 */
export class WatchCommand {
  private options: WatchOptions;
  private watcher: chokidar.FSWatcher | null = null;

  /**
   * WatchCommandのコンストラクタ
   * 
   * @param options - 監視設定オプション
   */
  constructor(options: WatchOptions) {
    this.options = options;
  }

  /**
   * ファイル監視の実行メイン処理
   * 
   * ファイルシステム監視を開始し、変更検出時の自動スナップショット
   * 更新機能を提供します。プロセスは手動停止まで継続動作します。
   * 
   * 実行手順：
   * 1. ソースディレクトリの存在確認
   * 2. 初期スナップショットの作成
   * 3. ファイル監視システムのセットアップ
   * 4. 変更検出イベントハンドラの登録
   * 5. グレースフルシャットダウンハンドラの設定
   * 6. 継続的な監視モードの開始
   * 
   * 監視対象ファイルパターン：
   * - **/*.tsx, **/*.jsx, **/*.ts（コンポーネント）
   * - tailwind.config.js/ts（設定ファイル）
   * 
   * 除外対象：
   * - node_modules配下の全ファイル
   * - テスト関連ファイル（.test.、.spec.、.stories.）
   * - ビルド生成物（dist/、build/）
   * - スナップショット格納ディレクトリ
   * 
   * エラーハンドリング：
   * - ソースディレクトリ不存在時の即座の終了
   * - 個別ファイル処理エラーの継続的処理
   * - ファイル監視エラーの適切な通知
   */
  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve('./.design-system-snapshots/snapshot.json');

    // フェーズ1: 前提条件の確認
    if (!await fileExists(sourcePath)) {
      console.error(chalk.red(`Source directory not found: ${sourcePath}`));
      process.exit(1);
    }

    // フェーズ2: 初期スナップショット作成
    // 監視開始前に現在の状態を記録し、変更検出の基準点を確立
    console.log(chalk.blue('Creating initial snapshot...'));
    const snapshotCommand = new SnapshotCommand({
      source: this.options.source,
      config: this.options.config,
      output: outputPath,
      format: 'json',
    });
    await snapshotCommand.execute();

    // フェーズ3: ファイル監視システムのセットアップ
    // 高性能なchokidar監視システムを使用して効率的な変更検出を実現
    const watchPatterns = [
      `${sourcePath}/**/*.tsx`,     // Reactコンポーネント（TSX）
      `${sourcePath}/**/*.jsx`,     // Reactコンポーネント（JSX）
      `${sourcePath}/**/*.ts`,      // TypeScriptファイル
      './tailwind.config.js',       // Tailwind設定（JS）
      './tailwind.config.ts',       // Tailwind設定（TS）
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: [
        '**/node_modules/**',           // パッケージファイル除外
        '**/*.test.*',                  // テストファイル除外
        '**/*.spec.*',                  // スペックファイル除外
        '**/*.stories.*',               // Storybookファイル除外
        '**/dist/**',                   // ビルド出力除外
        '**/build/**',                  // ビルド出力除外
        '**/.design-system-snapshots/**', // スナップショットディレクトリ除外
      ],
      persistent: true,               // プロセス継続のための永続化
      ignoreInitial: true,            // 初期ファイル読み込みイベント無視
    });

    console.log(chalk.green('👀 Watching for changes...'));
    console.log(chalk.gray('Press Ctrl+C to stop'));

    // フェーズ4: Debounce機能付きスナップショット更新機能
    // 短時間での連続変更に対する無駄な処理を防止（1秒間のdebounce）
    let updateTimeout: NodeJS.Timeout | null = null;

    /**
     * スナップショット更新処理
     * 
     * ファイル変更検出時に実行される自動更新処理です。
     * エラー発生時も監視を継続し、適切なフィードバックを提供します。
     * 
     * 処理内容：
     * 1. 変更通知の表示
     * 2. スナップショットコマンドの実行
     * 3. 成功・失敗の結果表示
     * 4. エラー時の継続的な監視維持
     */
    const updateSnapshot = async () => {
      try {
        console.log(chalk.yellow('🔄 Updating snapshot...'));
        await snapshotCommand.execute();
        console.log(chalk.green('✅ Snapshot updated'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to update snapshot:'), error);
        // エラーが発生しても監視は継続
      }
    };

    // フェーズ5: ファイル変更イベントハンドラの登録
    // 各種ファイル操作（変更・追加・削除）に対する適切な応答を設定
    this.watcher
      .on('change', (filePath) => {
        console.log(chalk.blue(`📝 Changed: ${path.relative(process.cwd(), filePath)}`));
        
        // Debounce機能: 連続した変更を1秒間まとめて処理
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('add', (filePath) => {
        console.log(chalk.green(`➕ Added: ${path.relative(process.cwd(), filePath)}`));
        
        // 新しいファイル追加時も同様にdebounce処理
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('unlink', (filePath) => {
        console.log(chalk.red(`🗑️ Removed: ${path.relative(process.cwd(), filePath)}`));
        
        // ファイル削除時の適切なスナップショット更新
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(updateSnapshot, 1000);
      })
      .on('error', (error) => {
        console.error(chalk.red('❌ Watcher error:'), error);
        // 監視エラー発生時も継続動作（可能な限り）
      });

    // フェーズ6: グレースフルシャットダウンハンドラの設定
    // Ctrl+C（SIGINT）による正常終了処理を実装
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping file watcher...'));
      if (this.watcher) {
        this.watcher.close();
      }
      console.log(chalk.gray('Watch process terminated successfully'));
      process.exit(0);
    });

    // フェーズ7: 継続的な監視モードの開始
    // プロセスを生存させ、ファイル変更イベントを待機
    await new Promise(() => {});
  }
}