import { ExtractedComponent, ComponentInfo } from '../../types';
import { ASTUtils } from './ASTUtils';

export class ComponentUtils {
  static inferComponentType(filePath: string, componentName: string): ExtractedComponent['category'] {
    const fileName = filePath.toLowerCase();
    const compName = componentName.toLowerCase();
    
    // Path-based detection
    if (fileName.includes('/atoms/') || fileName.includes('/atom/')) return 'atoms';
    if (fileName.includes('/molecules/') || fileName.includes('/molecule/')) return 'molecules';
    if (fileName.includes('/organisms/') || fileName.includes('/organism/')) return 'organisms';
    if (fileName.includes('/templates/') || fileName.includes('/template/')) return 'templates';
    if (fileName.includes('/pages/') || fileName.includes('/page/')) return 'pages';
    
    // Name-based detection
    if (ComponentUtils.isAtomicComponent(compName)) return 'atoms';
    if (ComponentUtils.isMolecularComponent(compName)) return 'molecules';
    if (ComponentUtils.isOrganismComponent(compName)) return 'organisms';
    if (ComponentUtils.isTemplateComponent(compName)) return 'templates';
    if (ComponentUtils.isPageComponent(compName)) return 'pages';
    
    // Default fallback
    return 'atoms';
  }

  static isAtomicComponent(name: string): boolean {
    const atomicPatterns = [
      'button', 'input', 'label', 'icon', 'badge', 'chip', 'avatar',
      'link', 'image', 'text', 'heading', 'spinner', 'divider',
      'checkbox', 'radio', 'switch', 'slider', 'progress'
    ];
    
    return atomicPatterns.some(pattern => name.includes(pattern));
  }

  static isMolecularComponent(name: string): boolean {
    const molecularPatterns = [
      'card', 'form', 'dropdown', 'modal', 'tooltip', 'popover',
      'accordion', 'tabs', 'breadcrumb', 'pagination', 'search',
      'alert', 'notification', 'dialog', 'menu', 'panel'
    ];
    
    return molecularPatterns.some(pattern => name.includes(pattern));
  }

  static isOrganismComponent(name: string): boolean {
    const organismPatterns = [
      'header', 'footer', 'navbar', 'sidebar', 'table', 'list',
      'gallery', 'carousel', 'dashboard', 'wizard', 'stepper',
      'timeline', 'calendar', 'chart', 'feed', 'toolbar'
    ];
    
    return organismPatterns.some(pattern => name.includes(pattern));
  }

  static isTemplateComponent(name: string): boolean {
    const templatePatterns = [
      'layout', 'template', 'wrapper', 'container', 'grid',
      'section', 'article', 'main', 'content', 'frame'
    ];
    
    return templatePatterns.some(pattern => name.includes(pattern));
  }

  static isPageComponent(name: string): boolean {
    const pagePatterns = [
      'page', 'view', 'screen', 'route', 'app'
    ];
    
    return pagePatterns.some(pattern => name.includes(pattern));
  }

  static analyzeComplexity(component: ExtractedComponent): {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 0;
    
    // Props complexity
    if (component.props.length > 5) {
      score += 2;
      factors.push(`多数のプロパティ (${component.props.length}個)`);
    }
    
    // Required props
    const requiredProps = component.props.filter(p => p.required).length;
    if (requiredProps > 3) {
      score += 1;
      factors.push(`多数の必須プロパティ (${requiredProps}個)`);
    }
    
    // Tailwind classes
    if (component.tailwindClasses.length > 15) {
      score += 2;
      factors.push(`多数のTailwindクラス (${component.tailwindClasses.length}個)`);
    }
    
    // Dependencies
    if (component.dependencies.length > 8) {
      score += 1;
      factors.push(`多数の依存関係 (${component.dependencies.length}個)`);
    }
    
    // JSX complexity
    if (component.jsxStructure) {
      const depth = ComponentUtils.calculateJSXDepth(component.jsxStructure);
      if (depth > 4) {
        score += 1;
        factors.push(`深いJSX構造 (深度${depth})`);
      }
    }
    
    // Responsive classes
    const responsiveClasses = component.tailwindClasses.filter(cls => 
      /^(sm|md|lg|xl|2xl):/.test(cls)
    );
    if (responsiveClasses.length > 10) {
      score += 1;
      factors.push(`多数のレスポンシブクラス (${responsiveClasses.length}個)`);
    }
    
    // State classes
    const stateClasses = component.tailwindClasses.filter(cls => 
      /^(hover|focus|active|disabled|dark):/.test(cls)
    );
    if (stateClasses.length > 5) {
      score += 1;
      factors.push(`多数の状態クラス (${stateClasses.length}個)`);
    }
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 5) level = 'high';
    else if (score >= 3) level = 'medium';
    
