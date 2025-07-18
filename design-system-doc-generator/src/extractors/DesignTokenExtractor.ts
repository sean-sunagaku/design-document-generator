import * as fs from 'fs';
import * as path from 'path';
import { DesignTokens, ColorToken, TypographyTokens } from '../types';

export class DesignTokenExtractor {
  async extractFromTailwindConfig(configPath: string): Promise<DesignTokens> {
    try {
      // Check if config exists
      const exists = await fs.promises.access(configPath).then(() => true).catch(() => false);
      if (!exists) {
        return this.getDefaultTokens();
      }

      // Clear require cache to get fresh config
      delete require.cache[require.resolve(path.resolve(configPath))];
      
      // Load the config
      const config = require(path.resolve(configPath));
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