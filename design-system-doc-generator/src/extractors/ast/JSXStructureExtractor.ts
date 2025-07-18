import { JSXElement } from '../../types';
import { TailwindClassExtractor } from './TailwindClassExtractor';

export class JSXStructureExtractor {
  private tailwindExtractor: TailwindClassExtractor;

  constructor() {
    this.tailwindExtractor = new TailwindClassExtractor();
  }

  extractJSXStructure(ast: any): JSXElement | null {
    const returnStatement = this.findReturnStatement(ast);
    if (!returnStatement || !returnStatement.argument) {
      return null;
    }

    return this.processJSXNode(returnStatement.argument);
  }

  private findReturnStatement(node: any): any {
    if (!node || typeof node !== 'object') return null;

    if (node.type === 'ReturnStatement' && this.isJSXElement(node.argument)) {
      return node;
    }

    // Recursively search for return statements
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            const result = this.findReturnStatement(child);
            if (result) return result;
          }
        } else if (typeof node[key] === 'object') {
          const result = this.findReturnStatement(node[key]);
          if (result) return result;
        }
      }
    }

    return null;
  }

  private processJSXNode(node: any): JSXElement | null {
    if (!node) return null;

    // Handle JSX Expression containers
    if (node.type === 'JSXExpressionContainer') {
      return this.processJSXNode(node.expression);
    }

    // Handle conditional expressions
    if (node.type === 'ConditionalExpression') {
      return this.processJSXNode(node.consequent);
    }

    // Handle logical expressions
    if (node.type === 'LogicalExpression') {
      return this.processJSXNode(node.right);
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
              .filter(cls => this.tailwindExtractor.isTailwindClass(cls));
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
    if (!value) return true;
    
    if (value.type === 'Literal') {
      return value.value;
    } else if (value.type === 'JSXExpressionContainer') {
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
          return this.processJSXNode(child);
        } else if (child.type === 'JSXExpressionContainer') {
          return '{...}';
        }
        return null;
      })
      .filter((child): child is JSXElement | string => child !== null);
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
}