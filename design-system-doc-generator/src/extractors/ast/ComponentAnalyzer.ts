import * as fs from 'fs';
import * as path from 'path';
const tsEslint = require('@typescript-eslint/typescript-estree');
const { parseAndGenerateServices } = tsEslint;

export class ComponentAnalyzer {
  async analyzeFile(filePath: string): Promise<{
    content: string;
    ast: any;
    componentName: string | null;
    isComponentFile: boolean;
  }> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // Check if it's a component file first
    const isComponentFile = this.isComponentFile(content, filePath);
    if (!isComponentFile) {
      return { content, ast: null, componentName: null, isComponentFile: false };
    }

    // Parse the AST
    const { ast } = parseAndGenerateServices(content, {
      filePath,
      jsx: true,
      loc: true,
      range: true,
    });

    // Extract component name
    const componentName = this.extractComponentName(ast, filePath);

    return { content, ast, componentName, isComponentFile };
  }

  private isComponentFile(content: string, filePath: string): boolean {
    // Check file extension
    const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];
    if (!validExtensions.some(ext => filePath.endsWith(ext))) {
      return false;
    }

    // Check for React component patterns
    const hasJSX = /<[a-zA-Z][a-zA-Z0-9]*/.test(content);
    const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/.test(content);
    const hasExport = /export\s+(default\s+)?(function|const|class)/.test(content);
    
    return hasJSX && hasReactImport && hasExport;
  }

  private extractComponentName(ast: any, filePath: string): string | null {
    let componentName: string | null = null;

    // Look for exports
    for (const node of ast.body) {
      if (node.type === 'ExportDefaultDeclaration') {
        componentName = this.getNameFromDeclaration(node.declaration);
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        componentName = this.getNameFromDeclaration(node.declaration);
      }
      
      if (componentName) break;
    }

    // Fallback to filename
    if (!componentName) {
      const basename = path.basename(filePath, path.extname(filePath));
      componentName = basename.replace(/\..*$/, '');
    }

    return componentName;
  }

  private getNameFromDeclaration(declaration: any): string | null {
    if (declaration.type === 'FunctionDeclaration' && declaration.id) {
      return declaration.id.name;
    } else if (declaration.type === 'Identifier') {
      return declaration.name;
    } else if (declaration.type === 'VariableDeclaration') {
      const firstDeclarator = declaration.declarations[0];
      if (firstDeclarator && firstDeclarator.id.type === 'Identifier') {
        return firstDeclarator.id.name;
      }
    }
    return null;
  }
}