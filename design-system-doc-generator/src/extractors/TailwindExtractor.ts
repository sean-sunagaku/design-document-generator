const tsEslint = require('@typescript-eslint/typescript-estree');
const { parseAndGenerateServices } = tsEslint;
import * as fs from 'fs';
import * as path from 'path';
import { ExtractedComponent, ExtractorConfig, PropInfo, JSXElement } from '../types';
import { generateHash } from '../utils/hash';

export class TailwindExtractor {
  private config: ExtractorConfig;
  private tailwindPatterns: RegExp[];

  constructor(config: ExtractorConfig) {
    this.config = config;
    this.tailwindPatterns = [
      /^(bg|text|border|rounded|p|m|w|h|flex|grid|absolute|relative|fixed|sticky)-/,
      /^(hover|focus|active|disabled|dark|group-hover|peer):/,
      /^(sm|md|lg|xl|2xl):/,
      /^(space|gap|col|row)-/,
      /^(animate|transition|duration|ease)-/,
      /^(opacity|z|scale|rotate|translate|skew)-/,
      /^(font|leading|tracking|align|decoration)-/,
      /^(overflow|whitespace|break)-/,
      /^(inset|top|right|bottom|left)-/,
      /^(min|max)-(w|h)-/,
      /^(cursor|select|resize|appearance)-/,
      /^(fill|stroke)-/,
      /^(sr-only|not-sr-only)$/,
      /^(visible|invisible)$/,
      /^(static|fixed|absolute|relative|sticky)$/,
      /^(block|inline-block|inline|flex|inline-flex|table|grid|hidden)$/,
      /^(float|clear|object|overscroll|list)-/,
      /^(ring|shadow|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|backdrop)-/,
    ];
  }

  async extractFromFile(filePath: string): Promise<ExtractedComponent | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Skip non-component files
      if (!this.isComponentFile(content, filePath)) {
        return null;
      }

      const { ast } = parseAndGenerateServices(content, {
        filePath,
        jsx: true,
        loc: true,
        range: true,
      });

      const classes = new Set<string>();
      const props: PropInfo[] = [];
      const dependencies = new Set<string>();
      const componentName = this.extractComponentName(ast, filePath);
      let jsxStructure: JSXElement | undefined;

      if (!componentName) {
        return null;
      }

      this.traverse(ast, {
        onClassName: (className) => this.extractClasses(className, classes),
        onProp: (prop) => props.push(prop),
        onImport: (dep) => dependencies.add(dep),
        onJSXReturn: (element) => {
          if (!jsxStructure) {
            jsxStructure = element;
          }
        },
      });

