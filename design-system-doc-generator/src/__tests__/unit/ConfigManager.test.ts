import { ConfigManager, DesignSystemConfig } from '../../config/ConfigManager';
import * as fs from 'fs';
import * as path from 'path';

// fsモジュールのモック
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// requireのキャッシュクリア用のモック
jest.mock('path', () => ({
  resolve: jest.fn((p: string) => p),
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    // ConfigManagerのシングルトンインスタンスとconfigを強制リセット
    (ConfigManager as any).instance = undefined;
    configManager = ConfigManager.getInstance();
    (configManager as any).config = undefined; // 内部configもリセット
    
    // requireキャッシュのモック
    delete require.cache;
    require.cache = {};
    
    // Silence console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadConfig', () => {
    it('should load config from JavaScript file', async () => {
      const mockConfig: DesignSystemConfig = {
        platform: 'web',
        styleSystem: 'tailwind',
        source: {
          dir: 'src',
          include: ['**/*.tsx'],
          exclude: []
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
            accessibilityCheck: false,
            performanceHints: false
          }
        },
        generation: {
          includeExamples: true,
          includeStyleValidation: true,
          includeAccessibilityInfo: false,
          includeBestPractices: true,
          platformSpecific: {}
        },
        extensions: {
          customPlatforms: {},
          customStyleSystems: {},
          customValidators: {},
          customGenerators: {}
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      
      // requireのモック
      jest.doMock(path.resolve('design-system.config.js'), () => mockConfig, { virtual: true });
      
      const config = await configManager.loadConfig('design-system.config.js');
      
      expect(config.platform).toBe('web');
      expect(config.styleSystem).toBe('tailwind');
      expect(mockFs.existsSync).toHaveBeenCalledWith('design-system.config.js');
    });

    it('should load config from JSON file', async () => {
      const mockConfig = {
        platform: 'react-native',
        styleSystem: 'stylesheet'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = await configManager.loadConfig('design-system.config.json');

      expect(config.platform).toBe('react-native');
      expect(config.styleSystem).toBe('stylesheet');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('design-system.config.json', 'utf-8');
    });

    it('should load config from package.json designSystem field', async () => {
      const mockPackageJson = {
        name: 'test-project',
        designSystem: {
          platform: 'web',
          styleSystem: 'styled-components'
        }
      };

      // Only package.json should exist
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath === 'package.json';
      });

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        throw new Error(`File not found: ${filePath}`);
      });

      const config = await configManager.loadConfig();

      expect(config.platform).toBe('web');
      expect(config.styleSystem).toBe('styled-components');
    });

    it('should use default config when no config file found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = await configManager.loadConfig();

      expect(config.platform).toBe('web');
      expect(config.styleSystem).toBe('tailwind');
      expect(config.source.dir).toBe('src');
      expect(config.output.format).toBe('markdown');
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = await configManager.loadConfig('design-system.config.json');

      expect(config.platform).toBe('web'); // フォールバックしてデフォルト設定
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load config from design-system.config.json'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getConfig', () => {
    it('should return loaded config', async () => {
      mockFs.existsSync.mockReturnValue(false);
      await configManager.loadConfig();

      const config = configManager.getConfig();
      expect(config.platform).toBe('web');
    });

    it('should throw error when config not loaded', () => {
      expect(() => configManager.getConfig()).toThrow('Config not loaded. Call loadConfig() first.');
    });
  });

  describe('validateAndNormalizeConfig', () => {
    it('should set default platform when missing', async () => {
      const incompleteConfig = {
        styleSystem: 'tailwind'
      } as any;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(incompleteConfig));

      const config = await configManager.loadConfig('test.json');

      expect(config.platform).toBe('web');
    });

    it('should set default styleSystem when missing', async () => {
      const incompleteConfig = {
        platform: 'web'
      } as any;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(incompleteConfig));

      const config = await configManager.loadConfig('test.json');

      expect(config.styleSystem).toBe('tailwind');
    });

    it('should merge platform-specific settings', async () => {
      const configWithPlatformSpecific = {
        platform: 'react-native',
        styleSystem: 'stylesheet',
        generation: {
          includeExamples: true,
          includeStyleValidation: true,
          includeAccessibilityInfo: false,
          includeBestPractices: true,
          platformSpecific: {
            'react-native': {
              includeNativeImports: true,
              includeStyleSheetExamples: true
            }
          }
        }
      } as any;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(configWithPlatformSpecific));

      const config = await configManager.loadConfig('test.json');

      expect(config.generation.includeNativeImports).toBe(true);
      expect(config.generation.includeStyleSheetExamples).toBe(true);
    });
  });

  describe('custom extensions', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(false);
      await configManager.loadConfig();
    });

    it('should register custom platform', () => {
      const customPlatform = {
        name: 'flutter',
        fileExtensions: ['.dart'],
        componentPattern: /class.*extends.*Widget/,
        styleExtractor: './extractors/FlutterExtractor',
        validator: './validators/FlutterValidator',
        generator: './generators/FlutterGenerator'
      };

      configManager.registerCustomPlatform('flutter', customPlatform);

      const config = configManager.getConfig();
      expect(config.extensions.customPlatforms.flutter).toEqual(customPlatform);
    });

    it('should register custom style system', () => {
      const customStyleSystem = {
        name: 'emotion',
        pattern: /css`.*`/,
        extractor: './extractors/EmotionExtractor',
        validator: './validators/EmotionValidator'
      };

      configManager.registerCustomStyleSystem('emotion', customStyleSystem);

      const config = configManager.getConfig();
      expect(config.extensions.customStyleSystems.emotion).toEqual(customStyleSystem);
    });

    it('should register custom validator', () => {
      const customValidator = {
        name: 'accessibility',
        rules: ['alt-text', 'aria-labels'],
        validator: './validators/AccessibilityValidator'
      };

      configManager.registerCustomValidator('accessibility', customValidator);

      const config = configManager.getConfig();
      expect(config.extensions.customValidators.accessibility).toEqual(customValidator);
    });

    it('should identify custom platforms', () => {
      const customPlatform = {
        name: 'flutter',
        fileExtensions: ['.dart'],
        componentPattern: /class.*extends.*Widget/,
        styleExtractor: './extractors/FlutterExtractor',
        validator: './validators/FlutterValidator',
        generator: './generators/FlutterGenerator'
      };

      configManager.registerCustomPlatform('flutter', customPlatform);

      expect(configManager.isCustomPlatform('web')).toBe(false);
      expect(configManager.isCustomPlatform('react-native')).toBe(false);
      expect(configManager.isCustomPlatform('flutter')).toBe(true);
      expect(configManager.isCustomPlatform('nonexistent')).toBe(false);
    });

    it('should identify custom style systems', () => {
      const customStyleSystem = {
        name: 'emotion',
        pattern: /css`.*`/,
        extractor: './extractors/EmotionExtractor',
        validator: './validators/EmotionValidator'
      };

      configManager.registerCustomStyleSystem('emotion', customStyleSystem);

      expect(configManager.isCustomStyleSystem('tailwind')).toBe(false);
      expect(configManager.isCustomStyleSystem('stylesheet')).toBe(false);
      expect(configManager.isCustomStyleSystem('emotion')).toBe(true);
      expect(configManager.isCustomStyleSystem('nonexistent')).toBe(false);
    });
  });

  describe('saveConfig', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(false);
      await configManager.loadConfig();
    });

    it('should save JavaScript config file', async () => {
      (configManager as any).configPath = 'design-system.config.js';

      await configManager.saveConfig();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'design-system.config.js',
        expect.stringContaining('module.exports ='),
        'utf-8'
      );
    });

    it('should save JSON config file', async () => {
      (configManager as any).configPath = 'design-system.config.json';

      await configManager.saveConfig();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'design-system.config.json',
        expect.stringContaining('"platform"'),
        'utf-8'
      );
    });

    it('should throw error when no config to save', async () => {
      const emptyConfigManager = ConfigManager.getInstance();
      (emptyConfigManager as any).config = null;

      await expect(emptyConfigManager.saveConfig()).rejects.toThrow('No config to save');
    });
  });
});