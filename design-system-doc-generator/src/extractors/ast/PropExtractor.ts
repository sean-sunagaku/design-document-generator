import { PropInfo } from '../../types';

export class PropExtractor {
  extractProps(ast: any): PropInfo[] {
    const props: PropInfo[] = [];
    this.visit(ast, props);
    return props;
  }

  private visit(node: any, props: PropInfo[]): void {
    if (!node || typeof node !== 'object') return;

    // Extract props from function components
    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      this.extractPropsFromFunction(node, props);
    }

    // Recursively visit all properties
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => this.visit(child, props));
        } else if (typeof node[key] === 'object') {
          this.visit(node[key], props);
        }
      }
    }
  }

  private extractPropsFromFunction(node: any, props: PropInfo[]): void {
    const params = node.params[0];
    if (params && params.type === 'ObjectPattern') {
      params.properties.forEach((prop: any) => {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          const propInfo: PropInfo = {
            name: prop.key.name,
            type: this.inferPropType(prop),
            required: !prop.value || prop.value.type !== 'AssignmentPattern',
            defaultValue: prop.value?.type === 'AssignmentPattern' ? 
              this.getDefaultValue(prop.value.right) : undefined,
          };
          props.push(propInfo);
        }
      });
    }
  }

  private inferPropType(prop: any): string {
    // Basic type inference - could be enhanced with TypeScript type info
    if (prop.value?.type === 'AssignmentPattern') {
      const defaultValue = prop.value.right;
      if (defaultValue.type === 'Literal') {
        return typeof defaultValue.value;
      } else if (defaultValue.type === 'ArrayExpression') {
        return 'array';
      } else if (defaultValue.type === 'ObjectExpression') {
        return 'object';
      }
    }
    return 'any';
  }

  private getDefaultValue(node: any): string | undefined {
    if (node.type === 'Literal') {
      return String(node.value);
    } else if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'ArrayExpression') {
      return '[]';
    } else if (node.type === 'ObjectExpression') {
      return '{}';
    }
    return undefined;
  }
}