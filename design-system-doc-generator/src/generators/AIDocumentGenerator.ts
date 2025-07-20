import * as fs from 'fs';
import * as path from 'path';
import { 
  ExtractedComponent, 
  DesignTokens, 
  GeneratorOptions, 
  ProjectInfo,
  AIDocument,
  DocumentGenerationContext,
  GenerationResult,
  GenerationMetadata
} from '../types';
import { ensureDirectoryExists } from '../utils/fileUtils';
import { ComponentDocumentGenerator } from './document/ComponentDocumentGenerator';
import { PatternDetector } from './document/PatternDetector';
import { GuidelineGenerator } from './document/GuidelineGenerator';
import { MarkdownFormatter } from './document/MarkdownFormatter';

/**
 * AIDocumentGenerator - AI最適化ドキュメント生成エンジン
 * 
 * このクラスは、抽出されたコンポーネント情報からAI（大規模言語モデル）が理解しやすい
 * 形式のドキュメントを生成する中核的なオーケストレーターです。デザインシステムの全体像を
 * 構造化されたJSON形式とMarkdown形式で出力し、コンポーネントライブラリの自動ドキュメント化、
 * デザインパターンの検出、ベストプラクティスの提案を行います。
 * 
 * 主な責務:
 * - 抽出されたコンポーネント群の包括的なドキュメント生成
 * - デザインパターンの自動検出と分類
 * - コンポーネント間の関係性分析
 * - ベストプラクティスガイドラインの自動生成
 * - AI最適化された構造化ドキュメントの作成
 * - JSON/Markdown両形式での出力サポート
 * 
 * アーキテクチャパターン:
 * - Orchestrator Pattern: 複数の専門ジェネレーターを協調動作
 * - Strategy Pattern: 出力形式（JSON/Markdown）の柔軟な切り替え
 * - Builder Pattern: 段階的なドキュメント構築プロセス
 * - Composite Pattern: 階層的なドキュメント構造の管理
 * 
 * AI最適化の特徴:
 * - LLMが理解しやすい構造化データ形式
 * - 意味的な関係性を明示的に記述
 * - コンテキスト情報の豊富な提供
 * - パターンと例外の明確な区別
 * - 進化可能なスキーマ設計
 * 
 * 生成される情報:
 * - プロジェクト基本情報（名前、バージョン、技術スタック）
 * - デザイントークン一覧（色、タイポグラフィ、間隔等）
 * - コンポーネント詳細ドキュメント（プロパティ、使用例、分類）
 * - デザインパターン分析結果
 * - ベストプラクティスガイドライン
 * - 生成メタデータ（処理時間、統計情報等）
 * 
 * 使用例:
 * const generator = new AIDocumentGenerator();
 * const result = await generator.generate(components, tokens, options);
 * await generator.saveAsJSON(result.document, 'docs/design-system.json');
 * await generator.saveAsMarkdown(result.document, 'docs/design-system.md');
 * 
 * 他クラスとの関係:
 * - ComponentDocumentGenerator: 個別コンポーネントの詳細ドキュメント生成
 * - PatternDetector: デザインパターンの検出と分類
 * - GuidelineGenerator: ベストプラクティスガイドラインの生成
 * - MarkdownFormatter: 人間が読みやすいMarkdown形式への変換
 * - TailwindExtractor: このクラスで生成されたコンポーネント情報を受け取る
 */

export class AIDocumentGenerator {
  private componentDocGenerator: ComponentDocumentGenerator;  // 個別コンポーネントドキュメント生成器
  private patternDetector: PatternDetector;                   // デザインパターン検出器
  private guidelineGenerator: GuidelineGenerator;             // ガイドライン生成器
  private markdownFormatter: MarkdownFormatter;               // Markdown形式変換器

  /**
   * AIDocumentGeneratorの初期化
   * 
   * 依存する全ての専門ジェネレーターを初期化し、ドキュメント生成パイプラインを構築します。
   * 各ジェネレーターは特定の責務を持ち、協調してAI最適化ドキュメントを生成します。
   */
  constructor() {
    this.componentDocGenerator = new ComponentDocumentGenerator();
    this.patternDetector = new PatternDetector();
    this.guidelineGenerator = new GuidelineGenerator();
    this.markdownFormatter = new MarkdownFormatter();
  }

