import { Platform, StyleSystem } from '../types';

export interface ConversionResult {
  success: boolean;
  converted?: any;
  styles?: Record<string, any>;
  classes?: string[];
  warnings: ConversionWarning[];
  unmappedProperties?: string[];
}

export interface ConversionWarning {
  type: 'unsupported' | 'approximation' | 'manual_review';
  message: string;
  originalValue: string;
  convertedValue?: string;
}

export interface TailwindMapping {
  property: string;
  value: any;
  responsive?: boolean;
  darkMode?: boolean;
}

export class StyleConverter {
  private tailwindToStyleSheetMap: Map<string, TailwindMapping>;
  private styleSheetToTailwindMap: Map<string, Map<any, string>>;

  constructor() {
    this.initializeMappings();
  }

  // Tailwind CSS → React Native StyleSheet変換
  tailwindToStyleSheet(tailwindClasses: string[]): ConversionResult {
    const styles: Record<string, any> = {};
    const warnings: ConversionWarning[] = [];
    const unmappedProperties: string[] = [];

    tailwindClasses.forEach(className => {
      const result = this.convertTailwindClass(className);
      
      if (result.success) {
        Object.assign(styles, result.styles);
        warnings.push(...result.warnings);
      } else {
        unmappedProperties.push(className);
        warnings.push({
          type: 'unsupported',
          message: `Tailwind class '${className}' cannot be converted to React Native StyleSheet`,
          originalValue: className
        });
      }
    });

    return {
      success: unmappedProperties.length === 0,
      converted: { container: styles },
      warnings,
      unmappedProperties
    };
  }

  // React Native StyleSheet → Tailwind CSS変換
  styleSheetToTailwind(styleSheet: Record<string, any>): ConversionResult {
    const classes: string[] = [];
    const warnings: ConversionWarning[] = [];
    const unmappedProperties: string[] = [];

    Object.entries(styleSheet).forEach(([property, value]) => {
      const result = this.convertStyleProperty(property, value);
      
      if (result.success && result.tailwindClass) {
        classes.push(result.tailwindClass);
        warnings.push(...result.warnings);
      } else {
        unmappedProperties.push(`${property}: ${value}`);
        warnings.push({
          type: 'unsupported',
          message: `StyleSheet property '${property}: ${value}' cannot be converted to Tailwind CSS`,
          originalValue: `${property}: ${value}`
        });
      }
    });

    return {
      success: unmappedProperties.length === 0,
      converted: classes,
      warnings,
      unmappedProperties
    };
  }

  // プラットフォーム間スタイル互換性チェック
  checkCrossPlatformCompatibility(
    styles: any,
    sourcePlatform: Platform,
    targetPlatform: Platform
  ): {
    compatible: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (sourcePlatform === 'web' && targetPlatform === 'react-native') {
      issues.push(...this.checkWebToReactNativeIssues(styles));
      suggestions.push(...this.getWebToReactNativeSuggestions());
    } else if (sourcePlatform === 'react-native' && targetPlatform === 'web') {
      issues.push(...this.checkReactNativeToWebIssues(styles));
      suggestions.push(...this.getReactNativeToWebSuggestions());
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions
    };
  }

  private convertTailwindClass(className: string): {
    success: boolean;
    styles: Record<string, any>;
    warnings: ConversionWarning[];
  } {
    const warnings: ConversionWarning[] = [];
    
    // レスポンシブプレフィックスを処理
    if (className.match(/^(sm:|md:|lg:|xl:|2xl:)/)) {
      warnings.push({
        type: 'manual_review',
        message: 'Responsive breakpoints need manual implementation in React Native',
        originalValue: className
      });
      return { success: false, styles: {}, warnings };
    }

    // ダークモードプレフィックスを処理
    if (className.startsWith('dark:')) {
      warnings.push({
        type: 'manual_review',
        message: 'Dark mode styling needs manual implementation in React Native',
        originalValue: className
      });
      return { success: false, styles: {}, warnings };
    }

    const mapping = this.tailwindToStyleSheetMap.get(className);
    if (mapping) {
      return {
        success: true,
        styles: { [mapping.property]: mapping.value },
        warnings
      };
    }

    // 動的クラス（値付き）の処理
    const dynamicResult = this.convertDynamicTailwindClass(className);
    if (dynamicResult.success) {
      return { ...dynamicResult, warnings };
    }

    return { success: false, styles: {}, warnings };
  }

