import * as fs from 'fs';
import * as path from 'path';
import { DesignTokens, ColorToken, TypographyTokens, ExtractedComponent } from '../types';

/**
 * DesignTokenExtractor - デザイントークン抽出エンジン
 * 
 * このクラスは、デザインシステムの基盤となるデザイントークン（色、スペーシング、
 * タイポグラフィ、ブレークポイント等）を複数のソースから自動抽出する専門エンジンです。
 * TailwindCSS設定ファイルとReact NativeのStyleSheetの両方に対応し、
 * 一貫性のあるデザイントークン体系を構築します。
 * 
 * 主な責務:
 * - TailwindCSS設定ファイル（tailwind.config.js）からのトークン抽出
 * - React NativeのStyleSheet.create()からのトークン抽出
 * - 抽出されたトークンの統一化・正規化
 * - デフォルトトークンの提供（設定ファイルが存在しない場合）
 * - 色値の形式変換（HEX → RGB）
 * - トークン使用状況の追跡
 * 
 * 抽出対象デザイントークン:
 * - colors: カラーパレット（プライマリ、セカンダリ、状態色、RGB変換付き）
 * - spacing: 余白・間隔システム（padding、margin、gap等）
 * - typography: タイポグラフィ設定（フォントファミリー、サイズ、ウェイト、行高）
 * - breakpoints: レスポンシブブレークポイント（sm、md、lg、xl、2xl）
 * - shadows: シャドウ効果（box-shadow、iOS/Android対応）
 * - borderRadius: 角丸設定（border-radius）
 * - custom: カスタムトークン（プロジェクト固有）
 * 
 * 対応プラットフォーム:
 * - Web: TailwindCSS設定ファイルから包括的抽出
 * - React Native: StyleSheetからプラットフォーム固有のトークン抽出
 * - ハイブリッド: 両プラットフォームの統合トークン管理
 * 
 * 抽出戦略:
 * - 段階的フォールバック（設定ファイル → StyleSheet → デフォルト）
 * - requireキャッシュクリアによる動的リロード対応
 * - エラー耐性のある堅牢な抽出処理
 * - 型安全な値の変換・検証
 * 
 * 使用例:
 * const extractor = new DesignTokenExtractor();
 * const tokens = await extractor.extractFromTailwindConfig('./tailwind.config.js');
 * const rnTokens = await extractor.extractFromStyleSheet(components);
 * 
 * 他クラスとの関係:
 * - TailwindExtractor: このクラスを使用してプロジェクトのデザイントークンを抽出
 * - AIDocumentGenerator: 抽出されたトークンをドキュメント生成で活用
 * - DiffEngine: トークンの変更検出・比較で使用
 * - ConfigManager: プラットフォーム固有の設定に基づいて抽出方法を決定
 */
export class DesignTokenExtractor {
  private requireFn: any;  // Node.jsのrequire関数（テスタビリティのため注入可能）

  /**
   * DesignTokenExtractorの初期化
   * 
   * requireFunctionを注入可能にすることで、テストでのモック化を容易にし、
   * 異なる環境（Node.js、テスト環境）での動作を保証します。
   * 
   * @param requireFn Node.jsのrequire関数（デフォルトはglobal require）
   */
  constructor(requireFn: any = require) {
    this.requireFn = requireFn;
  }

