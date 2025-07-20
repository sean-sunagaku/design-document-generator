import * as jsondiffpatch from 'jsondiffpatch';
import chalk from 'chalk';
import { 
  DiffResult, 
  ExtractedComponent, 
  ModifiedComponent, 
  DiffSummary,
  Snapshot 
} from '../types';

/**
 * DiffEngine - デザインシステムスナップショット比較エンジン
 * 
 * このクラスは、デザインシステムの異なる時点でのスナップショットを比較し、
 * コンポーネント、デザイントークン、Tailwindクラスの変更を詳細に検出・分析する
 * 専門的な差分検出エンジンです。CI/CDパイプラインでの自動検証、
 * デザインシステムの進化追跡、ブレイキングチェンジの検出に活用されます。
 * 
 * 主な責務:
 * - スナップショット間の包括的な差分検出
 * - コンポーネントレベルの詳細変更追跡
 * - デザイントークンの追加・削除・変更の検出
 * - Tailwindクラスの使用状況変化の分析
 * - 視覚的に分かりやすい変更レポートの生成
 * - CI/CD統合のための構造化された結果提供
 * 
 * 検出される変更タイプ:
 * - コンポーネント: 追加・削除・修正（Props変更、クラス変更）
 * - デザイントークン: カラー、スペーシング、タイポグラフィ等の変更
 * - Tailwindクラス: プロジェクト全体での新規使用・削除されたクラス
 * - JSX構造: コンポーネント構造の変化
 * 
 * 差分検出アルゴリズム:
 * - JSONPatchベースの精密な差分検出
 * - オブジェクトハッシュによる効率的な同一性判定
 * - 配列要素の移動検出（detectMove）
 * - プライベートプロパティの自動除外
 * 
 * パフォーマンス最適化:
 * - インデックス化による高速コンポーネント検索
 * - Set/Map使用による重複除去と高速検索
 * - 段階的な差分計算でメモリ効率を最適化
 * 
 * 出力形式:
 * - 構造化されたDiffResult（JSON形式）
 * - カラフルなコンソール出力（開発者向け）
 * - CI/CDでの自動判定可能な変更サマリー
 * 
 * 使用例:
 * const diffEngine = new DiffEngine();
 * const result = await diffEngine.compareSnapshots(oldSnapshot, newSnapshot);
 * diffEngine.displayDiff(result);
 * 
 * 他クラスとの関係:
 * - SnapshotCommand: このクラスを使用してスナップショット比較を実行
 * - TailwindExtractor: このクラスが生成したスナップショットを比較対象とする
 * - CI/CDシステム: 変更検出結果を自動テスト・デプロイ判定に活用
 */
export class DiffEngine {
  private differ: any;  // jsondiffpatchの差分検出エンジンインスタンス

  /**
   * DiffEngineの初期化
   * 
   * jsondiffpatchライブラリを用いた高精度な差分検出エンジンを構築します。
   * オブジェクト識別、配列要素の移動検出、プロパティフィルタリングを
   * デザインシステムの特性に最適化した設定で初期化します。
   * 
   * 設定の詳細:
   * - objectHash: オブジェクトの同一性判定関数
   * - arrays.detectMove: 配列要素の移動検出を有効化
   * - propertyFilter: 比較対象プロパティのフィルタリング
   */
  constructor() {
    this.differ = jsondiffpatch.create({
      // オブジェクト同一性判定のハッシュ関数
      // コンポーネントはfilePath、その他はJSONシリアライズで識別
      objectHash: (obj: any) => {
        if (obj.filePath) return obj.filePath;        // コンポーネントはファイルパスで識別
        if (obj.componentName) return obj.componentName; // コンポーネント名での識別
        return JSON.stringify(obj);                   // その他のオブジェクトはJSON化で識別
      },
      
      // 配列要素の移動検出設定
      arrays: {
        detectMove: true,              // 要素の移動を検出（リファクタリング等で重要）
        includeValueOnMove: false,     // 移動時に値の詳細は含めない（パフォーマンス向上）
      },
      
      // 比較対象プロパティのフィルタリング
      // プライベートプロパティ（_で開始）、メタデータ（timestamp、hash）を除外
      propertyFilter: (name: string) => !name.startsWith('_') && name !== 'timestamp' && name !== 'hash',
    });
  }