    return { score, level, factors };
  }

  static calculateJSXDepth(jsx: any): number {
    if (!jsx || typeof jsx !== 'object') return 0;
    
    let maxDepth = 0;
    if (jsx.children && Array.isArray(jsx.children)) {
      jsx.children.forEach((child: any) => {
        if (typeof child === 'object' && child !== null) {
          const childDepth = ComponentUtils.calculateJSXDepth(child);
          maxDepth = Math.max(maxDepth, childDepth);
        }
      });
    }
    
    return maxDepth + 1;
  }

  static findSimilarComponents(
    component: ExtractedComponent,
    allComponents: ExtractedComponent[]
  ): ExtractedComponent[] {
    const similar: ExtractedComponent[] = [];
    
    allComponents.forEach(other => {
      if (other.componentName === component.componentName) return;
      
      let similarity = 0;
      
      // Same category
      if (other.category === component.category) similarity += 2;
      
      // Similar name
      if (ComponentUtils.areNamesSimilar(component.componentName, other.componentName)) {
        similarity += 3;
      }
      
      // Similar props
      const commonProps = component.props.filter(p1 => 
        other.props.some(p2 => p1.name === p2.name)
      );
      similarity += commonProps.length * 0.5;
      
      // Similar classes
      const commonClasses = component.tailwindClasses.filter(cls => 
        other.tailwindClasses.includes(cls)
      );
      similarity += commonClasses.length * 0.1;
      
      // Similar dependencies
      const commonDeps = component.dependencies.filter(dep => 
        other.dependencies.includes(dep)
      );
      similarity += commonDeps.length * 0.3;
      
      if (similarity >= 2) {
        similar.push(other);
      }
    });
    
    return similar.sort((a, b) => {
      const aScore = ComponentUtils.calculateSimilarityScore(component, a);
      const bScore = ComponentUtils.calculateSimilarityScore(component, b);
      return bScore - aScore;
    });
  }

  private static areNamesSimilar(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();
    
    // Check if one name contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Check for common prefixes/suffixes
    const commonParts = ['button', 'input', 'form', 'card', 'modal', 'nav', 'menu'];
    for (const part of commonParts) {
      if (n1.includes(part) && n2.includes(part)) return true;
    }
    
    return false;
  }

  private static calculateSimilarityScore(
    component: ExtractedComponent,
    other: ExtractedComponent
  ): number {
    let score = 0;
    
    // Category similarity
    if (component.category === other.category) score += 2;
    
    // Props similarity
    const commonProps = component.props.filter(p1 => 
      other.props.some(p2 => p1.name === p2.name && p1.type === p2.type)
    );
    score += commonProps.length;
    
    // Classes similarity
    const commonClasses = component.tailwindClasses.filter(cls => 
      other.tailwindClasses.includes(cls)
    );
    score += commonClasses.length * 0.1;
    
    return score;
  }

  static extractComponentMetadata(component: ExtractedComponent): {
    hasChildren: boolean;
    hasEventHandlers: boolean;
    hasConditionalRendering: boolean;
    hasAnimation: boolean;
    hasResponsiveDesign: boolean;
    hasDarkMode: boolean;
    complexity: 'low' | 'medium' | 'high';
  } {
    const hasChildren = component.props.some(p => p.name === 'children');
    const hasEventHandlers = component.props.some(p => 
      p.name.startsWith('on') && p.type.includes('function')
    );
    const hasConditionalRendering = component.jsxStructure ? 
      JSON.stringify(component.jsxStructure).includes('conditional') : false;
    const hasAnimation = component.tailwindClasses.some(cls => 
      cls.startsWith('animate-') || cls.startsWith('transition')
    );
    const hasResponsiveDesign = component.tailwindClasses.some(cls => 
      /^(sm|md|lg|xl|2xl):/.test(cls)
    );
    const hasDarkMode = component.tailwindClasses.some(cls => 
      cls.startsWith('dark:')
    );
    
    const complexity = ComponentUtils.analyzeComplexity(component).level;
    
    return {
      hasChildren,
      hasEventHandlers,
      hasConditionalRendering,
      hasAnimation,
      hasResponsiveDesign,
      hasDarkMode,
      complexity
    };
  }
}