  /**
   * TailwindCSS設定ファイルからデザイントークンを抽出
   * 
   * tailwind.config.jsファイルを動的に読み込み、theme設定とtheme.extend設定から
   * デザイントークンを包括的に抽出します。設定ファイルの変更を検出するため、
   * requireキャッシュをクリアして常に最新の設定を取得します。
   * 
   * 抽出プロセス:
   * 1. 設定ファイルの存在確認
   * 2. requireキャッシュのクリア（動的リロード対応）
   * 3. 設定ファイルの読み込み
   * 4. theme設定とextend設定のマージ
   * 5. カテゴリ別トークンの抽出・変換
   * 6. エラー時のデフォルトトークン提供
   * 
   * 対応する設定構造:
   * - theme: 基本デザイントークン
   * - theme.extend: 基本設定を拡張するトークン
   * - 各種プラグインによる追加設定
   * 
   * @param configPath TailwindCSS設定ファイルのパス
   * @returns 抽出されたデザイントークン（エラー時はデフォルト値）
   */
  async extractFromTailwindConfig(configPath: string): Promise<DesignTokens> {
    try {
      // フェーズ1: 設定ファイルの存在確認
      const exists = await fs.promises.access(configPath).then(() => true).catch(() => false);
      if (!exists) {
        return this.getDefaultTokens();
      }

      // フェーズ2: requireキャッシュクリアによる動的リロード対応
      // 開発中の設定変更を確実に反映するため
      delete this.requireFn.cache[this.requireFn.resolve(path.resolve(configPath))];
      
      // フェーズ3: TailwindCSS設定ファイルの動的読み込み
      const config = this.requireFn(path.resolve(configPath));
      const theme = config.theme || {};          // 基本テーマ設定
      const extend = theme.extend || {};         // 拡張テーマ設定

      // フェーズ4: デザイントークンの構造化抽出
      const tokens: DesignTokens = {
        colors: this.extractColors(theme.colors, extend.colors),                      // カラーパレット抽出
        spacing: this.extractSpacing(theme.spacing, extend.spacing),                  // スペーシングシステム抽出
        typography: this.extractTypography(theme, extend),                            // タイポグラフィ設定抽出
        breakpoints: this.extractBreakpoints(theme.screens, extend.screens),          // ブレークポイント抽出
        shadows: this.extractShadows(theme.boxShadow, extend.boxShadow),             // シャドウ効果抽出
        borderRadius: this.extractBorderRadius(theme.borderRadius, extend.borderRadius), // 角丸設定抽出
        custom: {},                                                                   // カスタムトークン（将来拡張用）
      };

      return tokens;
    } catch (error) {
      // エラー発生時は警告を出力してデフォルトトークンを返却
      // 設定ファイルの構文エラー等でもシステム全体が停止しないよう配慮
      console.warn(`Failed to extract from Tailwind config: ${error}`);
      return this.getDefaultTokens();
    }
  }

