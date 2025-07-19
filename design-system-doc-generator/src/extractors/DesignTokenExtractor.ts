import * as fs from 'fs';
import * as path from 'path';
import { DesignTokens, ColorToken, TypographyTokens, ExtractedComponent } from '../types';

export class DesignTokenExtractor {
  private requireFn: any;

  constructor(requireFn: any = require) {
    this.requireFn = requireFn;
  }

  async extractFromTailwindConfig(configPath: string): Promise<DesignTokens> {
    try {
      // Check if config exists
      const exists = await fs.promises.access(configPath).then(() => true).catch(() => false);
      if (!exists) {
        return this.getDefaultTokens();
      }

      // Clear require cache to get fresh config
      delete this.requireFn.cache[this.requireFn.resolve(path.resolve(configPath))];
      
      // Load the config
      const config = this.requireFn(path.resolve(configPath));
      const theme = config.theme || {};
      const extend = theme.extend || {};

      const tokens: DesignTokens = {
        colors: this.extractColors(theme.colors, extend.colors),
        spacing: this.extractSpacing(theme.spacing, extend.spacing),
        typography: this.extractTypography(theme, extend),
        breakpoints: this.extractBreakpoints(theme.screens, extend.screens),
        shadows: this.extractShadows(theme.boxShadow, extend.boxShadow),
        borderRadius: this.extractBorderRadius(theme.borderRadius, extend.borderRadius),
        custom: {},
      };

      return tokens;
    } catch (error) {
      console.warn(`Failed to extract from Tailwind config: ${error}`);
      return this.getDefaultTokens();
    }
  }

  private extractColors(themeColors: any = {}, extendColors: any = {}): Record<string, ColorToken> {
    const colors: Record<string, ColorToken> = {};
    
    // Merge theme and extend colors
    const allColors = { ...themeColors, ...extendColors };
    
    const extractColorValue = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'DEFAULT') continue;
        
        const fullKey = prefix ? `${prefix}-${key}` : key;
        
