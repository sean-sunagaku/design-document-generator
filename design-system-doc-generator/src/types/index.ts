export interface ExtractedComponent {
  filePath: string;
  componentName: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages';
  tailwindClasses: string[];
  props: PropInfo[];
  dependencies: string[];
  hash: string;
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