      return {
        filePath,
        componentName,
        category: this.categorizeComponent(filePath, componentName),
        tailwindClasses: Array.from(classes).sort(),
        props,
        dependencies: Array.from(dependencies),
        hash: generateHash(content),
        jsxStructure,
      };
    } catch (error) {
      console.error(`Failed to extract from ${filePath}:`, error);
      return null;
    }
  }

  private isComponentFile(content: string, filePath: string): boolean {
    // Check if file exports a React component
    const hasJSX = /<[a-zA-Z][a-zA-Z0-9]*/.test(content);
    const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/.test(content);
    const hasExport = /export\s+(default\s+)?(function|const|class)/.test(content);
    
    return hasJSX && hasReactImport && hasExport;
  }

  private extractComponentName(ast: any, filePath: string): string | null {
    let componentName: string | null = null;

    // Look for default export
    for (const node of ast.body) {
      if (node.type === 'ExportDefaultDeclaration') {
        if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
          componentName = node.declaration.id.name;
        } else if (node.declaration.type === 'Identifier') {
          componentName = node.declaration.name;
        }
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
          componentName = node.declaration.id.name;
        } else if (node.declaration.type === 'VariableDeclaration') {
          const firstDeclarator = node.declaration.declarations[0];
          if (firstDeclarator && firstDeclarator.id.type === 'Identifier') {
            componentName = firstDeclarator.id.name;
          }
        }
      }
    }

    // Fallback to filename
    if (!componentName) {
      const basename = path.basename(filePath, path.extname(filePath));
      componentName = basename.replace(/\..*$/, '');
    }

    return componentName;
  }

  private traverse(
    ast: any,
    callbacks: {
      onClassName: (node: any) => void;
      onProp: (prop: PropInfo) => void;
      onImport: (dep: string) => void;
      onJSXReturn?: (element: JSXElement) => void;
    }
  ) {
    let inComponentBody = false;
    
    const visit = (node: any, parent?: any) => {
      if (!node || typeof node !== 'object') return;

      // Extract className props
      if (node.type === 'JSXAttribute' && node.name?.name === 'className') {
        if (node.value) {
          callbacks.onClassName(node.value);
        }
      }

      // Extract props from function components
      if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
        const params = node.params[0];
        if (params && params.type === 'ObjectPattern') {
          params.properties.forEach((prop: any) => {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              callbacks.onProp({
                name: prop.key.name,
                type: 'any', // Would need TypeScript type info for accurate type
                required: !prop.value || prop.value.type !== 'AssignmentPattern',
                defaultValue: prop.value?.type === 'AssignmentPattern' ? 
                  this.getDefaultValue(prop.value.right) : undefined,
              });
            }
          });
        }
        inComponentBody = true;
      }

      // Extract imports
      if (node.type === 'ImportDeclaration' && node.source.value) {
        callbacks.onImport(node.source.value);
      }

      // Extract JSX structure from return statements
      if (inComponentBody && node.type === 'ReturnStatement' && node.argument && 
          callbacks.onJSXReturn && this.isJSXElement(node.argument)) {
        const jsxElement = this.extractJSXStructure(node.argument);
        if (jsxElement) {
          callbacks.onJSXReturn(jsxElement);
        }
      }

      // Recursively visit all properties
      for (const key in node) {
        if (key !== 'parent' && node[key]) {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => visit(child, node));
          } else if (typeof node[key] === 'object') {
            visit(node[key], node);
          }
        }
      }

      // Reset component body flag when leaving function
      if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
        inComponentBody = false;
      }
    };

    visit(ast);
  }

  private extractClasses(node: any, classes: Set<string>) {
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

  private extractFromClassUtil(node: any, classes: Set<string>) {
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

  private parseClassString(classString: string, classes: Set<string>) {
    const classList = classString.split(/\s+/).filter(Boolean);
    classList.forEach(cls => {
      if (this.isTailwindClass(cls)) {
        classes.add(cls);
      }
    });
  }

  private isTailwindClass(className: string): boolean {
    // Check if it matches any Tailwind pattern
    return this.tailwindPatterns.some(pattern => pattern.test(className));
  }

  private categorizeComponent(filePath: string, componentName: string): ExtractedComponent['category'] {
    const relativePath = path.relative(this.config.sourceDir, filePath).toLowerCase();
    const lowerComponentName = componentName.toLowerCase();
    
    // Check path-based categorization
    if (relativePath.includes('/atoms/') || relativePath.includes('/atom/')) return 'atoms';
    if (relativePath.includes('/molecules/') || relativePath.includes('/molecule/')) return 'molecules';
    if (relativePath.includes('/organisms/') || relativePath.includes('/organism/')) return 'organisms';
    if (relativePath.includes('/templates/') || relativePath.includes('/template/')) return 'templates';
    if (relativePath.includes('/pages/') || relativePath.includes('/page/')) return 'pages';
    
    // Check by component name patterns
    const atomPatterns = ['button', 'input', 'label', 'icon', 'badge', 'chip', 'avatar'];
    const moleculePatterns = ['card', 'form', 'dropdown', 'modal', 'tooltip', 'popover'];
    const organismPatterns = ['header', 'footer', 'navbar', 'sidebar', 'table', 'list'];
    const templatePatterns = ['layout', 'template'];
    const pagePatterns = ['page', 'view', 'screen'];
    
    if (atomPatterns.some(p => lowerComponentName.includes(p))) return 'atoms';
    if (moleculePatterns.some(p => lowerComponentName.includes(p))) return 'molecules';
    if (organismPatterns.some(p => lowerComponentName.includes(p))) return 'organisms';
    if (templatePatterns.some(p => lowerComponentName.includes(p))) return 'templates';
    if (pagePatterns.some(p => lowerComponentName.includes(p))) return 'pages';
    
    // Default based on file location depth
    const depth = relativePath.split('/').length;
    if (depth <= 2) return 'atoms';
    if (depth <= 3) return 'molecules';
    return 'organisms';
  }

  private getDefaultValue(node: any): string | undefined {
    if (node.type === 'Literal') {
      return String(node.value);
    } else if (node.type === 'Identifier') {
      return node.name;
    }
    return undefined;
  }

  private isJSXElement(node: any): boolean {
    return node && (
      node.type === 'JSXElement' || 
      node.type === 'JSXFragment' ||
      (node.type === 'JSXExpressionContainer' && this.isJSXElement(node.expression)) ||
      (node.type === 'ConditionalExpression' && 
        (this.isJSXElement(node.consequent) || this.isJSXElement(node.alternate))) ||
      (node.type === 'LogicalExpression' && this.isJSXElement(node.right))
    );
  }

  private extractJSXStructure(node: any): JSXElement | null {
    if (!node) return null;

    // Handle JSX Expression containers
    if (node.type === 'JSXExpressionContainer') {
      return this.extractJSXStructure(node.expression);
    }

    // Handle conditional expressions
    if (node.type === 'ConditionalExpression') {
      // For now, extract the consequent (true branch)
      return this.extractJSXStructure(node.consequent);
    }

    // Handle logical expressions (e.g., condition && <Component />)
    if (node.type === 'LogicalExpression') {
      return this.extractJSXStructure(node.right);
    }

    // Handle JSX Fragment
    if (node.type === 'JSXFragment') {
      return {
        type: 'Fragment',
        props: {},
        children: this.extractJSXChildren(node.children),
      };
    }

    // Handle JSX Element
    if (node.type === 'JSXElement') {
      const element: JSXElement = {
        type: this.getJSXElementType(node.openingElement),
        props: {},
        children: [],
      };

      // Extract props including className
      const { props, className, tailwindClasses } = this.extractJSXProps(node.openingElement.attributes);
      element.props = props;
      if (className) {
        element.className = className;
        element.tailwindClasses = tailwindClasses;
      }

      // Extract children
      if (node.children && node.children.length > 0) {
        element.children = this.extractJSXChildren(node.children);
      }

      return element;
    }

    return null;
  }

  private getJSXElementType(openingElement: any): string {
    if (openingElement.name.type === 'JSXIdentifier') {
      return openingElement.name.name;
    } else if (openingElement.name.type === 'JSXMemberExpression') {
      // Handle things like <Component.Item>
      const parts = [];
      let current = openingElement.name;
      while (current.type === 'JSXMemberExpression') {
        parts.unshift(current.property.name);
        current = current.object;
      }
      if (current.type === 'JSXIdentifier') {
        parts.unshift(current.name);
      }
      return parts.join('.');
    }
    return 'Unknown';
  }

  private extractJSXProps(attributes: any[]): { 
    props: Record<string, any>, 
    className?: string, 
    tailwindClasses?: string[] 
  } {
    const props: Record<string, any> = {};
    let className: string | undefined;
    let tailwindClasses: string[] = [];

    if (!attributes) return { props };

    attributes.forEach((attr: any) => {
      if (attr.type === 'JSXAttribute') {
        const propName = attr.name.name;
        
        if (propName === 'className') {
          const classValue = this.extractAttributeValue(attr.value);
          if (typeof classValue === 'string') {
            className = classValue;
            tailwindClasses = classValue.split(/\s+/)
              .filter(cls => this.isTailwindClass(cls));
          }
        } else {
          props[propName] = this.extractAttributeValue(attr.value);
        }
      } else if (attr.type === 'JSXSpreadAttribute') {
        props['...spread'] = true;
      }
    });

    return { props, className, tailwindClasses };
  }

  private extractAttributeValue(value: any): any {
    if (!value) return true; // Attribute without value (e.g., <input disabled />)
    
    if (value.type === 'Literal') {
      return value.value;
    } else if (value.type === 'JSXExpressionContainer') {
      // For complex expressions, just indicate it's an expression
      if (value.expression.type === 'Literal') {
        return value.expression.value;
      } else if (value.expression.type === 'Identifier') {
        return `{${value.expression.name}}`;
      } else {
        return '{expression}';
      }
    }
    
    return null;
  }

  private extractJSXChildren(children: any[]): (JSXElement | string)[] {
    if (!children) return [];

    return children
      .map((child: any) => {
        if (child.type === 'JSXText') {
          const text = child.value.trim();
          return text || null;
        } else if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
          return this.extractJSXStructure(child);
        } else if (child.type === 'JSXExpressionContainer') {
          // For expressions in children, we'll just indicate it's dynamic content
          return '{...}';
        }
        return null;
      })
      .filter((child): child is JSXElement | string => child !== null);
  }
}