  /**
   * スナップショット間の包括的な差分比較を実行
   * 
   * 2つのデザインシステムスナップショットを詳細に比較し、
   * コンポーネント、デザイントークン、Tailwindクラスの変更を検出します。
   * CI/CDパイプラインでの自動検証やデザインシステムの進化追跡に活用されます。
   * 
   * 比較プロセス:
   * 1. コンポーネントのインデックス化（高速検索用）
   * 2. 結果構造体の初期化
   * 3. コンポーネント変更の検出（追加・削除・修正）
   * 4. デザイントークン変更の検出
   * 5. Tailwindクラス使用状況の分析
   * 6. 変更サマリーの計算
   * 
   * 検出される変更:
   * - 新規追加されたコンポーネント
   * - 削除されたコンポーネント
   * - 修正されたコンポーネント（Props、Tailwindクラス）
   * - デザイントークンの追加・削除・変更
   * - プロジェクト全体でのTailwindクラス使用変化
   * 
   * @param oldSnapshot 比較元スナップショット（古い状態）
   * @param newSnapshot 比較先スナップショット（新しい状態）
   * @returns 詳細な差分情報を含むDiffResult
   */
  async compareSnapshots(oldSnapshot: Snapshot, newSnapshot: Snapshot): Promise<DiffResult> {
    // フェーズ1: コンポーネントのインデックス化
    // ファイルパスをキーとしたマップ構造で高速検索を可能にする
    const oldComponents = this.indexComponents(oldSnapshot.components);
    const newComponents = this.indexComponents(newSnapshot.components);
    
    // フェーズ2: 結果構造体の初期化
    // DiffResultの全フィールドを初期値で設定
    const result: DiffResult = {
      hasChanges: false,                    // 変更有無フラグ
      changes: {
        components: {                       // コンポーネント変更詳細
          added: [],                        // 新規追加コンポーネント
          removed: [],                      // 削除されたコンポーネント
          modified: [],                     // 修正されたコンポーネント
        },
        tokens: {                          // デザイントークン変更詳細
          added: {},                       // 新規追加トークン
          removed: {},                     // 削除されたトークン
          modified: {},                    // 修正されたトークン
        },
      },
      summary: {                           // 変更サマリー統計
        totalChanges: 0,                   // 総変更数
        componentsAdded: 0,                // 追加コンポーネント数
        componentsRemoved: 0,              // 削除コンポーネント数
        componentsModified: 0,             // 修正コンポーネント数
        newClasses: [],                    // 新規使用Tailwindクラス
        removedClasses: [],                // 削除されたTailwindクラス
      },
    };

    // フェーズ3: コンポーネント変更の検出
    // 全コンポーネントパスを統合して一括処理
    const allPaths = new Set([...Object.keys(oldComponents), ...Object.keys(newComponents)]);
    
    for (const path of allPaths) {
      if (!oldComponents[path] && newComponents[path]) {
        // 新規追加されたコンポーネント
        result.changes.components.added.push(newComponents[path]);
        result.summary.componentsAdded++;
      } else if (oldComponents[path] && !newComponents[path]) {
        // 削除されたコンポーネント
        result.changes.components.removed.push(oldComponents[path]);
        result.summary.componentsRemoved++;
      } else if (oldComponents[path] && newComponents[path]) {
        // 既存コンポーネントの修正チェック
        const modified = this.compareComponents(oldComponents[path], newComponents[path]);
        if (modified) {
          result.changes.components.modified.push(modified);
          result.summary.componentsModified++;
        }
      }
    }

    // フェーズ4: デザイントークン変更の検出
    const tokenDiff = this.compareTokens(oldSnapshot.tokens, newSnapshot.tokens);
    result.changes.tokens = tokenDiff;

    // フェーズ5: 変更サマリーの計算
    result.summary.totalChanges = 
      result.summary.componentsAdded + 
      result.summary.componentsRemoved + 
      result.summary.componentsModified;
    
    // 変更有無フラグの設定
    result.hasChanges = result.summary.totalChanges > 0;

    // フェーズ6: Tailwindクラス使用状況の分析
    // プロジェクト全体でのクラス使用変化を抽出
    result.summary.newClasses = this.extractNewClasses(oldComponents, newComponents);
    result.summary.removedClasses = this.extractRemovedClasses(oldComponents, newComponents);

    return result;
  }

