import { ASTNode, TraversalCallbacks } from '../../types';

export class ASTTraverser {
  private inComponentBody = false;

  traverse(ast: ASTNode, callbacks: TraversalCallbacks): void {
    this.visit(ast, callbacks);
  }

  private visit(node: any, callbacks: TraversalCallbacks, parent?: any): void {
    if (!node || typeof node !== 'object') return;

    // Extract className props
    if (node.type === 'JSXAttribute' && node.name?.name === 'className') {
      if (node.value && callbacks.onClassName) {
        callbacks.onClassName(node.value);
      }
    }

    // Extract props from function components
    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      if (callbacks.onProp) {
        this.extractPropsFromFunction(node, callbacks.onProp);
      }
      this.inComponentBody = true;
    }

    // Extract imports
    if (node.type === 'ImportDeclaration' && node.source.value && callbacks.onImport) {
      callbacks.onImport(node.source.value);
    }

    // Extract JSX structure from return statements
    if (this.inComponentBody && node.type === 'ReturnStatement' && node.argument && 
        callbacks.onJSXReturn && this.isJSXElement(node.argument)) {
      callbacks.onJSXReturn(node.argument);
    }

    // Recursively visit all properties
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => this.visit(child, callbacks, node));
        } else if (typeof node[key] === 'object') {
          this.visit(node[key], callbacks, node);
        }
      }
    }

    // Reset component body flag when leaving function
    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      this.inComponentBody = false;
    }
  }

  private extractPropsFromFunction(node: any, onProp: (prop: any) => void): void {
    const params = node.params[0];
    if (params && params.type === 'ObjectPattern') {
      params.properties.forEach((prop: any) => {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          onProp({
            name: prop.key.name,
            type: 'any',
            required: !prop.value || prop.value.type !== 'AssignmentPattern',
            defaultValue: prop.value?.type === 'AssignmentPattern' ? 
              this.getDefaultValue(prop.value.right) : undefined,
          });
        }
      });
    }
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
}