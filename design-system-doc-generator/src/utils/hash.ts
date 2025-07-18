import * as crypto from 'crypto';

export function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

export function generateComponentId(category: string, componentName: string): string {
  return `${category}-${componentName}`.toLowerCase().replace(/\s+/g, '-');
}