  /**
   * TailwindCSSカラー設定からColorTokenを抽出
   * 
   * TailwindCSSのカラー設定を解析し、階層構造（例: blue.500）を含む
   * 全ての色値をColorTokenとして抽出します。HEX値のRGB変換、
   * 使用状況追跡の初期化も併せて実行します。
   * 
   * 対応するカラー構造:
   * - 単色: { primary: '#007bff' }
   * - 階層構造: { blue: { 100: '#ebf8ff', 500: '#3182ce' } }
   * - theme設定とextend設定のマージ（extendが優先）
   * 
   * 除外対象:
   * - 'DEFAULT'キー（TailwindCSSの特殊キー）
   * - null、undefined値
   * - 非オブジェクト・非文字列値
   * 
   * @param themeColors theme.colors設定
   * @param extendColors theme.extend.colors設定
   * @returns ColorTokenマップ（HEX→RGB変換、使用状況追跡付き）
   */
  private extractColors(themeColors: any = {}, extendColors: any = {}): Record<string, ColorToken> {
    const colors: Record<string, ColorToken> = {};
    
    // TailwindCSSの設定マージ（extendが基本設定を上書き）
    const allColors = { ...themeColors, ...extendColors };
    
    /**
     * 再帰的なカラー値抽出（階層構造対応）
     * 
     * TailwindCSSのネストしたカラー構造を再帰的に解析し、
     * フラットなキー構造（例: blue-500）に変換してColorTokenを生成します。
     * 
     * @param obj 解析対象のカラーオブジェクト
     * @param prefix 現在の階層のプレフィックス
     */
    const extractColorValue = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        // TailwindCSSの'DEFAULT'キーをスキップ（特殊用途のため）
        if (key === 'DEFAULT') continue;
        
        // 階層構造を考慮したキー名生成（例: blue + 500 → blue-500）
        const fullKey = prefix ? `${prefix}-${key}` : key;
        
        if (typeof value === 'string') {
          // 文字列値（色値）の場合はColorTokenを生成
          colors[fullKey] = {
            value,                                    // 元の色値（HEX、RGB、HSL等）
            rgb: this.hexToRgb(value),               // HEX値の場合はRGBに変換
            usage: [],                               // 使用状況追跡（後で更新）
          };
        } else if (typeof value === 'object' && value !== null) {
          // オブジェクト値の場合は再帰的に処理（階層構造対応）
          extractColorValue(value, fullKey);
        }
      }
    };

    extractColorValue(allColors);
    return colors;
  }

  /**
   * TailwindCSSスペーシング設定から間隔トークンを抽出
   * 
   * padding、margin、gap等で使用される間隔システムを抽出し、
   * 一貫性のあるスペーシングスケールを構築します。
   * 
   * 対応する値の形式:
   * - 文字列: '1rem', '16px', '0.5rem'
   * - 数値: 4, 8, 16（自動的に文字列に変換）
   * - rem、px、em等の単位付き値
   * 
   * @param themeSpacing theme.spacing設定
   * @param extendSpacing theme.extend.spacing設定
   * @returns スペーシングトークンマップ（全て文字列形式）
   */
  private extractSpacing(themeSpacing: any = {}, extendSpacing: any = {}): Record<string, string> {
    const spacing: Record<string, string> = {};
    const allSpacing = { ...themeSpacing, ...extendSpacing };
    
    for (const [key, value] of Object.entries(allSpacing)) {
      // 文字列または数値の場合のみ有効なスペーシング値として処理
      if (typeof value === 'string' || typeof value === 'number') {
        spacing[key] = String(value);  // 数値を文字列に統一
      }
    }
    
    return spacing;
  }

  /**
   * TailwindCSSタイポグラフィ設定から文字関連トークンを抽出
   * 
   * フォントファミリー、フォントサイズ、フォントウェイト、行の高さを
   * 統合的に抽出し、TypographyTokensとして構造化します。
   * 
   * 抽出されるタイポグラフィ要素:
   * - fontFamily: フォントファミリー設定
   * - fontSize: フォントサイズスケール
   * - fontWeight: フォントウェイト（太さ）
   * - lineHeight: 行の高さ設定
   * 
   * @param theme TailwindCSS theme設定
   * @param extend TailwindCSS theme.extend設定
   * @returns 構造化されたタイポグラフィトークン
   */
  private extractTypography(theme: any, extend: any): TypographyTokens {
    return {
      fontFamily: this.extractFontFamily(theme.fontFamily, extend.fontFamily),
      fontSize: this.extractFontSize(theme.fontSize, extend.fontSize),
      fontWeight: this.extractFontWeight(theme.fontWeight, extend.fontWeight),
      lineHeight: this.extractLineHeight(theme.lineHeight, extend.lineHeight),
    };
  }

  /**
   * フォントファミリー設定の抽出
   * 
   * TailwindCSSのフォントファミリー設定を抽出し、配列形式の
   * フォントスタックを文字列に変換します。
   * 
   * 対応する形式:
   * - 配列: ['Inter', 'system-ui', 'sans-serif'] → 'Inter, system-ui, sans-serif'
   * - 文字列: 'Arial, sans-serif' → そのまま使用
   * 
   * @param themeFonts theme.fontFamily設定
   * @param extendFonts theme.extend.fontFamily設定
   * @returns フォントファミリーマップ（カンマ区切り文字列）
   */
  private extractFontFamily(themeFonts: any = {}, extendFonts: any = {}): Record<string, string> {
    const fonts: Record<string, string> = {};
    const allFonts = { ...themeFonts, ...extendFonts };
    
    for (const [key, value] of Object.entries(allFonts)) {
      if (Array.isArray(value)) {
        // 配列形式のフォントスタックをカンマ区切り文字列に変換
        fonts[key] = value.join(', ');
      } else if (typeof value === 'string') {
        // 既に文字列の場合はそのまま使用
        fonts[key] = value;
      }
    }
    
    return fonts;
  }

  /**
   * フォントサイズ設定の抽出
   * 
   * TailwindCSSのフォントサイズ設定を抽出し、複数の値形式に対応します。
   * 
   * 対応する形式:
   * - 文字列: '1rem', '16px' → そのまま使用
   * - 配列: ['1rem', '1.5'] → 最初の値（サイズ）を使用
   * 
   * @param themeSizes theme.fontSize設定
   * @param extendSizes theme.extend.fontSize設定
   * @returns フォントサイズマップ
   */
  private extractFontSize(themeSizes: any = {}, extendSizes: any = {}): Record<string, string> {
    const sizes: Record<string, string> = {};
    const allSizes = { ...themeSizes, ...extendSizes };
    
    for (const [key, value] of Object.entries(allSizes)) {
      if (typeof value === 'string') {
        // 文字列形式のサイズをそのまま使用
        sizes[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        // 配列形式の場合は最初の要素（サイズ）を使用
        // [fontSize, lineHeight] 形式のためlineHeightは無視
        sizes[key] = value[0];
      }
    }
    
    return sizes;
  }

  /**
   * フォントウェイト設定の抽出
   * 
   * フォントの太さ設定を抽出し、全て文字列形式に統一します。
   * 
   * @param themeWeights theme.fontWeight設定
   * @param extendWeights theme.extend.fontWeight設定
   * @returns フォントウェイトマップ
   */
  private extractFontWeight(themeWeights: any = {}, extendWeights: any = {}): Record<string, string> {
    const weights: Record<string, string> = {};
    const allWeights = { ...themeWeights, ...extendWeights };
    
    for (const [key, value] of Object.entries(allWeights)) {
      weights[key] = String(value);  // 数値も文字列に統一
    }
    
    return weights;
  }

  /**
   * 行の高さ設定の抽出
   * 
   * line-heightの設定を抽出し、全て文字列形式に統一します。
   * 
   * @param themeHeights theme.lineHeight設定
   * @param extendHeights theme.extend.lineHeight設定
   * @returns 行の高さマップ
   */
  private extractLineHeight(themeHeights: any = {}, extendHeights: any = {}): Record<string, string> {
    const heights: Record<string, string> = {};
    const allHeights = { ...themeHeights, ...extendHeights };
    
    for (const [key, value] of Object.entries(allHeights)) {
      heights[key] = String(value);  // 数値も文字列に統一
    }
    
    return heights;
  }

  /**
   * ブレークポイント設定の抽出
   * 
   * レスポンシブデザイン用のブレークポイントを抽出し、
   * メディアクエリで使用可能な形式に変換します。
   * 
   * 対応する形式:
   * - 文字列: '640px', '1024px' → そのまま使用
   * - オブジェクト: { min: '768px' } → min値を抽出
   * 
   * @param themeScreens theme.screens設定
   * @param extendScreens theme.extend.screens設定
   * @returns ブレークポイントマップ
   */
  private extractBreakpoints(themeScreens: any = {}, extendScreens: any = {}): Record<string, string> {
    const breakpoints: Record<string, string> = {};
    const allScreens = { ...themeScreens, ...extendScreens };
    
    for (const [key, value] of Object.entries(allScreens)) {
      if (typeof value === 'string') {
        // 文字列形式のブレークポイント（'640px'等）
        breakpoints[key] = value;
      } else if (typeof value === 'object' && value !== null && 'min' in value) {
        // オブジェクト形式の場合はmin値を抽出
        breakpoints[key] = (value as any).min;
      }
    }
    
    return breakpoints;
  }

  /**
   * シャドウ効果設定の抽出
   * 
   * box-shadowやdrop-shadowで使用されるシャドウ効果の
   * 設定を抽出します。
   * 
   * @param themeShadows theme.boxShadow設定
   * @param extendShadows theme.extend.boxShadow設定
   * @returns シャドウ効果マップ
   */
  private extractShadows(themeShadows: any = {}, extendShadows: any = {}): Record<string, string> {
    const shadows: Record<string, string> = {};
    const allShadows = { ...themeShadows, ...extendShadows };
    
    for (const [key, value] of Object.entries(allShadows)) {
      if (typeof value === 'string') {
        shadows[key] = value;
      }
    }
    
    return shadows;
  }

  /**
   * ボーダー半径設定の抽出
   * 
   * border-radiusで使用される角丸設定を抽出します。
   * 
   * @param themeRadius theme.borderRadius設定
   * @param extendRadius theme.extend.borderRadius設定
   * @returns ボーダー半径マップ
   */
  private extractBorderRadius(themeRadius: any = {}, extendRadius: any = {}): Record<string, string> {
    const radius: Record<string, string> = {};
    const allRadius = { ...themeRadius, ...extendRadius };
    
    for (const [key, value] of Object.entries(allRadius)) {
      if (typeof value === 'string') {
        radius[key] = value;
      }
    }
    
    return radius;
  }

  /**
   * HEX色値をRGB形式に変換
   * 
   * 16進数のカラーコード（#RRGGBB）をRGB形式（rgb(r, g, b)）に変換します。
   * デザインシステムでの色値の一貫性と可読性向上のため使用されます。
   * 
   * 対応形式:
   * - #RRGGBB（6桁）
   * - 無効な形式の場合はundefinedを返却
   * 
   * @param hex 変換対象のHEX色値（#付き）
   * @returns RGB形式の色値文字列、または変換不可能な場合はundefined
   */
  private hexToRgb(hex: string): string | undefined {
    // HEX形式の基本検証（#で始まるか）
    if (!hex || !hex.startsWith('#')) return undefined;
    
    // 6桁のHEX値の正規表現マッチング
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return undefined;
    
    // 各色成分を16進数から10進数に変換
    const r = parseInt(result[1], 16);  // 赤成分
    const g = parseInt(result[2], 16);  // 緑成分
    const b = parseInt(result[3], 16);  // 青成分
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * React NativeのStyleSheetからデザイントークンを抽出
   * 
   * React NativeプロジェクトでStyleSheet.create()により定義されたスタイルから
   * デザイントークンを自動抽出します。TailwindCSS設定が存在しない
   * React Native専用プロジェクトや、ハイブリッドプロジェクトでの
   * 追加トークン抽出に活用されます。
   * 
   * 抽出プロセス:
   * 1. デフォルトトークンベースの初期化
   * 2. 各コンポーネントのStyleSheet解析
   * 3. カテゴリ別トークン抽出・統合
   * 4. プラットフォーム固有値の正規化
   * 
   * 抽出される要素:
   * - 色: backgroundColor、color、borderColor等
   * - スペーシング: padding、margin、width、height等
   * - タイポグラフィ: fontSize、fontWeight、fontFamily、lineHeight
   * - シャドウ: iOS (shadowColor) / Android (elevation)
   * - ボーダー: borderRadius、borderWidth
   * 
   * @param components StyleSheet情報を含むコンポーネント配列
   * @returns 抽出・統合されたデザイントークン
   */
  async extractFromStyleSheet(components: ExtractedComponent[]): Promise<DesignTokens> {
    const tokens: DesignTokens = this.getDefaultTokens();
    
    // 各コンポーネントのStyleSheetからトークンを段階的に抽出・統合
    for (const component of components) {
      if ((component as any).styles?.styleSheet) {
        const styleSheet = (component as any).styles.styleSheet;
        
        // カテゴリ別のトークン抽出（既存トークンに追加・マージ）
        this.extractColorsFromStyleSheet(styleSheet, tokens.colors);              // カラーパレット抽出
        this.extractSpacingFromStyleSheet(styleSheet, tokens.spacing);            // スペーシングシステム抽出
        this.extractTypographyFromStyleSheet(styleSheet, tokens.typography);      // タイポグラフィ抽出
        this.extractShadowsFromStyleSheet(styleSheet, tokens.shadows);            // シャドウ効果抽出
        this.extractBorderRadiusFromStyleSheet(styleSheet, tokens.borderRadius);  // ボーダー半径抽出
      }
    }
    
    return tokens;
  }

  /**
   * StyleSheetからカラートークンを抽出
   * 
   * React NativeのStyleSheetで定義された色値を解析し、
   * ColorTokenとして構造化します。背景色とテキスト色を
   * 分類して抽出し、使用箇所の追跡も行います。
   * 
   * @param styleSheet 解析対象のStyleSheetオブジェクト
   * @param colors 抽出されたカラートークンを格納するマップ（変更される）
   */
  private extractColorsFromStyleSheet(styleSheet: Record<string, any>, colors: Record<string, ColorToken>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      // 背景色の抽出
      if (styles.backgroundColor) {
        const colorKey = `background-${key}`;
        colors[colorKey] = {
          value: styles.backgroundColor,
          rgb: this.hexToRgb(styles.backgroundColor) || styles.backgroundColor,  // HEX変換または元の値
          usage: [key]  // 使用しているStyleSheet名を記録
        };
      }
      
      // テキスト色の抽出
      if (styles.color) {
        const colorKey = `text-${key}`;
        colors[colorKey] = {
          value: styles.color,
          rgb: this.hexToRgb(styles.color) || styles.color,  // HEX変換または元の値
          usage: [key]  // 使用しているStyleSheet名を記録
        };
      }
    }
  }

  /**
   * StyleSheetからスペーシングトークンを抽出
   * 
   * React Native固有のスペーシングプロパティ（padding、margin系）を
   * 抽出し、統一的なスペーシングシステムとして管理します。
   * 
   * 抽出対象プロパティ:
   * - padding, paddingHorizontal, paddingVertical
   * - margin, marginHorizontal, marginVertical
   * 
   * @param styleSheet 解析対象のStyleSheetオブジェクト
   * @param spacing 抽出されたスペーシングトークンを格納するマップ（変更される）
   */
  private extractSpacingFromStyleSheet(styleSheet: Record<string, any>, spacing: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      // React Native固有のスペーシングプロパティを順次抽出
      ['padding', 'paddingHorizontal', 'paddingVertical', 'margin', 'marginHorizontal', 'marginVertical'].forEach(prop => {
        if (styles[prop] !== undefined) {
          spacing[`${prop}-${key}`] = String(styles[prop]);  // 数値も文字列に統一
        }
      });
    }
  }

  /**
   * StyleSheetからタイポグラフィトークンを抽出
   * 
   * React Nativeのテキスト関連スタイルを抽出し、
   * TypographyTokensとして構造化します。
   * 
   * 抽出される要素:
   * - fontSize: フォントサイズ
   * - fontWeight: フォントの太さ
   * - fontFamily: フォントファミリー
   * - lineHeight: 行の高さ
   * 
   * @param styleSheet 解析対象のStyleSheetオブジェクト
   * @param typography 抽出されたタイポグラフィトークンを格納するオブジェクト（変更される）
   */
  private extractTypographyFromStyleSheet(styleSheet: Record<string, any>, typography: TypographyTokens): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      // フォントサイズの抽出
      if (styles.fontSize) {
        typography.fontSize[`size-${key}`] = String(styles.fontSize);
      }
      
      // フォントウェイトの抽出
      if (styles.fontWeight) {
        typography.fontWeight[`weight-${key}`] = String(styles.fontWeight);
      }
      
      // フォントファミリーの抽出
      if (styles.fontFamily) {
        typography.fontFamily[`family-${key}`] = styles.fontFamily;
      }
      
      // 行の高さの抽出
      if (styles.lineHeight) {
        typography.lineHeight[`height-${key}`] = String(styles.lineHeight);
      }
    }
  }

  /**
   * StyleSheetからシャドウトークンを抽出
   * 
   * React Nativeのプラットフォーム固有シャドウ実装を統一的なトークンに変換します。
   * iOS（shadowColor系）とAndroid（elevation）の両方に対応します。
   * 
   * 対応するシャドウ形式:
   * - iOS: shadowColor + shadowOffset + shadowRadius
   * - Android: elevation値
   * 
   * @param styleSheet 解析対象のStyleSheetオブジェクト
   * @param shadows 抽出されたシャドウトークンを格納するマップ（変更される）
   */
  private extractShadowsFromStyleSheet(styleSheet: Record<string, any>, shadows: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.shadowColor || styles.elevation) {
        const shadowKey = `shadow-${key}`;
        
        if (styles.shadowColor) {
          // iOS shadow（CSS box-shadow形式で統一）
          shadows[shadowKey] = `${styles.shadowOffset?.width || 0}px ${styles.shadowOffset?.height || 0}px ${styles.shadowRadius || 0}px ${styles.shadowColor}`;
        } else if (styles.elevation) {
          // Android elevation（プラットフォーム固有形式で保持）
          shadows[shadowKey] = `elevation-${styles.elevation}`;
        }
      }
    }
  }

  /**
   * StyleSheetからボーダー半径トークンを抽出
   * 
   * React Nativeのborder-radius設定を抽出し、
   * 角丸デザインシステムトークンとして管理します。
   * 
   * @param styleSheet 解析対象のStyleSheetオブジェクト
   * @param borderRadius 抽出されたボーダー半径トークンを格納するマップ（変更される）
   */
  private extractBorderRadiusFromStyleSheet(styleSheet: Record<string, any>, borderRadius: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.borderRadius) {
        borderRadius[`radius-${key}`] = String(styles.borderRadius);
      }
    }
  }

  /**
   * デフォルトデザイントークンの生成
   * 
   * 設定ファイルが存在しない場合や抽出に失敗した場合の
   * フォールバック用デフォルトトークンを提供します。
   * TailwindCSSの標準ブレークポイントを含む基本的な構造を提供し、
   * システムの安定動作を保証します。
   * 
   * 提供される内容:
   * - 空のカラーパレット（後で追加可能）
   * - 空のスペーシングシステム（後で追加可能）
   * - 空のタイポグラフィ設定（後で追加可能）
   * - TailwindCSS標準ブレークポイント（sm, md, lg, xl, 2xl）
   * - 空のシャドウ・ボーダー半径設定（後で追加可能）
   * - カスタムトークン領域（プロジェクト固有の拡張用）
   * 
   * @returns 基本構造を持つデフォルトデザイントークン
   */
  private getDefaultTokens(): DesignTokens {
    return {
      colors: {},                           // 空のカラーパレット
      spacing: {},                          // 空のスペーシングシステム
      typography: {                         // 空のタイポグラフィ設定
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      },
      breakpoints: {                        // TailwindCSS標準ブレークポイント
        sm: '640px',                        // スマートフォン（小）
        md: '768px',                        // タブレット
        lg: '1024px',                       // デスクトップ（小）
        xl: '1280px',                       // デスクトップ（大）
        '2xl': '1536px',                    // 大型ディスプレイ
      },
      shadows: {},                          // 空のシャドウ設定
      borderRadius: {},                     // 空のボーダー半径設定
      custom: {},                           // カスタムトークン領域
    };
  }
}