  private convertDynamicTailwindClass(className: string): {
    success: boolean;
    styles: Record<string, any>;
  } {
    // パディング: p-[値], px-[値], py-[値], pt-[値], pb-[値], pl-[値], pr-[値]
    const paddingMatch = className.match(/^p([xytblr]?)-(\d+)$/);
    if (paddingMatch) {
      const [, direction, value] = paddingMatch;
      const pixelValue = parseInt(value) * 4; // Tailwindの1単位 = 4px
      return this.createPaddingStyle(direction, pixelValue);
    }

    // マージン: m-[値], mx-[値], my-[値], mt-[値], mb-[値], ml-[値], mr-[値]
    const marginMatch = className.match(/^m([xytblr]?)-(\d+)$/);
    if (marginMatch) {
      const [, direction, value] = marginMatch;
      const pixelValue = parseInt(value) * 4;
      return this.createMarginStyle(direction, pixelValue);
    }

    // 幅: w-[値]
    const widthMatch = className.match(/^w-(\d+|full|screen|auto)$/);
    if (widthMatch) {
      const value = this.convertSizeValue(widthMatch[1]);
      return { success: true, styles: { width: value } };
    }

    // 高さ: h-[値]
    const heightMatch = className.match(/^h-(\d+|full|screen|auto)$/);
    if (heightMatch) {
      const value = this.convertSizeValue(heightMatch[1]);
      return { success: true, styles: { height: value } };
    }

    // 色系: bg-[色]-[濃度], text-[色]-[濃度]
    const colorMatch = className.match(/^(bg|text|border)-(\w+)-(\d+)$/);
    if (colorMatch) {
      const [, type, color, shade] = colorMatch;
      const colorValue = this.getColorValue(color, shade);
      if (colorValue) {
        const property = type === 'bg' ? 'backgroundColor' : 
                        type === 'text' ? 'color' : 'borderColor';
        return { success: true, styles: { [property]: colorValue } };
      }
    }

    return { success: false, styles: {} };
  }

  private convertStyleProperty(property: string, value: any): {
    success: boolean;
    tailwindClass?: string;
    warnings: ConversionWarning[];
  } {
    const warnings: ConversionWarning[] = [];
    const propertyMap = this.styleSheetToTailwindMap.get(property);
    
    if (propertyMap && propertyMap.has(String(value))) {
      return {
        success: true,
        tailwindClass: propertyMap.get(String(value)),
        warnings
      };
    }

    // 数値ベースの動的変換
    if (typeof value === 'number') {
      const dynamicClass = this.convertNumericProperty(property, value);
      if (dynamicClass) {
        if (dynamicClass.includes('approximate')) {
          warnings.push({
            type: 'approximation',
            message: `Approximate conversion for ${property}: ${value}`,
            originalValue: `${property}: ${value}`,
            convertedValue: dynamicClass.replace('-approximate', '')
          });
        }
        return {
          success: true,
          tailwindClass: dynamicClass.replace('-approximate', ''),
          warnings
        };
      }
    }

    return { success: false, warnings };
  }

  private createPaddingStyle(direction: string, value: number): {
    success: boolean;
    styles: Record<string, any>;
  } {
    const styles: Record<string, any> = {};
    
    switch (direction) {
      case '':
        styles.padding = value;
        break;
      case 'x':
        styles.paddingHorizontal = value;
        break;
      case 'y':
        styles.paddingVertical = value;
        break;
      case 't':
        styles.paddingTop = value;
        break;
      case 'b':
        styles.paddingBottom = value;
        break;
      case 'l':
        styles.paddingLeft = value;
        break;
      case 'r':
        styles.paddingRight = value;
        break;
      default:
        return { success: false, styles: {} };
    }

    return { success: true, styles };
  }

  private createMarginStyle(direction: string, value: number): {
    success: boolean;
    styles: Record<string, any>;
  } {
    const styles: Record<string, any> = {};
    
    switch (direction) {
      case '':
        styles.margin = value;
        break;
      case 'x':
        styles.marginHorizontal = value;
        break;
      case 'y':
        styles.marginVertical = value;
        break;
      case 't':
        styles.marginTop = value;
        break;
      case 'b':
        styles.marginBottom = value;
        break;
      case 'l':
        styles.marginLeft = value;
        break;
      case 'r':
        styles.marginRight = value;
        break;
      default:
        return { success: false, styles: {} };
    }

    return { success: true, styles };
  }

