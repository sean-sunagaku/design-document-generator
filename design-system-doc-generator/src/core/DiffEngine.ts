import * as jsondiffpatch from 'jsondiffpatch';
import chalk from 'chalk';
import { 
  DiffResult, 
  ExtractedComponent, 
  ModifiedComponent, 
  DiffSummary,
  Snapshot 
} from '../types';

export class DiffEngine {
  private differ: any;

  constructor() {
    this.differ = jsondiffpatch.create({
      objectHash: (obj: any) => {
        if (obj.filePath) return obj.filePath;
        if (obj.componentName) return obj.componentName;
        return JSON.stringify(obj);
      },
      arrays: {
        detectMove: true,
        includeValueOnMove: false,
      },
      propertyFilter: (name: string) => !name.startsWith('_') && name !== 'timestamp' && name !== 'hash',
    });
  }

  async compareSnapshots(oldSnapshot: Snapshot, newSnapshot: Snapshot): Promise<DiffResult> {
    const oldComponents = this.indexComponents(oldSnapshot.components);
    const newComponents = this.indexComponents(newSnapshot.components);
    
    const result: DiffResult = {
      hasChanges: false,
      changes: {
        components: {
          added: [],
          removed: [],
          modified: [],
        },
        tokens: {
          added: {},
          removed: {},
          modified: {},
        },
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

    // Find added/removed/modified components
    const allPaths = new Set([...Object.keys(oldComponents), ...Object.keys(newComponents)]);
    
    for (const path of allPaths) {
      if (!oldComponents[path] && newComponents[path]) {
        // Added
        result.changes.components.added.push(newComponents[path]);
        result.summary.componentsAdded++;
      } else if (oldComponents[path] && !newComponents[path]) {
        // Removed
        result.changes.components.removed.push(oldComponents[path]);
        result.summary.componentsRemoved++;
      } else if (oldComponents[path] && newComponents[path]) {
        // Check if modified
        const modified = this.compareComponents(oldComponents[path], newComponents[path]);
        if (modified) {
          result.changes.components.modified.push(modified);
          result.summary.componentsModified++;
        }
      }
    }

    // Compare tokens
    const tokenDiff = this.compareTokens(oldSnapshot.tokens, newSnapshot.tokens);
    result.changes.tokens = tokenDiff;

    // Calculate summary
    result.summary.totalChanges = 
      result.summary.componentsAdded + 
      result.summary.componentsRemoved + 
      result.summary.componentsModified;
    
    result.hasChanges = result.summary.totalChanges > 0;

    // Extract new/removed classes
    result.summary.newClasses = this.extractNewClasses(oldComponents, newComponents);
    result.summary.removedClasses = this.extractRemovedClasses(oldComponents, newComponents);

    return result;
  }

  private indexComponents(components: ExtractedComponent[]): Record<string, ExtractedComponent> {
    const index: Record<string, ExtractedComponent> = {};
    for (const component of components) {
      index[component.filePath] = component;
    }
    return index;
  }

  private compareComponents(
    oldComp: ExtractedComponent, 
    newComp: ExtractedComponent
  ): ModifiedComponent | null {
    const classesAdded = newComp.tailwindClasses.filter(
      cls => !oldComp.tailwindClasses.includes(cls)
    );
    const classesRemoved = oldComp.tailwindClasses.filter(
      cls => !newComp.tailwindClasses.includes(cls)
    );
    
    const propsChanged = JSON.stringify(oldComp.props) !== JSON.stringify(newComp.props);
    
    if (classesAdded.length > 0 || classesRemoved.length > 0 || propsChanged) {
      return {
        path: newComp.filePath,
        changes: {
          classesAdded,
          classesRemoved,
          propsChanged,
        },
      };
    }
    
    return null;
  }

  private compareTokens(oldTokens: any, newTokens: any): {
    added: Record<string, any>;
    removed: Record<string, any>;
    modified: Record<string, any>;
  } {
    const result = {
      added: {} as Record<string, any>,
      removed: {} as Record<string, any>,
      modified: {} as Record<string, any>,
    };

    // Compare each token category
    const categories = ['colors', 'spacing', 'typography', 'breakpoints', 'shadows', 'borderRadius'];
    
    for (const category of categories) {
      const oldCat = oldTokens[category] || {};
      const newCat = newTokens[category] || {};
      const allKeys = new Set([...Object.keys(oldCat), ...Object.keys(newCat)]);
      
      for (const key of allKeys) {
        if (!oldCat[key] && newCat[key]) {
          if (!result.added[category]) result.added[category] = {};
          result.added[category][key] = newCat[key];
        } else if (oldCat[key] && !newCat[key]) {
          if (!result.removed[category]) result.removed[category] = {};
          result.removed[category][key] = oldCat[key];
        } else if (oldCat[key] && newCat[key] && 
                   JSON.stringify(oldCat[key]) !== JSON.stringify(newCat[key])) {
          if (!result.modified[category]) result.modified[category] = {};
          result.modified[category][key] = {
            old: oldCat[key],
            new: newCat[key],
          };
        }
      }
    }

    return result;
  }

  private extractNewClasses(
    oldComponents: Record<string, ExtractedComponent>,
    newComponents: Record<string, ExtractedComponent>
  ): string[] {
    const oldClasses = new Set<string>();
    const newClasses = new Set<string>();
    
    Object.values(oldComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => oldClasses.add(cls));
    });
    
    Object.values(newComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => newClasses.add(cls));
    });
    
    return Array.from(newClasses).filter(cls => !oldClasses.has(cls));
  }

  private extractRemovedClasses(
    oldComponents: Record<string, ExtractedComponent>,
    newComponents: Record<string, ExtractedComponent>
  ): string[] {
    const oldClasses = new Set<string>();
    const newClasses = new Set<string>();
    
    Object.values(oldComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => oldClasses.add(cls));
    });
    
    Object.values(newComponents).forEach(comp => {
      comp.tailwindClasses.forEach(cls => newClasses.add(cls));
    });
    
    return Array.from(oldClasses).filter(cls => !newClasses.has(cls));
  }

  displayDiff(result: DiffResult): void {
    console.log(chalk.bold('\n📊 デザインシステム変更レポート\n'));

    if (!result.hasChanges) {
      console.log(chalk.gray('変更はありません。'));
      return;
    }

    // 追加されたコンポーネント
    if (result.changes.components.added.length > 0) {
      console.log(chalk.green.bold('+ 追加されたコンポーネント:'));
      result.changes.components.added.forEach(comp => {
        console.log(chalk.green(`  + ${comp.filePath}`));
        console.log(chalk.gray(`    カテゴリ: ${comp.category}`));
        console.log(chalk.gray(`    クラス数: ${comp.tailwindClasses.length}`));
      });
      console.log();
    }

    // 削除されたコンポーネント
    if (result.changes.components.removed.length > 0) {
      console.log(chalk.red.bold('- 削除されたコンポーネント:'));
      result.changes.components.removed.forEach(comp => {
        console.log(chalk.red(`  - ${comp.filePath}`));
      });
      console.log();
    }

    // 変更されたコンポーネント
    if (result.changes.components.modified.length > 0) {
      console.log(chalk.yellow.bold('~ 変更されたコンポーネント:'));
      result.changes.components.modified.forEach(comp => {
        console.log(chalk.yellow(`  ~ ${comp.path}`));
        if (comp.changes.classesAdded.length > 0) {
          console.log(chalk.green(`    追加クラス: ${comp.changes.classesAdded.join(', ')}`));
        }
        if (comp.changes.classesRemoved.length > 0) {
          console.log(chalk.red(`    削除クラス: ${comp.changes.classesRemoved.join(', ')}`));
        }
        if (comp.changes.propsChanged) {
          console.log(chalk.yellow(`    Props変更あり`));
        }
      });
      console.log();
    }

    // トークンの変更
    this.displayTokenChanges(result.changes.tokens);

    // サマリー
    console.log(chalk.bold('\n📈 サマリー:'));
    console.log(`  総変更数: ${result.summary.totalChanges}`);
    console.log(`  追加コンポーネント: ${result.summary.componentsAdded}`);
    console.log(`  削除コンポーネント: ${result.summary.componentsRemoved}`);
    console.log(`  変更コンポーネント: ${result.summary.componentsModified}`);
    
    if (result.summary.newClasses.length > 0) {
      console.log(`\n  新規クラス: ${chalk.green(result.summary.newClasses.slice(0, 5).join(', '))}${
        result.summary.newClasses.length > 5 ? chalk.gray(` 他${result.summary.newClasses.length - 5}個`) : ''
      }`);
    }

    if (result.summary.removedClasses.length > 0) {
      console.log(`  削除クラス: ${chalk.red(result.summary.removedClasses.slice(0, 5).join(', '))}${
        result.summary.removedClasses.length > 5 ? chalk.gray(` 他${result.summary.removedClasses.length - 5}個`) : ''
      }`);
    }
  }

  private displayTokenChanges(tokens: DiffResult['changes']['tokens']): void {
    const hasTokenChanges = 
      Object.keys(tokens.added).length > 0 ||
      Object.keys(tokens.removed).length > 0 ||
      Object.keys(tokens.modified).length > 0;

    if (!hasTokenChanges) return;

    console.log(chalk.bold('\n🎨 デザイントークンの変更:'));

    // Added tokens
    for (const [category, items] of Object.entries(tokens.added)) {
      console.log(chalk.green(`\n  + ${category}:`));
      for (const [key, value] of Object.entries(items as any)) {
        console.log(chalk.green(`    + ${key}: ${JSON.stringify(value)}`));
      }
    }

    // Removed tokens
    for (const [category, items] of Object.entries(tokens.removed)) {
      console.log(chalk.red(`\n  - ${category}:`));
      for (const [key, value] of Object.entries(items as any)) {
        console.log(chalk.red(`    - ${key}: ${JSON.stringify(value)}`));
      }
    }

    // Modified tokens
    for (const [category, items] of Object.entries(tokens.modified)) {
      console.log(chalk.yellow(`\n  ~ ${category}:`));
      for (const [key, change] of Object.entries(items as any)) {
        console.log(chalk.yellow(`    ~ ${key}:`));
        console.log(chalk.gray(`      旧: ${JSON.stringify((change as any).old)}`));
        console.log(chalk.gray(`      新: ${JSON.stringify((change as any).new)}`));
      }
    }
  }
}