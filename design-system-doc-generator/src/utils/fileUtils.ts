import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
  }
}

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  const dirPath = path.dirname(filePath);
  await ensureDirectoryExists(dirPath);
  
  const content = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findFiles(pattern: string, options?: any): Promise<string[]> {
  return glob(pattern, options);
}

export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function isReactComponent(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ['.tsx', '.jsx'].includes(ext) && !filePath.includes('.test.') && !filePath.includes('.spec.');
}