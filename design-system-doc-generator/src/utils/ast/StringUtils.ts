export class StringUtils {
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  static pascalToCamel(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  static camelToPascal(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  static camelToSnake(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static pluralize(str: string): string {
    if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es';
    } else if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('f')) {
      return str.slice(0, -1) + 'ves';
    } else if (str.endsWith('fe')) {
      return str.slice(0, -2) + 'ves';
    } else {
      return str + 's';
    }
  }

  static singularize(str: string): string {
    if (str.endsWith('ies')) {
      return str.slice(0, -3) + 'y';
    } else if (str.endsWith('ves')) {
      return str.slice(0, -3) + 'f';
    } else if (str.endsWith('es')) {
      return str.slice(0, -2);
    } else if (str.endsWith('s')) {
      return str.slice(0, -1);
    } else {
      return str;
    }
  }

  static extractWords(str: string): string[] {
    return str.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0);
  }

  static similarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    // Levenshtein distance
    const matrix = [];
    const len1 = s1.length;
    const len2 = s2.length;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - (distance / maxLen);
  }

  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  static removeExtraSpaces(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }

  static extractInitials(str: string): string {
    return str
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
  }

  static isValidIdentifier(str: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
  }

  static sanitizeIdentifier(str: string): string {
    // Remove invalid characters and ensure it starts with a valid character
    let sanitized = str.replace(/[^a-zA-Z0-9_$]/g, '');
    
    if (!/^[a-zA-Z_$]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    
    return sanitized || '_default';
  }

  static escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static generateSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  static wordCount(str: string): number {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const escaped = StringUtils.escapeRegExp(query);
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    return text.replace(regex, '<mark>$1</mark>');
  }

  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  static parseTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = data[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  static joinWithAnd(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(' and ');
    
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
  }

  static containsJapanese(str: string): boolean {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
  }

  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  static normalizeWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }
}