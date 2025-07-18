export class TailwindClassExtractor {
  private tailwindPatterns: RegExp[];

  constructor() {
    this.tailwindPatterns = [
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
  }

  extractClasses(node: any): string[] {
    const classes = new Set<string>();
    this.processClassNode(node, classes);
    return Array.from(classes).sort();
  }

  private processClassNode(node: any, classes: Set<string>): void {
    // Static string literal
    if (node.type === 'Literal' && typeof node.value === 'string') {
      this.parseClassString(node.value, classes);
    }
    
    // Template literal
    else if (node.type === 'TemplateLiteral') {
      node.quasis.forEach((quasi: any) => {
        this.parseClassString(quasi.value.raw, classes);
      });
    }
    
    // JSX Expression with function call (clsx, cn, classnames, etc.)
    else if (node.type === 'JSXExpressionContainer' && node.expression.type === 'CallExpression') {
      this.extractFromClassUtil(node.expression, classes);
    }
  }

  private extractFromClassUtil(node: any, classes: Set<string>): void {
    const calleeName = this.getCalleeName(node);
    
    if (['clsx', 'classnames', 'cn', 'twMerge'].includes(calleeName)) {
      node.arguments.forEach((arg: any) => {
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          this.parseClassString(arg.value, classes);
        } else if (arg.type === 'ObjectExpression') {
          // Handle object syntax: { 'bg-red-500': isError }
          arg.properties.forEach((prop: any) => {
            if (prop.type === 'Property' && prop.key.type === 'Literal') {
              this.parseClassString(prop.key.value, classes);
            }
          });
        } else if (arg.type === 'ArrayExpression') {
          // Handle array syntax
          arg.elements.forEach((elem: any) => {
            if (elem?.type === 'Literal' && typeof elem.value === 'string') {
              this.parseClassString(elem.value, classes);
            }
          });
        }
      });
    }
  }

  private getCalleeName(node: any): string {
    if (node.callee.type === 'Identifier') {
      return node.callee.name;
    } else if (node.callee.type === 'MemberExpression' && 
               node.callee.property.type === 'Identifier') {
      return node.callee.property.name;
    }
    return '';
  }

  private parseClassString(classString: string, classes: Set<string>): void {
    const classList = classString.split(/\s+/).filter(Boolean);
    classList.forEach(cls => {
      if (this.isTailwindClass(cls)) {
        classes.add(cls);
      }
    });
  }

  isTailwindClass(className: string): boolean {
    return this.tailwindPatterns.some(pattern => pattern.test(className));
  }
}