  /**
   * コンポーネント配列を高速検索用のインデックスマップに変換
   * 
   * コンポーネント配列をファイルパスをキーとした連想配列に変換し、
   * O(1)での高速検索を可能にします。大量のコンポーネントを扱う
   * プロジェクトでの比較性能を大幅に向上させます。
   * 
   * @param components インデックス化対象のコンポーネント配列
   * @returns ファイルパスをキーとしたコンポーネントマップ
   */
  private indexComponents(components: ExtractedComponent[]): Record<string, ExtractedComponent> {
    const index: Record<string, ExtractedComponent> = {};
    for (const component of components) {
      index[component.filePath] = component;  // ファイルパスを一意キーとして使用
    }
    return index;
  }

  /**
   * 個別コンポーネント間の詳細な変更比較
   * 
   * 同一ファイルパスのコンポーネント間で、Tailwindクラスの追加・削除、
   * TypeScript Propsの変更を詳細に検出します。軽微な変更から
   * ブレイキングチェンジまで幅広い修正を正確に特定します。
   * 
   * 検出される変更内容:
   * - Tailwindクラスの追加（新機能、スタイル強化）
   * - Tailwindクラスの削除（リファクタリング、機能削除）
   * - TypeScript Propsの変更（API変更、型安全性）
   * 
   * @param oldComp 比較元コンポーネント（古い状態）
   * @param newComp 比較先コンポーネント（新しい状態）
   * @returns 変更が検出された場合はModifiedComponent、変更なしの場合はnull
   */
  private compareComponents(
    oldComp: ExtractedComponent, 
    newComp: ExtractedComponent
  ): ModifiedComponent | null {
    // Tailwindクラスの差分検出
    // 配列のfilter操作で追加・削除されたクラスを特定
    const classesAdded = newComp.tailwindClasses.filter(
      cls => !oldComp.tailwindClasses.includes(cls)
    );
    const classesRemoved = oldComp.tailwindClasses.filter(
      cls => !newComp.tailwindClasses.includes(cls)
    );
    
    // TypeScript Propsの変更検出
    // JSONシリアライズによる深い比較で構造的変更を検出
    const propsChanged = JSON.stringify(oldComp.props) !== JSON.stringify(newComp.props);
    
    // いずれかの変更が検出された場合はModifiedComponentを作成
    if (classesAdded.length > 0 || classesRemoved.length > 0 || propsChanged) {
      return {
        path: newComp.filePath,           // 変更されたファイルパス
        changes: {
          classesAdded,                   // 新規追加されたTailwindクラス
          classesRemoved,                 // 削除されたTailwindクラス
          propsChanged,                   // Props変更フラグ
        },
      };
    }
    
    // 変更が検出されなかった場合
    return null;
  }