  /**
   * AI最適化ドキュメントを生成するメインメソッド
   * 
   * 抽出されたコンポーネント群とデザイントークンから、AI（大規模言語モデル）が理解しやすい
   * 構造化ドキュメントを生成します。複数の専門ジェネレーターを協調動作させ、
   * 包括的なデザインシステムドキュメントを作成します。
   * 
   * 生成プロセス:
   * 1. プロジェクト情報の収集（package.json解析）
   * 2. 個別コンポーネントドキュメントの生成
   * 3. デザインパターンの自動検出・分類
   * 4. ベストプラクティスガイドラインの生成
   * 5. メタデータの収集（処理時間、統計等）
   * 
   * @param components 抽出されたコンポーネント一覧
   * @param tokens デザイントークン情報
   * @param options 生成オプション設定
   * @returns 生成されたドキュメントとメタデータ
   */
  async generate(
    components: ExtractedComponent[],
    tokens: DesignTokens,
    options: GeneratorOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    // 生成コンテキストの構築
    const context: DocumentGenerationContext = {
      components,
      tokens,
      options
    };

    // AI最適化ドキュメントの基本構造を初期化
    const document: AIDocument = {
      version: '1.0.0',                           // ドキュメントスキーマバージョン
      generated: new Date().toISOString(),        // 生成時刻（ISO形式）
      project: await this.getProjectInfo(),       // プロジェクト基本情報
      tokens,                                     // デザイントークン
      components: [],                             // コンポーネントドキュメント（後続で追加）
      patterns: [],                               // デザインパターン（後続で追加）
      guidelines: [],                             // ガイドライン（後続で追加）
    };

    // フェーズ1: 個別コンポーネントドキュメントの生成
    // 各コンポーネントを詳細に解析し、AI理解可能な形式でドキュメント化
    for (const component of components) {
      const componentDoc = this.componentDocGenerator.generateComponentDoc(
        component, 
        components,  // 他コンポーネントとの関係性分析用
        options
      );
      document.components.push(componentDoc);
    }

    // フェーズ2: デザインパターンの自動検出
    // コンポーネント群から再利用可能なパターンを特定・分類
    const patternResult = this.patternDetector.detectPatterns(components);
    document.patterns = patternResult.patterns;

    // フェーズ3: ベストプラクティスガイドラインの生成
    // コンポーネントとトークンの使用状況から推奨事項を生成
    document.guidelines = this.guidelineGenerator.generateGuidelines(components, tokens);

    // 生成メタデータの収集
    const metadata: GenerationMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      duration: Date.now() - startTime,           // 処理時間（ミリ秒）
      componentsProcessed: components.length,     // 処理したコンポーネント数
    };

    return { document, metadata };
  }

  /**
   * プロジェクト基本情報の取得
   * 
   * package.jsonファイルを解析してプロジェクトの基本情報を取得します。
   * ファイルが存在しない場合やパースに失敗した場合は、安全なデフォルト値を返します。
   * 
   * 取得される情報:
   * - プロジェクト名（package.json > name）
   * - バージョン（package.json > version）
   * - フレームワーク（現在はReact固定、将来的に自動検出予定）
   * - スタイリング手法（現在はTailwind固定、将来的に自動検出予定）
   * 
   * @returns プロジェクト基本情報オブジェクト
   */
  private async getProjectInfo(): Promise<ProjectInfo> {
    try {
      // 現在の作業ディレクトリからpackage.jsonを読み込み
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
      
      return {
        name: packageJson.name || 'unknown',       // プロジェクト名
        version: packageJson.version || '0.0.0',   // バージョン
        framework: 'react',                        // フレームワーク（TODO: 自動検出）
        styling: 'tailwindcss',                    // スタイル手法（TODO: 自動検出）
      };
    } catch {
      // ファイル読み込みまたはパースエラー時のフォールバック
      return {
        name: 'unknown',
        version: '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    }
  }

  /**
   * ドキュメントをJSON形式で保存
   * 
   * 生成されたAI最適化ドキュメントを、構造化されたJSON形式でファイルに保存します。
   * 出力ディレクトリが存在しない場合は自動的に作成し、読みやすいように
   * 2スペースのインデントでフォーマットします。
   * 
   * JSON形式の用途:
   * - AI/LLMによる自動処理
   * - プログラマティックなアクセス
   * - データ分析・統計処理
   * - 他システムとの連携
   * 
   * @param document 保存対象のAIドキュメント
   * @param outputPath 出力ファイルパス
   */
  async saveAsJSON(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const jsonContent = JSON.stringify(document, null, 2);  // 2スペースインデント
    await fs.promises.writeFile(outputPath, jsonContent, 'utf-8');
  }

  /**
   * ドキュメントをMarkdown形式で保存
   * 
   * 生成されたAI最適化ドキュメントを、人間が読みやすいMarkdown形式に変換して
   * ファイルに保存します。MarkdownFormatterを使用して構造化データを
   * 見やすい文書形式に変換します。
   * 
   * Markdown形式の用途:
   * - 開発者向けドキュメント
   * - GitHubなどでの表示
   * - ドキュメントサイトでの利用
   * - チーム内での情報共有
   * 
   * @param document 保存対象のAIドキュメント
   * @param outputPath 出力ファイルパス
   */
  async saveAsMarkdown(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const markdown = this.markdownFormatter.generateMarkdown(document);
    await fs.promises.writeFile(outputPath, markdown, 'utf-8');
  }
}