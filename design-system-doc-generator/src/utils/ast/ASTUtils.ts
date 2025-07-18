import { ASTNode } from '../../types';

export class ASTUtils {
  static isJSXElement(node: any): boolean {
    return node && (
      node.type === 'JSXElement' || 
      node.type === 'JSXFragment' ||
      (node.type === 'JSXExpressionContainer' && ASTUtils.isJSXElement(node.expression)) ||
      (node.type === 'ConditionalExpression' && 
        (ASTUtils.isJSXElement(node.consequent) || ASTUtils.isJSXElement(node.alternate))) ||
      (node.type === 'LogicalExpression' && ASTUtils.isJSXElement(node.right))
    );
  }

  static isReactComponent(node: any): boolean {
    return node && (
      node.type === 'FunctionDeclaration' ||
      node.type === 'ArrowFunctionExpression' ||
      (node.type === 'VariableDeclarator' && 
        node.init && 
        (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression'))
    );
  }

  static getNodeName(node: any): string | null {
    if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'JSXIdentifier') {
      return node.name;
    } else if (node.type === 'JSXMemberExpression') {
      return ASTUtils.getJSXMemberExpressionName(node);
    } else if (node.type === 'FunctionDeclaration' && node.id) {
      return node.id.name;
    } else if (node.type === 'VariableDeclarator' && node.id) {
      return node.id.name;
    }
    return null;
  }

  static getJSXMemberExpressionName(node: any): string {
    const parts = [];
    let current = node;
    
    while (current.type === 'JSXMemberExpression') {
      parts.unshift(current.property.name);
      current = current.object;
    }
    
    if (current.type === 'JSXIdentifier') {
      parts.unshift(current.name);
    }
    
    return parts.join('.');
  }

  static findNodesByType(ast: ASTNode, nodeType: string): any[] {
    const nodes: any[] = [];
    
    function traverse(node: any) {
      if (!node || typeof node !== 'object') return;
      
      if (node.type === nodeType) {
        nodes.push(node);
      }
      
      for (const key in node) {
        if (key !== 'parent' && node[key]) {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else if (typeof node[key] === 'object') {
            traverse(node[key]);
          }
        }
      }
    }
    
    traverse(ast);
    return nodes;
  }

  static findFirstNodeByType(ast: ASTNode, nodeType: string): any | null {
    function traverse(node: any): any | null {
      if (!node || typeof node !== 'object') return null;
      
      if (node.type === nodeType) {
        return node;
      }
      
      for (const key in node) {
        if (key !== 'parent' && node[key]) {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              const result = traverse(child);
              if (result) return result;
            }
          } else if (typeof node[key] === 'object') {
            const result = traverse(node[key]);
            if (result) return result;
          }
        }
      }
      
      return null;
    }
    
    return traverse(ast);
  }

  static getAttributeValue(attribute: any): any {
    if (!attribute || attribute.type !== 'JSXAttribute') return null;
    
    const value = attribute.value;
    if (!value) return true; // Boolean attribute
    
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

  static isImportFromReact(node: any): boolean {
    return node && 
           node.type === 'ImportDeclaration' && 
           node.source && 
           node.source.type === 'Literal' && 
           typeof node.source.value === 'string' && 
           node.source.value === 'react';
  }

  static getImportedNames(node: any): string[] {
    if (!node || node.type !== 'ImportDeclaration') return [];
    
    const names: string[] = [];
    
    if (node.specifiers) {
      node.specifiers.forEach((spec: any) => {
        if (spec.type === 'ImportDefaultSpecifier') {
          names.push(spec.local.name);
        } else if (spec.type === 'ImportSpecifier') {
          names.push(spec.imported.name);
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          names.push(spec.local.name);
        }
      });
    }
    
    return names;
  }

  static hasJSXInReturnStatement(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    
    if (node.type === 'ReturnStatement' && node.argument) {
      return ASTUtils.isJSXElement(node.argument);
    }
    
    // Search in children
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            if (ASTUtils.hasJSXInReturnStatement(child)) {
              return true;
            }
          }
        } else if (typeof node[key] === 'object') {
          if (ASTUtils.hasJSXInReturnStatement(node[key])) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
}