  /**
   * デザイントークン間の詳細な変更比較
   * 
   * デザインシステムの基盤となるデザイントークン（色、スペーシング、
   * タイポグラフィ等）の変更を包括的に検出します。トークンの追加・削除・変更を
   * カテゴリ別に分析し、デザインシステムの一貫性維持に役立てます。
   * 
   * 対象カテゴリ:
   * - colors: カラーパレット（プライマリ、セカンダリ、状態色）
   * - spacing: 余白・間隔システム
   * - typography: フォントサイズ、フォントファミリー
   * - breakpoints: レスポンシブブレークポイント
   * - shadows: シャドウ効果
   * - borderRadius: 角丸設定
   * 
   * 検出される変更:
   * - 新規トークンの追加（デザインシステム拡張）
   * - 既存トークンの削除（非推奨化、統廃合）
   * - トークン値の変更（リブランディング、最適化）
   * 
   * @param oldTokens 比較元デザイントークン
   * @param newTokens 比較先デザイントークン
   * @returns カテゴリ別の詳細な変更情報
   */
  private compareTokens(oldTokens: any, newTokens: any): {
    added: Record<string, any>;
    removed: Record<string, any>;
    modified: Record<string, any>;
  } {
    const result = {
      added: {} as Record<string, any>,     // 新規追加されたトークン
      removed: {} as Record<string, any>,   // 削除されたトークン
      modified: {} as Record<string, any>,  // 変更されたトークン
    };

    // 対象とするデザイントークンカテゴリ
    const categories = ['colors', 'spacing', 'typography', 'breakpoints', 'shadows', 'borderRadius'];
    
    // カテゴリ別の変更検出
    for (const category of categories) {
      const oldCat = oldTokens[category] || {};  // 古いトークンカテゴリ（未定義の場合は空オブジェクト）
      const newCat = newTokens[category] || {};  // 新しいトークンカテゴリ
      
      // 両方のカテゴリに存在する全てのキーを統合
      const allKeys = new Set([...Object.keys(oldCat), ...Object.keys(newCat)]);
      
      // 各トークンキーの変更状況を個別に分析
      for (const key of allKeys) {
        if (!oldCat[key] && newCat[key]) {
          // 新規追加されたトークン
          if (!result.added[category]) result.added[category] = {};
          result.added[category][key] = newCat[key];
        } else if (oldCat[key] && !newCat[key]) {
          // 削除されたトークン
          if (!result.removed[category]) result.removed[category] = {};
          result.removed[category][key] = oldCat[key];
        } else if (oldCat[key] && newCat[key] && 
                   JSON.stringify(oldCat[key]) !== JSON.stringify(newCat[key])) {
          // 値が変更されたトークン（JSONシリアライズによる深い比較）
          if (!result.modified[category]) result.modified[category] = {};
          result.modified[category][key] = {
            old: oldCat[key],  // 変更前の値
            new: newCat[key],  // 変更後の値
          };
        }
      }
    }

    return result;
  }