  private convertSizeValue(value: string): number | string {
    if (value === 'full') return '100%';
    if (value === 'auto') return 'auto';
    if (value === 'screen') return '100vh'; // React Nativeでは適用不可の警告が必要
    
    const numValue = parseInt(value);
    return numValue * 4; // Tailwindの1単位 = 4px
  }

  private getColorValue(color: string, shade: string): string | null {
    const colorMap: Record<string, Record<string, string>> = {
      blue: {
        '50': '#EFF6FF',
        '100': '#DBEAFE',
        '200': '#BFDBFE',
        '300': '#93C5FD',
        '400': '#60A5FA',
        '500': '#3B82F6',
        '600': '#2563EB',
        '700': '#1D4ED8',
        '800': '#1E40AF',
        '900': '#1E3A8A'
      },
      red: {
        '50': '#FEF2F2',
        '100': '#FEE2E2',
        '200': '#FECACA',
        '300': '#FCA5A5',
        '400': '#F87171',
        '500': '#EF4444',
        '600': '#DC2626',
        '700': '#B91C1C',
        '800': '#991B1B',
        '900': '#7F1D1D'
      },
      green: {
        '50': '#F0FDF4',
        '100': '#DCFCE7',
        '200': '#BBF7D0',
        '300': '#86EFAC',
        '400': '#4ADE80',
        '500': '#22C55E',
        '600': '#16A34A',
        '700': '#15803D',
        '800': '#166534',
        '900': '#14532D'
      },
      gray: {
        '50': '#F9FAFB',
        '100': '#F3F4F6',
        '200': '#E5E7EB',
        '300': '#D1D5DB',
        '400': '#9CA3AF',
        '500': '#6B7280',
        '600': '#4B5563',
        '700': '#374151',
        '800': '#1F2937',
        '900': '#111827'
      }
    };

    return colorMap[color]?.[shade] || null;
  }

  private convertNumericProperty(property: string, value: number): string | null {
    // パディング/マージンの数値変換
    if (['padding', 'margin'].includes(property)) {
      const tailwindValue = Math.round(value / 4);
      const prefix = property === 'padding' ? 'p' : 'm';
      return `${prefix}-${tailwindValue}`;
    }

    // 個別のパディング/マージン
    const paddingMarginMap: Record<string, string> = {
      paddingTop: 'pt',
      paddingBottom: 'pb',
      paddingLeft: 'pl',
      paddingRight: 'pr',
      paddingHorizontal: 'px',
      paddingVertical: 'py',
      marginTop: 'mt',
      marginBottom: 'mb',
      marginLeft: 'ml',
      marginRight: 'mr',
      marginHorizontal: 'mx',
      marginVertical: 'my'
    };

    if (paddingMarginMap[property]) {
      const tailwindValue = Math.round(value / 4);
      return `${paddingMarginMap[property]}-${tailwindValue}`;
    }

    // フォントサイズ
    if (property === 'fontSize') {
      const sizeMap: Record<number, string> = {
        12: 'text-xs',
        14: 'text-sm',
        16: 'text-base',
        18: 'text-lg',
        20: 'text-xl',
        24: 'text-2xl',
        30: 'text-3xl',
        36: 'text-4xl'
      };
      return sizeMap[value] || `text-[${value}px]-approximate`;
    }

    return null;
  }

  private checkWebToReactNativeIssues(styles: any): string[] {
    const issues: string[] = [];
    const unsupportedProperties = [
      'box-shadow', 'text-shadow', 'cursor', 'user-select',
      'float', 'position: fixed', 'position: sticky',
      'backdrop-filter', 'clip-path'
    ];

    if (typeof styles === 'string') {
      unsupportedProperties.forEach(prop => {
        if (styles.includes(prop)) {
          issues.push(`CSS property '${prop}' is not supported in React Native`);
        }
      });
    }

    return issues;
  }

  private checkReactNativeToWebIssues(styles: any): string[] {
    const issues: string[] = [];
    
    if (typeof styles === 'object') {
      // React Native固有のプロパティ
      const rnSpecificProps = [
        'paddingHorizontal', 'paddingVertical',
        'marginHorizontal', 'marginVertical',
        'shadowOpacity', 'shadowRadius', 'elevation'
      ];

      rnSpecificProps.forEach(prop => {
        if (styles[prop] !== undefined) {
          issues.push(`React Native property '${prop}' needs manual conversion for web`);
        }
      });
    }

    return issues;
  }

  private getWebToReactNativeSuggestions(): string[] {
    return [
      'Replace box-shadow with shadowColor, shadowOffset, shadowOpacity, shadowRadius',
      'Use conditional styling with Platform.OS for platform-specific styles',
      'Consider using react-native-super-grid for grid layouts',
      'Implement hover effects using touch events'
    ];
  }

