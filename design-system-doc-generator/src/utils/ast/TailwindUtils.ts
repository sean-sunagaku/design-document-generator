export class TailwindUtils {
  private static readonly TAILWIND_PATTERNS = [
    // Spacing and layout
    /^(p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my)-/,
    /^(w|h|min-w|min-h|max-w|max-h)-/,
    /^(flex|grid|absolute|relative|fixed|sticky)/,
    /^(block|inline|inline-block|inline-flex|table|grid|hidden)$/,
    /^(justify|items|content|self)-/,
    /^(space|gap|col|row)-/,
    /^(inset|top|right|bottom|left)-/,
    
    // Colors and backgrounds
    /^(bg|text|border|ring|shadow|fill|stroke)-/,
    /^(placeholder|caret|accent|decoration)-/,
    
    // Typography
    /^(font|text|leading|tracking|align|decoration|whitespace|break|list)-/,
    
    // Borders and effects
    /^(border|rounded|ring|shadow|outline)-/,
    /^(opacity|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop)-/,
    
    // Animations and transitions
    /^(animate|transition|duration|delay|ease)-/,
    /^(transform|scale|rotate|translate|skew|origin)-/,
    
    // States and responsive
    /^(hover|focus|active|disabled|dark|group-hover|group-focus|peer|visited|target|first|last|odd|even):/,
    /^(sm|md|lg|xl|2xl):/,
    
    // Interactive
    /^(cursor|select|resize|appearance|pointer-events|user-select)-/,
    
    // Layout utilities
    /^(float|clear|object|overflow|overscroll|scroll)-/,
    /^(z)-/,
    
    // Special cases - standalone classes
    /^(flex|grid|table|block|inline|hidden|sr-only|not-sr-only|visible|invisible|static|fixed|absolute|relative|sticky|truncate|antialiased|subpixel-antialiased|italic|not-italic|uppercase|lowercase|capitalize|normal-case|underline|line-through|no-underline|rounded|rounded-full)$/,
  ];

  static isTailwindClass(className: string): boolean {
    // 空文字やスペースのみの場合はfalse
    if (!className || !className.trim()) {
      return false;
    }

    // カスタムクラス（大文字始まり、特定の単語など）を除外
    const customClassPatterns = [
      /^[A-Z]/, // 大文字始まり（コンポーネント名など）
      /^my-/, // my-で始まるカスタムクラス
      /^custom-/, // custom-で始まるカスタムクラス
      /component/i, // componentを含む
      /style$/i, // styleで終わる
    ];

    if (customClassPatterns.some(pattern => pattern.test(className))) {
      return false;
    }

    // 不完全なクラス（末尾がハイフンなど）を除外
    if (className.endsWith('-') || className.endsWith('_')) {
      return false;
    }

    return TailwindUtils.TAILWIND_PATTERNS.some(pattern => pattern.test(className));
  }

  static filterTailwindClasses(classes: string[]): string[] {
    return classes.filter(cls => TailwindUtils.isTailwindClass(cls));
  }

  static categorizeClasses(classes: string[]): {
    layout: string[];
    spacing: string[];
    typography: string[];
    colors: string[];
    borders: string[];
    effects: string[];
    interactivity: string[];
    responsive: string[];
    states: string[];
    animations: string[];
    other: string[];
  } {
    const categories = {
      layout: [] as string[],
      spacing: [] as string[],
      typography: [] as string[],
      colors: [] as string[],
      borders: [] as string[],
      effects: [] as string[],
      interactivity: [] as string[],
      responsive: [] as string[],
      states: [] as string[],
      animations: [] as string[],
      other: [] as string[],
    };

    classes.forEach(cls => {
      if (/^(sm|md|lg|xl|2xl):/.test(cls)) {
        categories.responsive.push(cls);
      } else if (/^(hover|focus|active|disabled|dark|group-hover|peer):/.test(cls)) {
        categories.states.push(cls);
      } else if (/^(animate|transition|duration|ease)-/.test(cls)) {
        categories.animations.push(cls);
      } else if (/^(flex|grid|block|inline|absolute|relative|fixed|sticky|float|clear)/.test(cls)) {
        categories.layout.push(cls);
      } else if (/^(p|m|space|gap|inset|top|right|bottom|left)-/.test(cls)) {
        categories.spacing.push(cls);
      } else if (/^(text|font|leading|tracking|align|decoration)-/.test(cls)) {
        categories.typography.push(cls);
      } else if (/^(bg|text|border|fill|stroke)-/.test(cls) && !cls.includes('width') && !cls.includes('style')) {
        categories.colors.push(cls);
      } else if (/^(border|rounded|ring)-/.test(cls)) {
        categories.borders.push(cls);
      } else if (/^(shadow|blur|brightness|contrast|opacity|backdrop)-/.test(cls)) {
        categories.effects.push(cls);
      } else if (/^(cursor|select|resize|appearance)-/.test(cls)) {
        categories.interactivity.push(cls);
      } else {
        categories.other.push(cls);
      }
    });

    return categories;
  }

  static getBreakpointFromClass(className: string): string | null {
    const match = className.match(/^(sm|md|lg|xl|2xl):/);
    return match ? match[1] : null;
  }

  static getStateFromClass(className: string): string | null {
    const match = className.match(/^(hover|focus|active|disabled|dark|group-hover|peer):/);
    return match ? match[1] : null;
  }

  static removeStateAndBreakpoint(className: string): string {
    return className.replace(/^(sm|md|lg|xl|2xl|hover|focus|active|disabled|dark|group-hover|peer):/, '');
  }

  static hasResponsiveVariants(classes: string[]): boolean {
    return classes.some(cls => /^(sm|md|lg|xl|2xl):/.test(cls));
  }

  static hasDarkModeVariants(classes: string[]): boolean {
    return classes.some(cls => cls.startsWith('dark:'));
  }

  static hasHoverEffects(classes: string[]): boolean {
    return classes.some(cls => cls.startsWith('hover:'));
  }

  static hasAnimations(classes: string[]): boolean {
    return classes.some(cls => 
      cls.startsWith('animate-') || 
      cls.startsWith('transition') ||
      cls.includes('duration-') ||
      cls.includes('ease-')
    );
  }

  static extractColorValues(classes: string[]): string[] {
    const colorClasses = classes.filter(cls => 
      /^(bg|text|border|ring|shadow)-(red|blue|green|yellow|purple|pink|gray|indigo|orange|teal|cyan|emerald|lime|amber|rose|violet|sky|neutral|stone|zinc|slate|warmgray|coolgray|bluegray|truegray)-/.test(cls)
    );
    
    return colorClasses.map(cls => {
      const match = cls.match(/^(bg|text|border|ring|shadow)-(red|blue|green|yellow|purple|pink|gray|indigo|orange|teal|cyan|emerald|lime|amber|rose|violet|sky|neutral|stone|zinc|slate|warmgray|coolgray|bluegray|truegray)-(\d+)$/);
      return match ? `${match[2]}-${match[3]}` : cls;
    });
  }

  static groupSimilarClasses(classes: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    classes.forEach(cls => {
      const baseClass = TailwindUtils.removeStateAndBreakpoint(cls);
      const prefix = baseClass.split('-')[0];
      
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix)!.push(cls);
    });
    
    return groups;
  }

  static sortClasses(classes: string[]): string[] {
    const order = [
      'layout', 'spacing', 'typography', 'colors', 'borders', 
      'effects', 'interactivity', 'responsive', 'states', 'animations'
    ];
    
    const categorized = TailwindUtils.categorizeClasses(classes);
    const sorted: string[] = [];
    
    order.forEach(category => {
      if (categorized[category as keyof typeof categorized]) {
        sorted.push(...categorized[category as keyof typeof categorized].sort());
      }
    });
    
    return sorted;
  }
}