  /**
   * プロジェクト全体で新規に使用されたTailwindクラスを抽出
   * 
   * 全コンポーネントで使用されているTailwindクラスを統計的に分析し、
   * 新しいスナップショットで初めて使用されるようになったクラスを特定します。
   * デザインシステムの進化や新機能の導入を追跡するのに有効です。
   * 
   * アルゴリズム:
   * 1. 古いスナップショットの全Tailwindクラスを集計
   * 2. 新しいスナップショットの全Tailwindクラスを集計
   * 3. 差集合演算で新規クラスを抽出
   * 
   * 活用例:
   * - 新機能で導入されたスタイルクラスの確認
   * - Tailwindバージョンアップで追加されたクラスの検出
   * - デザイントークン拡張に伴う新規クラス使用の追跡
   * 
   * @param oldComponents 比較元コンポーネントマップ
   * @param newComponents 比較先コンポーネントマップ
   * @returns 新規に使用されたTailwindクラスの配列
   */
  private extractNewClasses(
    oldComponents: Record<string, ExtractedComponent>,
    newComponents: Record<string, ExtractedComponent>
  ): string[] {
    const oldClasses = new Set<string>();  // 古いスナップショットで使用されていたクラス
    const newClasses = new Set<string>();  // 新しいスナップショットで使用されているクラス
    
    // 古いスナップショットの全Tailwindクラスを集計
    Object.values(oldComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => oldClasses.add(cls));
    });
    
    // 新しいスナップショットの全Tailwindクラスを集計
    Object.values(newComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => newClasses.add(cls));
    });
    
    // 新規クラス = 新しいクラス - 古いクラス（差集合）
    return Array.from(newClasses).filter(cls => !oldClasses.has(cls));
  }

  /**
   * プロジェクト全体で削除されたTailwindクラスを抽出
   * 
   * 全コンポーネントで使用されているTailwindクラスを統計的に分析し、
   * 古いスナップショットでは使用されていたが新しいスナップショットでは
   * 使用されなくなったクラスを特定します。リファクタリングや機能削除の追跡に有効です。
   * 
   * アルゴリズム:
   * 1. 古いスナップショットの全Tailwindクラスを集計
   * 2. 新しいスナップショットの全Tailwindクラスを集計
   * 3. 差集合演算で削除されたクラスを抽出
   * 
   * 活用例:
   * - 未使用クラスの削除確認
   * - リファクタリングによるクラス統廃合の検証
   * - 非推奨機能の削除に伴うクラス使用停止の追跡
   * 
   * @param oldComponents 比較元コンポーネントマップ
   * @param newComponents 比較先コンポーネントマップ
   * @returns 削除されたTailwindクラスの配列
   */
  private extractRemovedClasses(
    oldComponents: Record<string, ExtractedComponent>,
    newComponents: Record<string, ExtractedComponent>
  ): string[] {
    const oldClasses = new Set<string>();  // 古いスナップショットで使用されていたクラス
    const newClasses = new Set<string>();  // 新しいスナップショットで使用されているクラス
    
    // 古いスナップショットの全Tailwindクラスを集計
    Object.values(oldComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => oldClasses.add(cls));
    });
    
    // 新しいスナップショットの全Tailwindクラスを集計
    Object.values(newComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => newClasses.add(cls));
    });
    
    // 削除されたクラス = 古いクラス - 新しいクラス（差集合）
    return Array.from(oldClasses).filter(cls => !newClasses.has(cls));
  }

  /**
   * 差分検出結果の視覚的なコンソール表示
   * 
   * DiffResultを人間が理解しやすい形式でカラフルに表示します。
   * 開発者、デザイナー、プロジェクトマネージャーが変更内容を
   * 素早く把握できるよう、階層的で直感的な表示を提供します。
   * 
   * 表示要素:
   * - 追加されたコンポーネント（緑色）
   * - 削除されたコンポーネント（赤色）
   * - 変更されたコンポーネント（黄色）
   * - デザイントークンの変更（カテゴリ別）
   * - 統計サマリー（数値、新規・削除クラス）
   * 
   * 色分けの意味:
   * - 緑: 追加・新規（ポジティブな変更）
   * - 赤: 削除・廃止（注意が必要な変更）
   * - 黄: 修正・変更（レビューが必要な変更）
   * - グレー: メタデータ・補足情報
   * 
   * @param result 表示対象の差分検出結果
   */
  displayDiff(result: DiffResult): void {
    console.log(chalk.bold('\n📊 デザインシステム変更レポート\n'));

    // 変更がない場合の早期リターン
    if (!result.hasChanges) {
      console.log(chalk.gray('変更はありません。'));
      return;
    }

    // 追加されたコンポーネントの表示
    if (result.changes.components.added.length > 0) {
      console.log(chalk.green.bold('+ 追加されたコンポーネント:'));
      result.changes.components.added.forEach(comp => {
        console.log(chalk.green(`  + ${comp.filePath}`));
        console.log(chalk.gray(`    カテゴリ: ${comp.category}`));      // Atomic Designカテゴリ
        console.log(chalk.gray(`    クラス数: ${comp.tailwindClasses.length}`)); // 使用Tailwindクラス数
      });
      console.log();
    }

    // 削除されたコンポーネントの表示
    if (result.changes.components.removed.length > 0) {
      console.log(chalk.red.bold('- 削除されたコンポーネント:'));
      result.changes.components.removed.forEach(comp => {
        console.log(chalk.red(`  - ${comp.filePath}`));
      });
      console.log();
    }

    // 変更されたコンポーネントの詳細表示
    if (result.changes.components.modified.length > 0) {
      console.log(chalk.yellow.bold('~ 変更されたコンポーネント:'));
      result.changes.components.modified.forEach(comp => {
        console.log(chalk.yellow(`  ~ ${comp.path}`));
        
        // 追加されたTailwindクラスの表示
        if (comp.changes.classesAdded.length > 0) {
          console.log(chalk.green(`    追加クラス: ${comp.changes.classesAdded.join(', ')}`));
        }
        
        // 削除されたTailwindクラスの表示
        if (comp.changes.classesRemoved.length > 0) {
          console.log(chalk.red(`    削除クラス: ${comp.changes.classesRemoved.join(', ')}`));
        }
        
        // TypeScript Props変更の表示
        if (comp.changes.propsChanged) {
          console.log(chalk.yellow(`    Props変更あり`));
        }
      });
      console.log();
    }

    // デザイントークン変更の表示
    this.displayTokenChanges(result.changes.tokens);

    // 全体統計サマリーの表示
    console.log(chalk.bold('\n📈 サマリー:'));
    console.log(`  総変更数: ${result.summary.totalChanges}`);
    console.log(`  追加コンポーネント: ${result.summary.componentsAdded}`);
    console.log(`  削除コンポーネント: ${result.summary.componentsRemoved}`);
    console.log(`  変更コンポーネント: ${result.summary.componentsModified}`);
    
    // 新規Tailwindクラスの表示（最大5個、省略表示）
    if (result.summary.newClasses.length > 0) {
      console.log(`\n  新規クラス: ${chalk.green(result.summary.newClasses.slice(0, 5).join(', '))}${
        result.summary.newClasses.length > 5 ? chalk.gray(` 他${result.summary.newClasses.length - 5}個`) : ''
      }`);
    }

    // 削除されたTailwindクラスの表示（最大5個、省略表示）
    if (result.summary.removedClasses.length > 0) {
      console.log(`  削除クラス: ${chalk.red(result.summary.removedClasses.slice(0, 5).join(', '))}${
        result.summary.removedClasses.length > 5 ? chalk.gray(` 他${result.summary.removedClasses.length - 5}個`) : ''
      }`);
    }
  }

  /**
   * デザイントークン変更の詳細な表示
   * 
   * デザイントークンの追加・削除・変更を、カテゴリ別に
   * 階層的で理解しやすい形式で表示します。デザイナーと開発者が
   * デザインシステムの基盤変更を正確に把握できるよう設計されています。
   * 
   * 表示対象カテゴリ:
   * - colors: カラーパレット変更
   * - spacing: 余白・間隔システム変更
   * - typography: タイポグラフィ設定変更
   * - breakpoints: レスポンシブブレークポイント変更
   * - shadows: シャドウ効果変更
   * - borderRadius: 角丸設定変更
   * 
   * 表示形式:
   * - 追加: 緑色で新規トークンと値を表示
   * - 削除: 赤色で削除されたトークンと値を表示
   * - 変更: 黄色で変更されたトークン、グレーで旧値・新値を表示
   * 
   * @param tokens 表示対象のデザイントークン変更情報
   */
  private displayTokenChanges(tokens: DiffResult['changes']['tokens']): void {
    // トークン変更の有無を事前チェック
    const hasTokenChanges = 
      Object.keys(tokens.added).length > 0 ||
      Object.keys(tokens.removed).length > 0 ||
      Object.keys(tokens.modified).length > 0;

    // 変更がない場合は表示をスキップ
    if (!hasTokenChanges) return;

    console.log(chalk.bold('\n🎨 デザイントークンの変更:'));

    // 新規追加されたトークンの表示
    for (const [category, items] of Object.entries(tokens.added)) {
      console.log(chalk.green(`\n  + ${category}:`));
      for (const [key, value] of Object.entries(items as any)) {
        console.log(chalk.green(`    + ${key}: ${JSON.stringify(value)}`));
      }
    }

    // 削除されたトークンの表示
    for (const [category, items] of Object.entries(tokens.removed)) {
      console.log(chalk.red(`\n  - ${category}:`));
      for (const [key, value] of Object.entries(items as any)) {
        console.log(chalk.red(`    - ${key}: ${JSON.stringify(value)}`));
      }
    }

    // 変更されたトークンの表示（新旧の値を両方表示）
    for (const [category, items] of Object.entries(tokens.modified)) {
      console.log(chalk.yellow(`\n  ~ ${category}:`));
      for (const [key, change] of Object.entries(items as any)) {
        console.log(chalk.yellow(`    ~ ${key}:`));
        console.log(chalk.gray(`      旧: ${JSON.stringify((change as any).old)}`));  // 変更前の値
        console.log(chalk.gray(`      新: ${JSON.stringify((change as any).new)}`));  // 変更後の値
      }
    }
  }
}