  private getReactNativeToWebSuggestions(): string[] {
    return [
      'Replace paddingHorizontal/paddingVertical with padding-left/right or padding-top/bottom',
      'Convert shadowColor/shadowOffset to box-shadow',
      'Use CSS media queries instead of Dimensions API',
      'Replace TouchableOpacity with button or div with hover effects'
    ];
  }

  private initializeMappings(): void {
    // Tailwind → StyleSheet マッピング
    this.tailwindToStyleSheetMap = new Map([
      // レイアウト
      ['flex', { property: 'display', value: 'flex' }],
      ['flex-1', { property: 'flex', value: 1 }],
      ['items-center', { property: 'alignItems', value: 'center' }],
      ['items-start', { property: 'alignItems', value: 'flex-start' }],
      ['items-end', { property: 'alignItems', value: 'flex-end' }],
      ['justify-center', { property: 'justifyContent', value: 'center' }],
      ['justify-start', { property: 'justifyContent', value: 'flex-start' }],
      ['justify-end', { property: 'justifyContent', value: 'flex-end' }],
      ['justify-between', { property: 'justifyContent', value: 'space-between' }],

      // スペーシング
      ['p-0', { property: 'padding', value: 0 }],
      ['p-1', { property: 'padding', value: 4 }],
      ['p-2', { property: 'padding', value: 8 }],
      ['p-3', { property: 'padding', value: 12 }],
      ['p-4', { property: 'padding', value: 16 }],
      ['p-5', { property: 'padding', value: 20 }],
      ['p-6', { property: 'padding', value: 24 }],

      // 色
      ['bg-white', { property: 'backgroundColor', value: '#FFFFFF' }],
      ['bg-black', { property: 'backgroundColor', value: '#000000' }],
      ['bg-blue-500', { property: 'backgroundColor', value: '#3B82F6' }],
      ['text-white', { property: 'color', value: '#FFFFFF' }],
      ['text-black', { property: 'color', value: '#000000' }],
      ['text-blue-500', { property: 'color', value: '#3B82F6' }],

      // ボーダー
      ['rounded', { property: 'borderRadius', value: 4 }],
      ['rounded-lg', { property: 'borderRadius', value: 8 }],
      ['rounded-xl', { property: 'borderRadius', value: 12 }],
      ['border', { property: 'borderWidth', value: 1 }],

      // テキスト
      ['text-center', { property: 'textAlign', value: 'center' }],
      ['text-left', { property: 'textAlign', value: 'left' }],
      ['text-right', { property: 'textAlign', value: 'right' }],
      ['font-bold', { property: 'fontWeight', value: 'bold' }],
      ['font-normal', { property: 'fontWeight', value: 'normal' }]
    ]);

    // StyleSheet → Tailwind マッピング
    this.styleSheetToTailwindMap = new Map([
      ['display', new Map([['flex', 'flex']])],
      ['flex', new Map([['1', 'flex-1']])],
      ['alignItems', new Map([
        ['center', 'items-center'],
        ['flex-start', 'items-start'],
        ['flex-end', 'items-end']
      ])],
      ['justifyContent', new Map([
        ['center', 'justify-center'],
        ['flex-start', 'justify-start'],
        ['flex-end', 'justify-end'],
        ['space-between', 'justify-between']
      ])],
      ['padding', new Map([
        ['0', 'p-0'], ['4', 'p-1'], ['8', 'p-2'], 
        ['12', 'p-3'], ['16', 'p-4'], ['20', 'p-5'], ['24', 'p-6']
      ])],
      ['backgroundColor', new Map([
        ['#FFFFFF', 'bg-white'],
        ['#000000', 'bg-black'],
        ['#3B82F6', 'bg-blue-500']
      ])],
      ['color', new Map([
        ['#FFFFFF', 'text-white'],
        ['#000000', 'text-black'],
        ['#3B82F6', 'text-blue-500']
      ])],
      ['borderRadius', new Map([
        ['4', 'rounded'], ['8', 'rounded-lg'], ['12', 'rounded-xl']
      ])],
      ['textAlign', new Map([
        ['center', 'text-center'],
        ['left', 'text-left'],
        ['right', 'text-right']
      ])],
      ['fontWeight', new Map([
        ['bold', 'font-bold'],
        ['normal', 'font-normal']
      ])]
    ]);
  }
}