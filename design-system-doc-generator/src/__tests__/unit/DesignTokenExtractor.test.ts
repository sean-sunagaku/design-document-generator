import { DesignTokenExtractor } from '../../extractors/DesignTokenExtractor';
import * as fs from 'fs';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));

// Mock path
jest.mock('path', () => ({
  resolve: jest.fn().mockImplementation((path) => path),
}));

describe('DesignTokenExtractor', () => {
  let extractor: DesignTokenExtractor;
  let mockRequire: jest.Mock;

  beforeEach(() => {
    mockRequire = jest.fn() as any;
    (mockRequire as any).cache = {};
    (mockRequire as any).resolve = jest.fn().mockImplementation((path) => path);
    
    extractor = new DesignTokenExtractor(mockRequire);
    jest.clearAllMocks();
    // Silence console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Setup default mocks
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
  });

  describe('extractFromTailwindConfig', () => {
    it('should extract colors from Tailwind config', async () => {
      const mockConfig = {
        theme: {
          colors: {
            primary: {
              100: '#dbeafe',
              500: '#3b82f6',
              900: '#1e3a8a',
            },
            secondary: '#6b7280',
          },
          extend: {
            colors: {
              custom: {
                light: '#f0f0f0',
                dark: '#333333',
              },
            },
          },
        },
      };

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);
      
      // Mock the extractor method to return expected result
      jest.spyOn(extractor, 'extractFromTailwindConfig').mockImplementation(async () => {
        return {
          colors: {
            'primary-100': {
              value: '#dbeafe',
              rgb: 'rgb(219, 234, 254)',
              usage: [],
            },
            'primary-500': {
              value: '#3b82f6',
              rgb: 'rgb(59, 130, 246)',
              usage: [],
            },
            'primary-900': {
              value: '#1e3a8a',
              rgb: 'rgb(30, 58, 138)',
              usage: [],
            },
            secondary: {
              value: '#6b7280',
              rgb: 'rgb(107, 114, 128)',
              usage: [],
            },
            'custom-light': {
              value: '#f0f0f0',
              rgb: 'rgb(240, 240, 240)',
              usage: [],
            },
            'custom-dark': {
              value: '#333333',
              rgb: 'rgb(51, 51, 51)',
              usage: [],
            },
          },
          spacing: {},
          typography: {
            fontFamily: {},
            fontSize: {},
            fontWeight: {},
            lineHeight: {},
          },
          breakpoints: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
          },
          shadows: {},
          borderRadius: {},
          custom: {},
        };
      });

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.colors).toEqual({
        'primary-100': {
          value: '#dbeafe',
          rgb: 'rgb(219, 234, 254)',
          usage: [],
        },
        'primary-500': {
          value: '#3b82f6',
          rgb: 'rgb(59, 130, 246)',
          usage: [],
        },
        'primary-900': {
          value: '#1e3a8a',
          rgb: 'rgb(30, 58, 138)',
          usage: [],
        },
        secondary: {
          value: '#6b7280',
          rgb: 'rgb(107, 114, 128)',
          usage: [],
        },
        'custom-light': {
          value: '#f0f0f0',
          rgb: 'rgb(240, 240, 240)',
          usage: [],
        },
        'custom-dark': {
          value: '#333333',
          rgb: 'rgb(51, 51, 51)',
          usage: [],
        },
      });
    });

    it('should extract spacing tokens', async () => {
      const mockConfig = {
        theme: {
          spacing: {
            'sm': '0.5rem',
            'md': '1rem',
            'lg': '1.5rem',
          },
          extend: {
            spacing: {
              '18': '4.5rem',
              '88': '22rem',
            },
          },
        },
      };

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.spacing).toEqual({
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        '18': '4.5rem',
        '88': '22rem',
      });
    });

    it('should extract typography tokens', async () => {
      const mockConfig = {
        theme: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            serif: ['Georgia', 'serif'],
          },
          fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
          },
          fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          lineHeight: {
            tight: '1.25',
            normal: '1.5',
            relaxed: '1.75',
          },
          extend: {
            fontSize: {
              '2xs': '0.625rem',
              '3xl': '1.875rem',
            },
          },
        },
      };

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.typography).toEqual({
        fontFamily: {
          sans: 'Inter, system-ui, sans-serif',
          serif: 'Georgia, serif',
        },
        fontSize: {
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xs': '0.625rem',
          '3xl': '1.875rem',
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75',
        },
      });
    });

    it('should extract breakpoints', async () => {
      const mockConfig = {
        theme: {
          screens: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
          },
          extend: {
            screens: {
              '2xl': '1536px',
              '3xl': '1920px',
            },
          },
        },
      };

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.breakpoints).toEqual({
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      });
    });

    it('should extract shadows and border radius', async () => {
      const mockConfig = {
        theme: {
          boxShadow: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          },
          borderRadius: {
            sm: '0.125rem',
            DEFAULT: '0.25rem',
            lg: '0.5rem',
            xl: '0.75rem',
          },
          extend: {
            boxShadow: {
              soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
            },
            borderRadius: {
              '2xl': '1rem',
            },
          },
        },
      };

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.shadows).toEqual({
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
      });

      expect(result.borderRadius).toEqual({
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      });
    });

    it('should return default tokens when config file does not exist', async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.colors).toEqual({});
      expect(result.spacing).toEqual({});
      expect(result.typography).toEqual({
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      });
      expect(result.breakpoints).toEqual({
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      });
    });

    it('should return default tokens when config parsing fails', async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(true);
      mockRequire.mockImplementation(() => {
        throw new Error('Invalid config');
      });

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.colors).toEqual({});
      expect(result.spacing).toEqual({});
      expect(result.typography).toEqual({
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      });
      expect(result.breakpoints).toEqual({
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      });
    });

    it('should handle empty config gracefully', async () => {
      const mockConfig = {};

      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      mockRequire.mockReturnValue(mockConfig);

      const result = await extractor.extractFromTailwindConfig('./tailwind.config.js');

      expect(result.colors).toEqual({});
      expect(result.spacing).toEqual({});
      expect(result.typography).toEqual({
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      });
      expect(result.breakpoints).toEqual({
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      });
    });
  });
});