import * as fs from 'fs';
import * as path from 'path';

// TypeScriptを条件付きでimport（テスト環境での問題を回避）
let ts: any;
let tsEslint: any;
let parseAndGenerateServices: any;

try {
  ts = require('typescript');
  tsEslint = require('@typescript-eslint/typescript-estree');
  parseAndGenerateServices = tsEslint.parseAndGenerateServices;
} catch (error) {
  console.warn('TypeScript validation not available:', error.message);
  ts = null;
  parseAndGenerateServices = null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  code?: string;
}

export class CodeValidator {
  
  validateReactCode(code: string, filename: string = 'temp.tsx'): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Parse with TypeScript ESLint parser
      const { ast } = parseAndGenerateServices(code, {
        filePath: filename,
        jsx: true,
        loc: true,
        range: true,
        errorOnUnknownASTType: false,
        errorOnTypeScriptSyntacticAndSemanticIssues: false,
      });

      // Basic syntax validation passed
      this.validateReactPatterns(ast, result);
      this.validateImports(ast, result);
      this.validateJSXStructure(ast, result);

    } catch (error: any) {
      result.isValid = false;
      result.errors.push({
        line: error.lineNumber || 1,
        column: error.column || 1,
        message: error.message || 'Syntax error',
        code: 'SYNTAX_ERROR'
      });
    }

    return result;
  }

  validateTypeScriptCode(code: string, filename: string = 'temp.ts'): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // TypeScriptが利用できない場合は警告を返す
    if (!ts) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: 'TypeScript validation is not available',
        code: 'TS_NOT_AVAILABLE'
      });
      return result;
    }

    try {
      // Create a temporary source file
      const sourceFile = ts.createSourceFile(
        filename,
        code,
        ts.ScriptTarget.ES2020,
        true,
        ts.ScriptKind.TSX
      );

      // Check for syntax errors
      const diagnostics = ts.getPreEmitDiagnostics(
        ts.createProgram([filename], {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
          strict: false,
          skipLibCheck: true,
          skipDefaultLibCheck: true,
        }, {
          getSourceFile: (name) => name === filename ? sourceFile : undefined,
          writeFile: () => {},
          getCurrentDirectory: () => process.cwd(),
          getDirectories: () => [],
          fileExists: (name) => name === filename,
          readFile: (name) => name === filename ? code : undefined,
          getCanonicalFileName: (name) => name,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => '\n',
          getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        })
      );

      diagnostics.forEach(diagnostic => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          diagnostic.start || 0
        );
        
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          result.isValid = false;
          result.errors.push({
            line: line + 1,
            column: character + 1,
            message,
            code: `TS${diagnostic.code}`
          });
        } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
          result.warnings.push({
            line: line + 1,
            column: character + 1,
            message,
            code: `TS${diagnostic.code}`
          });
        }
      });

    } catch (error: any) {
      result.isValid = false;
      result.errors.push({
        line: 1,
        column: 1,
        message: error.message || 'TypeScript compilation error',
        code: 'TS_ERROR'
      });
    }

    return result;
  }

  private validateReactPatterns(ast: any, result: ValidationResult): void {
    // Check for React import
    let hasReactImport = false;
    
    if (ast.body) {
      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration' && 
            node.source && 
            node.source.value === 'react') {
          hasReactImport = true;
          break;
        }
      }
    }

    // Check for JSX usage
    const hasJSX = this.hasJSXInAST(ast);
    
    if (hasJSX && !hasReactImport) {
      result.warnings.push({
        line: 1,
        column: 1,
        message: 'JSX used without React import',
        code: 'MISSING_REACT_IMPORT'
      });
    }
  }

  private validateImports(ast: any, result: ValidationResult): void {
    if (!ast.body) return;

    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        // Check for relative imports that might not exist
        if (node.source && node.source.value) {
          const importPath = node.source.value;
          if (importPath.startsWith('.') && !importPath.endsWith('.tsx') && !importPath.endsWith('.ts')) {
            result.warnings.push({
              line: node.loc?.start?.line || 1,
              column: node.loc?.start?.column || 1,
              message: `Relative import '${importPath}' might not exist`,
              code: 'POTENTIAL_MISSING_IMPORT'
            });
          }
        }
      }
    }
  }

  private validateJSXStructure(ast: any, result: ValidationResult): void {
    this.traverseForJSXValidation(ast, result);
  }

  private traverseForJSXValidation(node: any, result: ValidationResult): void {
    if (!node || typeof node !== 'object') return;

    // Check for unclosed JSX elements
    if (node.type === 'JSXElement' && node.openingElement && !node.closingElement) {
      result.errors.push({
        line: node.loc?.start?.line || 1,
        column: node.loc?.start?.column || 1,
        message: 'Unclosed JSX element',
        code: 'UNCLOSED_JSX'
      });
    }

    // Check for invalid JSX attribute names
    if (node.type === 'JSXAttribute' && node.name) {
      const attrName = node.name.name;
      if (attrName && typeof attrName === 'string') {
        // Check for common mistakes
        if (attrName === 'class') {
          result.warnings.push({
            line: node.loc?.start?.line || 1,
            column: node.loc?.start?.column || 1,
            message: 'Use className instead of class in JSX',
            code: 'JSX_CLASS_ATTRIBUTE'
          });
        }
      }
    }

    // Recursively traverse
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => this.traverseForJSXValidation(child, result));
        } else if (typeof node[key] === 'object') {
          this.traverseForJSXValidation(node[key], result);
        }
      }
    }
  }

  private hasJSXInAST(node: any): boolean {
    if (!node || typeof node !== 'object') return false;

    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      return true;
    }

    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            if (this.hasJSXInAST(child)) return true;
          }
        } else if (typeof node[key] === 'object') {
          if (this.hasJSXInAST(node[key])) return true;
        }
      }
    }

    return false;
  }

  validateExampleCode(example: string, componentName: string): ValidationResult {
    // Add basic imports if not present
    const codeWithImports = this.addMissingImports(example, componentName);
    
    // Validate the enhanced code
    return this.validateReactCode(codeWithImports, `${componentName}Example.tsx`);
  }

  private addMissingImports(code: string, componentName: string): string {
    let enhanced = code;

    // Add React import if missing
    if (!code.includes('import React') && !code.includes('import * as React')) {
      enhanced = `import React from 'react';\n${enhanced}`;
    }

    // Add component import if missing
    if (!code.includes(`import { ${componentName} }`) && !code.includes(`import ${componentName}`)) {
      enhanced = `import { ${componentName} } from './${componentName}';\n${enhanced}`;
    }

    return enhanced;
  }

  validateTailwindClasses(classes: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const validTailwindPatterns = [
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

    classes.forEach(className => {
      const isValid = validTailwindPatterns.some(pattern => pattern.test(className));
      
      if (!isValid) {
        result.warnings.push({
          line: 1,
          column: 1,
          message: `'${className}' might not be a valid Tailwind CSS class`,
          code: 'INVALID_TAILWIND_CLASS'
        });
      }
    });

    return result;
  }
}