import { DiffEngine } from '../../core/DiffEngine';
import { Snapshot, ExtractedComponent } from '../../types';

// Mock jsondiffpatch
jest.mock('jsondiffpatch', () => ({
  create: jest.fn(() => ({
    diff: jest.fn(),
  })),
}));

describe('DiffEngine', () => {
  let diffEngine: DiffEngine;

  beforeEach(() => {
    diffEngine = new DiffEngine();
  });

  const createMockComponent = (
    name: string,
    filePath: string,
    classes: string[] = [],
    overrides: Partial<ExtractedComponent> = {}
  ): ExtractedComponent => ({
    filePath,
    componentName: name,
    category: 'atoms',
    tailwindClasses: classes,
    props: [],
    dependencies: [],
    hash: 'mock-hash',
    ...overrides,
  });

  const createMockSnapshot = (
    components: ExtractedComponent[],
    timestamp: string = '2024-01-01T00:00:00Z'
  ): Snapshot => ({
    version: '1.0.0',
    timestamp,
    components,
    tokens: {
      colors: {},
      spacing: {},
      typography: {
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      },
      breakpoints: {},
      shadows: {},
      borderRadius: {},
      custom: {},
    },
    project: {
      name: 'test-project',
      version: '1.0.0',
      framework: 'react',
      styling: 'tailwindcss',
    },
  });

  describe('compareSnapshots', () => {
    it('should detect no changes when snapshots are identical', async () => {
      const component = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const snapshot1 = createMockSnapshot([component]);
      const snapshot2 = createMockSnapshot([component]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(false);
      expect(result.summary.totalChanges).toBe(0);
      expect(result.changes.components.added).toHaveLength(0);
      expect(result.changes.components.removed).toHaveLength(0);
      expect(result.changes.components.modified).toHaveLength(0);
    });

    it('should detect added components', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const component2 = createMockComponent('Input', './Input.tsx', ['border', 'rounded']);
      
      const snapshot1 = createMockSnapshot([component1]);
      const snapshot2 = createMockSnapshot([component1, component2]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.summary.componentsAdded).toBe(1);
      expect(result.changes.components.added).toHaveLength(1);
      expect(result.changes.components.added[0].componentName).toBe('Input');
    });

    it('should detect removed components', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const component2 = createMockComponent('Input', './Input.tsx', ['border', 'rounded']);
      
      const snapshot1 = createMockSnapshot([component1, component2]);
      const snapshot2 = createMockSnapshot([component1]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.summary.componentsRemoved).toBe(1);
      expect(result.changes.components.removed).toHaveLength(1);
      expect(result.changes.components.removed[0].componentName).toBe('Input');
    });

    it('should detect modified components - classes added', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const component2 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2', 'bg-blue-500']);
      
      const snapshot1 = createMockSnapshot([component1]);
      const snapshot2 = createMockSnapshot([component2]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.summary.componentsModified).toBe(1);
      expect(result.changes.components.modified).toHaveLength(1);
      expect(result.changes.components.modified[0].changes.classesAdded).toContain('bg-blue-500');
      expect(result.changes.components.modified[0].changes.classesRemoved).toHaveLength(0);
    });

    it('should detect modified components - classes removed', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2', 'bg-blue-500']);
      const component2 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      
      const snapshot1 = createMockSnapshot([component1]);
      const snapshot2 = createMockSnapshot([component2]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.summary.componentsModified).toBe(1);
      expect(result.changes.components.modified).toHaveLength(1);
      expect(result.changes.components.modified[0].changes.classesRemoved).toContain('bg-blue-500');
      expect(result.changes.components.modified[0].changes.classesAdded).toHaveLength(0);
    });

    it('should detect modified components - props changed', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2'], {
        props: [{ name: 'onClick', type: '() => void', required: false }],
      });
      const component2 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2'], {
        props: [
          { name: 'onClick', type: '() => void', required: false },
          { name: 'disabled', type: 'boolean', required: false },
        ],
      });
      
      const snapshot1 = createMockSnapshot([component1]);
      const snapshot2 = createMockSnapshot([component2]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.summary.componentsModified).toBe(1);
      expect(result.changes.components.modified).toHaveLength(1);
      expect(result.changes.components.modified[0].changes.propsChanged).toBe(true);
    });

    it('should extract new and removed classes across all components', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2', 'bg-blue-500']);
      const component2 = createMockComponent('Input', './Input.tsx', ['border', 'rounded']);
      
      const component1Modified = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2', 'bg-red-500']);
      const component3 = createMockComponent('Card', './Card.tsx', ['shadow-lg', 'p-6']);
      
      const snapshot1 = createMockSnapshot([component1, component2]);
      const snapshot2 = createMockSnapshot([component1Modified, component3]);

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.summary.newClasses).toContain('bg-red-500');
      expect(result.summary.newClasses).toContain('shadow-lg');
      expect(result.summary.newClasses).toContain('p-6');
      expect(result.summary.removedClasses).toContain('bg-blue-500');
      expect(result.summary.removedClasses).toContain('border');
      expect(result.summary.removedClasses).toContain('rounded');
    });

    it('should compare design tokens', async () => {
      const snapshot1 = createMockSnapshot([]);
      const snapshot2 = createMockSnapshot([]);

      snapshot1.tokens.colors = {
        'primary-500': { value: '#3b82f6', usage: [] },
        'secondary-500': { value: '#6b7280', usage: [] },
      };

      snapshot2.tokens.colors = {
        'primary-500': { value: '#2563eb', usage: [] }, // Changed
        'success-500': { value: '#22c55e', usage: [] }, // Added
        // secondary-500 removed
      };

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.changes.tokens.added.colors).toEqual({
        'success-500': { value: '#22c55e', usage: [] },
      });
      expect(result.changes.tokens.removed.colors).toEqual({
        'secondary-500': { value: '#6b7280', usage: [] },
      });
      expect(result.changes.tokens.modified.colors).toEqual({
        'primary-500': {
          old: { value: '#3b82f6', usage: [] },
          new: { value: '#2563eb', usage: [] },
        },
      });
    });

    it('should handle multiple component changes', async () => {
      const component1 = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const component2 = createMockComponent('Input', './Input.tsx', ['border', 'rounded']);
      const component3 = createMockComponent('Card', './Card.tsx', ['shadow', 'p-4']);
      
      const component1Modified = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2', 'bg-blue-500']);
      const component4 = createMockComponent('Modal', './Modal.tsx', ['fixed', 'inset-0']);
      
      const snapshot1 = createMockSnapshot([component1, component2, component3]);
      const snapshot2 = createMockSnapshot([component1Modified, component4]); // Input and Card removed, Modal added

      const result = await diffEngine.compareSnapshots(snapshot1, snapshot2);

      expect(result.hasChanges).toBe(true);
      expect(result.summary.totalChanges).toBe(4); // 1 added + 2 removed + 1 modified
      expect(result.summary.componentsAdded).toBe(1);
      expect(result.summary.componentsRemoved).toBe(2);
      expect(result.summary.componentsModified).toBe(1);
    });
  });

  describe('displayDiff', () => {
    it('should display no changes message when there are no changes', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = {
        hasChanges: false,
        changes: {
          components: { added: [], removed: [], modified: [] },
          tokens: { added: {}, removed: {}, modified: {} },
        },
        summary: {
          totalChanges: 0,
          componentsAdded: 0,
          componentsRemoved: 0,
          componentsModified: 0,
          newClasses: [],
          removedClasses: [],
        },
      };

      diffEngine.displayDiff(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('変更はありません'));
      
      consoleSpy.mockRestore();
    });

    it('should display changes when there are modifications', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const addedComponent = createMockComponent('Button', './Button.tsx', ['px-4', 'py-2']);
      const removedComponent = createMockComponent('Input', './Input.tsx', ['border', 'rounded']);
      
      const result = {
        hasChanges: true,
        changes: {
          components: {
            added: [addedComponent],
            removed: [removedComponent],
            modified: [{
              path: './Card.tsx',
              changes: {
                classesAdded: ['bg-blue-500'],
                classesRemoved: ['bg-gray-500'],
                propsChanged: true,
              },
            }],
          },
          tokens: { added: {}, removed: {}, modified: {} },
        },
        summary: {
          totalChanges: 3,
          componentsAdded: 1,
          componentsRemoved: 1,
          componentsModified: 1,
          newClasses: ['bg-blue-500'],
          removedClasses: ['bg-gray-500'],
        },
      };

      diffEngine.displayDiff(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('デザインシステム変更レポート'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('追加されたコンポーネント'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('削除されたコンポーネント'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('変更されたコンポーネント'));
      
      consoleSpy.mockRestore();
    });
  });
});