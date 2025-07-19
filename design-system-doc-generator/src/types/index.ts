export interface ExtractedComponent {
  filePath: string;
  componentName: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages';
  tailwindClasses: string[];
  props: PropInfo[];
  dependencies: string[];
  hash: string;
  jsxStructure?: JSXElement;
  platform?: Platform;
  styleInfo?: StyleInfo;
}

export interface StyleInfo {
  type: 'tailwind' | 'stylesheet' | 'inline' | 'styled-components';
  tailwindClasses?: string[];
  classes?: string[];
  styles?: Record<string, any>;
  imports?: string[];
  customStyles?: string;
  responsive?: boolean;
  darkMode?: boolean;
  animations?: string[];
}

export interface JSXElement {
  type: string;
  props: Record<string, any>;
  className?: string;
  tailwindClasses?: string[];
  children?: (JSXElement | string)[];
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface DesignTokens {
  colors: Record<string, ColorToken>;
  spacing: Record<string, string>;
  typography: TypographyTokens;
  breakpoints: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  custom: Record<string, any>;
}

export interface ColorToken {
  value: string;
  rgb?: string;
  usage?: string[];
}

export interface TypographyTokens {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
}

export interface ExtractorConfig {
  sourceDir: string;
  tsConfigPath?: string;
  ignore?: string[];
  platform?: Platform;
}

export type Platform = 'web' | 'react-native';

export interface PlatformConfig {
  platform: Platform;
  styleSystem: StyleSystem;
  validation?: ValidationConfig;
  generation?: GenerationConfig;
}

export type StyleSystem = 'tailwind' | 'stylesheet' | 'styled-components';

export interface ValidationConfig {
  enabled: boolean;
  rules?: string[];
}

export interface GenerationConfig {
  includeNativeImports?: boolean;
  includeStyleSheetExamples?: boolean;
}

export interface GeneratorOptions {
  includeExamples: boolean;
  outputFormat: 'json' | 'markdown';
}

export interface ProjectInfo {
  name: string;
  version: string;
  framework: string;
  styling: string;
}

export interface DiffResult {
  hasChanges: boolean;
  changes: {
    components: {
      added: ExtractedComponent[];
      removed: ExtractedComponent[];
      modified: ModifiedComponent[];
    };
    tokens: {
      added: Record<string, any>;
      removed: Record<string, any>;
      modified: Record<string, any>;
    };
  };
  summary: DiffSummary;
}

export interface ModifiedComponent {
  path: string;
  changes: {
    classesAdded: string[];
    classesRemoved: string[];
    propsChanged: boolean;
  };
}

export interface DiffSummary {
  totalChanges: number;
  componentsAdded: number;
  componentsRemoved: number;
  componentsModified: number;
  newClasses: string[];
  removedClasses: string[];
}

export interface Snapshot {
  version: string;
  timestamp: string;
  components: ExtractedComponent[];
  tokens: DesignTokens;
  project: ProjectInfo;
}

// AST関連の型
export interface ASTNode {
  type: string;
  [key: string]: any;
}

export interface TraversalCallbacks {
  onClassName?: (node: ASTNode) => void;
  onProp?: (prop: PropInfo) => void;
  onImport?: (dep: string) => void;
  onJSXReturn?: (element: JSXElement) => void;
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  category: ExtractedComponent['category'];
}

// ドキュメント生成関連の型
export interface DocumentGenerationContext {
  components: ExtractedComponent[];
  tokens: DesignTokens;
  options: GeneratorOptions;
}

export interface PatternDetectionResult {
  patterns: DesignPattern[];
  relatedComponents: Map<string, string[]>;
}

export interface DesignPattern {
  name: string;
  description: string;
  components: string[];
  examples: string[];
}

export interface GenerationResult {
  document: AIDocument;
  metadata: GenerationMetadata;
}

export interface AIDocument {
  version: string;
  generated: string;
  project: ProjectInfo;
  tokens: DesignTokens;
  components: ComponentDoc[];
  patterns: DesignPattern[];
  guidelines: string[];
}

export interface ComponentDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
  props: PropDoc[];
  styles: StyleInfo;
  examples: CodeExample[];
  relatedComponents: string[];
  jsxStructure?: JSXElement;
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}


export interface CodeExample {
  title: string;
  code: string;
  description?: string;
  validation?: ValidationResult;
}

export interface ValidationResult {
  isValid?: boolean;
  filePath?: string;
  componentCount?: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: ValidationSuggestion[];
}

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  line?: number;
  column?: number;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface ValidationSuggestion {
  line?: number;
  column?: number;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface GenerationMetadata {
  timestamp: string;
  version: string;
  duration: number;
  componentsProcessed: number;
}