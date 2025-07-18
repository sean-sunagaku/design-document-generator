import * as path from 'path';
import { ExtractedComponent } from '../../types';

export class ComponentCategorizer {
  private atomPatterns = ['button', 'input', 'label', 'icon', 'badge', 'chip', 'avatar'];
  private moleculePatterns = ['card', 'form', 'dropdown', 'modal', 'tooltip', 'popover'];
  private organismPatterns = ['header', 'footer', 'navbar', 'sidebar', 'table', 'list'];
  private templatePatterns = ['layout', 'template'];
  private pagePatterns = ['page', 'view', 'screen'];

  categorizeComponent(
    filePath: string, 
    componentName: string, 
    sourceDir: string
  ): ExtractedComponent['category'] {
    const relativePath = path.relative(sourceDir, filePath).toLowerCase();
    const lowerComponentName = componentName.toLowerCase();
    
    // Check path-based categorization first (most reliable)
    const pathCategory = this.categorizeByPath(relativePath);
    if (pathCategory) return pathCategory;
    
    // Check by component name patterns
    const nameCategory = this.categorizeByName(lowerComponentName);
    if (nameCategory) return nameCategory;
    
    // Default based on file location depth
    return this.categorizeByDepth(relativePath);
  }

  private categorizeByPath(relativePath: string): ExtractedComponent['category'] | null {
    if (relativePath.includes('/atoms/') || relativePath.includes('/atom/')) return 'atoms';
    if (relativePath.includes('/molecules/') || relativePath.includes('/molecule/')) return 'molecules';
    if (relativePath.includes('/organisms/') || relativePath.includes('/organism/')) return 'organisms';
    if (relativePath.includes('/templates/') || relativePath.includes('/template/')) return 'templates';
    if (relativePath.includes('/pages/') || relativePath.includes('/page/')) return 'pages';
    return null;
  }

  private categorizeByName(componentName: string): ExtractedComponent['category'] | null {
    if (this.atomPatterns.some(p => componentName.includes(p))) return 'atoms';
    if (this.moleculePatterns.some(p => componentName.includes(p))) return 'molecules';
    if (this.organismPatterns.some(p => componentName.includes(p))) return 'organisms';
    if (this.templatePatterns.some(p => componentName.includes(p))) return 'templates';
    if (this.pagePatterns.some(p => componentName.includes(p))) return 'pages';
    return null;
  }

  private categorizeByDepth(relativePath: string): ExtractedComponent['category'] {
    const depth = relativePath.split('/').length;
    if (depth <= 2) return 'atoms';
    if (depth <= 3) return 'molecules';
    return 'organisms';
  }
}