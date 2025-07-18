import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import {
  ensureDirectoryExists,
  readJsonFile,
  writeJsonFile,
  fileExists,
  findFiles,
  getRelativePath,
  getFileExtension,
  isReactComponent,
} from '../../utils/fileUtils';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

// Mock glob
jest.mock('glob', () => ({
  glob: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn(),
  relative: jest.fn(),
  extname: jest.fn(),
}));

describe('fileUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);

      await ensureDirectoryExists('/test/path');

      expect(fs.promises.mkdir).toHaveBeenCalledWith('/test/path', { recursive: true });
    });

    it('should handle errors when creating directory', async () => {
      const error = new Error('Permission denied');
      (fs.promises.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(ensureDirectoryExists('/test/path')).rejects.toThrow('Permission denied');
    });
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file', async () => {
      const mockData = { name: 'test', version: '1.0.0' };
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await readJsonFile<typeof mockData>('/test/file.json');

      expect(fs.promises.readFile).toHaveBeenCalledWith('/test/file.json', 'utf-8');
      expect(result).toEqual(mockData);
    });

    it('should throw error for invalid JSON', async () => {
      (fs.promises.readFile as jest.Mock).mockResolvedValue('invalid json');

      await expect(readJsonFile('/test/file.json')).rejects.toThrow('Failed to read JSON file');
    });

    it('should throw error for file read failure', async () => {
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(readJsonFile('/test/file.json')).rejects.toThrow('Failed to read JSON file');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON file with proper formatting', async () => {
      const mockData = { name: 'test', version: '1.0.0' };
      (path.dirname as jest.Mock).mockReturnValue('/test');
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await writeJsonFile('/test/file.json', mockData);

      expect(fs.promises.mkdir).toHaveBeenCalledWith('/test', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        '/test/file.json',
        JSON.stringify(mockData, null, 2),
        'utf-8'
      );
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await fileExists('/test/file.txt');

      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return false if file does not exist', async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await fileExists('/test/file.txt');

      expect(result).toBe(false);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const mockFiles = ['/test/file1.tsx', '/test/file2.tsx'];
      (glob as jest.Mock).mockResolvedValue(mockFiles);

      const result = await findFiles('**/*.tsx');

      expect(glob).toHaveBeenCalledWith('**/*.tsx', undefined);
      expect(result).toEqual(mockFiles);
    });

    it('should pass options to glob', async () => {
      const mockFiles = ['/test/file1.tsx'];
      const options = { ignore: ['**/*.test.tsx'] };
      (glob as jest.Mock).mockResolvedValue(mockFiles);

      const result = await findFiles('**/*.tsx', options);

      expect(glob).toHaveBeenCalledWith('**/*.tsx', options);
      expect(result).toEqual(mockFiles);
    });
  });

  describe('getRelativePath', () => {
    it('should return relative path', () => {
      (path.relative as jest.Mock).mockReturnValue('components/Button.tsx');

      const result = getRelativePath('/project/src', '/project/src/components/Button.tsx');

      expect(path.relative).toHaveBeenCalledWith('/project/src', '/project/src/components/Button.tsx');
      expect(result).toBe('components/Button.tsx');
    });
  });

  describe('getFileExtension', () => {
    it('should return lowercase file extension', () => {
      (path.extname as jest.Mock).mockReturnValue('.TSX');

      const result = getFileExtension('/test/file.TSX');

      expect(path.extname).toHaveBeenCalledWith('/test/file.TSX');
      expect(result).toBe('.tsx');
    });

    it('should return empty string for files without extension', () => {
      (path.extname as jest.Mock).mockReturnValue('');

      const result = getFileExtension('/test/file');

      expect(result).toBe('');
    });
  });

  describe('isReactComponent', () => {
    beforeEach(() => {
      // Reset path.extname mock for each test
      (path.extname as jest.Mock).mockReset();
    });

    it('should return true for .tsx files', () => {
      (path.extname as jest.Mock).mockReturnValue('.tsx');

      const result = isReactComponent('/test/Button.tsx');

      expect(result).toBe(true);
    });

    it('should return true for .jsx files', () => {
      (path.extname as jest.Mock).mockReturnValue('.jsx');

      const result = isReactComponent('/test/Button.jsx');

      expect(result).toBe(true);
    });

    it('should return false for test files', () => {
      (path.extname as jest.Mock).mockReturnValue('.tsx');

      const result = isReactComponent('/test/Button.test.tsx');

      expect(result).toBe(false);
    });

    it('should return false for spec files', () => {
      (path.extname as jest.Mock).mockReturnValue('.tsx');

      const result = isReactComponent('/test/Button.spec.tsx');

      expect(result).toBe(false);
    });

    it('should return false for non-React files', () => {
      (path.extname as jest.Mock).mockReturnValue('.ts');

      const result = isReactComponent('/test/utils.ts');

      expect(result).toBe(false);
    });

    it('should return false for files with other extensions', () => {
      (path.extname as jest.Mock).mockReturnValue('.css');

      const result = isReactComponent('/test/styles.css');

      expect(result).toBe(false);
    });
  });
});