        if (typeof value === 'string') {
          colors[fullKey] = {
            value,
            rgb: this.hexToRgb(value),
            usage: [],
          };
        } else if (typeof value === 'object' && value !== null) {
          extractColorValue(value, fullKey);
        }
      }
    };

    extractColorValue(allColors);
    return colors;
  }

  private extractSpacing(themeSpacing: any = {}, extendSpacing: any = {}): Record<string, string> {
    const spacing: Record<string, string> = {};
    const allSpacing = { ...themeSpacing, ...extendSpacing };
    
    for (const [key, value] of Object.entries(allSpacing)) {
      if (typeof value === 'string' || typeof value === 'number') {
        spacing[key] = String(value);
      }
    }
    
    return spacing;
  }

  private extractTypography(theme: any, extend: any): TypographyTokens {
    return {
      fontFamily: this.extractFontFamily(theme.fontFamily, extend.fontFamily),
      fontSize: this.extractFontSize(theme.fontSize, extend.fontSize),
      fontWeight: this.extractFontWeight(theme.fontWeight, extend.fontWeight),
      lineHeight: this.extractLineHeight(theme.lineHeight, extend.lineHeight),
    };
  }

  private extractFontFamily(themeFonts: any = {}, extendFonts: any = {}): Record<string, string> {
    const fonts: Record<string, string> = {};
    const allFonts = { ...themeFonts, ...extendFonts };
    
    for (const [key, value] of Object.entries(allFonts)) {
      if (Array.isArray(value)) {
        fonts[key] = value.join(', ');
      } else if (typeof value === 'string') {
        fonts[key] = value;
      }
    }
    
    return fonts;
  }

  private extractFontSize(themeSizes: any = {}, extendSizes: any = {}): Record<string, string> {
    const sizes: Record<string, string> = {};
    const allSizes = { ...themeSizes, ...extendSizes };
    
    for (const [key, value] of Object.entries(allSizes)) {
      if (typeof value === 'string') {
        sizes[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        sizes[key] = value[0];
      }
    }
    
    return sizes;
  }

  private extractFontWeight(themeWeights: any = {}, extendWeights: any = {}): Record<string, string> {
    const weights: Record<string, string> = {};
    const allWeights = { ...themeWeights, ...extendWeights };
    
    for (const [key, value] of Object.entries(allWeights)) {
      weights[key] = String(value);
    }
    
    return weights;
  }

  private extractLineHeight(themeHeights: any = {}, extendHeights: any = {}): Record<string, string> {
    const heights: Record<string, string> = {};
    const allHeights = { ...themeHeights, ...extendHeights };
    
    for (const [key, value] of Object.entries(allHeights)) {
      heights[key] = String(value);
    }
    
    return heights;
  }

  private extractBreakpoints(themeScreens: any = {}, extendScreens: any = {}): Record<string, string> {
    const breakpoints: Record<string, string> = {};
    const allScreens = { ...themeScreens, ...extendScreens };
    
    for (const [key, value] of Object.entries(allScreens)) {
      if (typeof value === 'string') {
        breakpoints[key] = value;
      } else if (typeof value === 'object' && value !== null && 'min' in value) {
        breakpoints[key] = (value as any).min;
      }
    }
    
    return breakpoints;
  }

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

  private hexToRgb(hex: string): string | undefined {
    if (!hex || !hex.startsWith('#')) return undefined;
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return undefined;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  async extractFromStyleSheet(components: ExtractedComponent[]): Promise<DesignTokens> {
    const tokens: DesignTokens = this.getDefaultTokens();
    
    // StyleSheetコンポーネントからデザイントークンを抽出
    for (const component of components) {
      if ((component as any).styles?.styleSheet) {
        const styleSheet = (component as any).styles.styleSheet;
        
        // 色の抽出
        this.extractColorsFromStyleSheet(styleSheet, tokens.colors);
        
        // スペーシングの抽出
        this.extractSpacingFromStyleSheet(styleSheet, tokens.spacing);
        
        // タイポグラフィの抽出
        this.extractTypographyFromStyleSheet(styleSheet, tokens.typography);
        
        // シャドウの抽出
        this.extractShadowsFromStyleSheet(styleSheet, tokens.shadows);
        
        // ボーダーラジアスの抽出
        this.extractBorderRadiusFromStyleSheet(styleSheet, tokens.borderRadius);
      }
    }
    
    return tokens;
  }

  private extractColorsFromStyleSheet(styleSheet: Record<string, any>, colors: Record<string, ColorToken>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.backgroundColor) {
        const colorKey = `background-${key}`;
        colors[colorKey] = {
          value: styles.backgroundColor,
          rgb: this.hexToRgb(styles.backgroundColor) || styles.backgroundColor,
          usage: [key]
        };
      }
      if (styles.color) {
        const colorKey = `text-${key}`;
        colors[colorKey] = {
          value: styles.color,
          rgb: this.hexToRgb(styles.color) || styles.color,
          usage: [key]
        };
      }
    }
  }

  private extractSpacingFromStyleSheet(styleSheet: Record<string, any>, spacing: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      ['padding', 'paddingHorizontal', 'paddingVertical', 'margin', 'marginHorizontal', 'marginVertical'].forEach(prop => {
        if (styles[prop] !== undefined) {
          spacing[`${prop}-${key}`] = String(styles[prop]);
        }
      });
    }
  }

  private extractTypographyFromStyleSheet(styleSheet: Record<string, any>, typography: TypographyTokens): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.fontSize) {
        typography.fontSize[`size-${key}`] = String(styles.fontSize);
      }
      if (styles.fontWeight) {
        typography.fontWeight[`weight-${key}`] = String(styles.fontWeight);
      }
      if (styles.fontFamily) {
        typography.fontFamily[`family-${key}`] = styles.fontFamily;
      }
      if (styles.lineHeight) {
        typography.lineHeight[`height-${key}`] = String(styles.lineHeight);
      }
    }
  }

  private extractShadowsFromStyleSheet(styleSheet: Record<string, any>, shadows: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.shadowColor || styles.elevation) {
        const shadowKey = `shadow-${key}`;
        if (styles.shadowColor) {
          // iOS shadow
          shadows[shadowKey] = `${styles.shadowOffset?.width || 0}px ${styles.shadowOffset?.height || 0}px ${styles.shadowRadius || 0}px ${styles.shadowColor}`;
        } else if (styles.elevation) {
          // Android elevation
          shadows[shadowKey] = `elevation-${styles.elevation}`;
        }
      }
    }
  }

  private extractBorderRadiusFromStyleSheet(styleSheet: Record<string, any>, borderRadius: Record<string, string>): void {
    for (const [key, styles] of Object.entries(styleSheet)) {
      if (styles.borderRadius) {
        borderRadius[`radius-${key}`] = String(styles.borderRadius);
      }
    }
  }

  private getDefaultTokens(): DesignTokens {
    return {
      colors: {},
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
  }
}