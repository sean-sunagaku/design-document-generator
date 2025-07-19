module.exports = {
  platform: 'react-native',
  styleSystem: 'stylesheet',
  source: {
    dir: 'src',
    include: ['**/*.{tsx,ts,jsx,js}'],
    exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
  },
  output: {
    dir: 'docs',
    format: 'markdown',
    filename: 'design-system.md'
  },
  validation: {
    enabled: true,
    rules: {
      syntaxCheck: true,
      styleValidation: true,
      accessibilityCheck: true,
      performanceHints: true
    }
  },
  generation: {
    includeExamples: true,
    includeStyleValidation: true,
    includeAccessibilityInfo: true,
    includeBestPractices: true,
    platformSpecific: {
      'react-native': {
        includeNativeImports: true,
        includeStyleSheetExamples: true,
        includePlatformSpecific: true
      }
    }
  },
  categorization: {
    atoms: ['**/atoms/**'],
    molecules: ['**/molecules/**'],
    organisms: ['**/organisms/**'],
    templates: ['**/templates/**'],
    pages: ['**/pages/**']
  },
  extensions: {
    customPlatforms: {},
    customStyleSystems: {},
    customValidators: {},
    customGenerators: {}
  }
};