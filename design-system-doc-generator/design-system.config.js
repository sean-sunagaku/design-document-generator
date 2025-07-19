// Design System Documentation Generator Configuration
module.exports = {
  // プラットフォーム設定
  platform: 'web', // 'web' | 'react-native' | 'flutter' | 'vue' | 'angular'
  
  // スタイルシステム設定
  styleSystem: 'tailwind', // 'tailwind' | 'stylesheet' | 'styled-components' | 'emotion' | 'css-modules'
  
  // ソースコード設定
  source: {
    dir: 'src',
    include: ['**/*.{tsx,ts,jsx,js}'],
    exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
    tsConfigPath: './tsconfig.json'
  },
  
  // 出力設定
  output: {
    dir: 'docs',
    format: 'markdown', // 'markdown' | 'json' | 'html'
    filename: 'design-system.md'
  },
  
  // バリデーション設定
  validation: {
    enabled: true,
    rules: {
      syntaxCheck: true,
      styleValidation: true,
      accessibilityCheck: false,
      performanceHints: false
    }
  },
  
  // ドキュメント生成設定
  generation: {
    includeExamples: true,
    includeStyleValidation: true,
    includeAccessibilityInfo: false,
    includeBestPractices: true,
    
    // プラットフォーム固有設定
    platformSpecific: {
      web: {
        includeTailwindValidation: true,
        includeResponsiveInfo: true
      },
      'react-native': {
        includeStyleSheetExamples: true,
        includeNativeImports: true,
        includePlatformSpecificProps: true
      }
    }
  },
  
  // コンポーネント分類設定
  categorization: {
    atoms: ['Button', 'Input', 'Badge', 'Icon'],
    molecules: ['Modal', 'FormField', 'Card'],
    organisms: ['Header', 'ProductList', 'Navigation'],
    templates: ['Layout', 'PageTemplate'],
    pages: ['HomePage', 'ProfilePage']
  },
  
  // 拡張設定（将来の新プラットフォーム対応）
  extensions: {
    // カスタムプラットフォーム設定
    customPlatforms: {},
    
    // カスタムスタイルシステム設定
    customStyleSystems: {},
    
    // カスタムバリデーター設定
    customValidators: {}
  }
};