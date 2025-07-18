import { generateHash, generateComponentId } from '../../utils/hash';

describe('hash utilities', () => {
  describe('generateHash', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = generateHash(content);
      const hash2 = generateHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    it('should generate different hashes for different content', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const hash1 = generateHash(content1);
      const hash2 = generateHash(content2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash for empty content', () => {
      const hash = generateHash('');
      expect(hash).toHaveLength(8);
      expect(typeof hash).toBe('string');
    });

    it('should generate hash for long content', () => {
      const longContent = 'a'.repeat(10000);
      const hash = generateHash(longContent);
      expect(hash).toHaveLength(8);
      expect(typeof hash).toBe('string');
    });
  });

  describe('generateComponentId', () => {
    it('should generate component ID from category and name', () => {
      const id = generateComponentId('atoms', 'Button');
      expect(id).toBe('atoms-button');
    });

    it('should convert to lowercase', () => {
      const id = generateComponentId('MOLECULES', 'FormField');
      expect(id).toBe('molecules-formfield');
    });

    it('should replace spaces with hyphens', () => {
      const id = generateComponentId('atoms', 'Icon Button');
      expect(id).toBe('atoms-icon-button');
    });

    it('should handle multiple spaces', () => {
      const id = generateComponentId('molecules', 'Modal   Dialog   Box');
      expect(id).toBe('molecules-modal-dialog-box');
    });

    it('should handle empty strings', () => {
      const id = generateComponentId('', '');
      expect(id).toBe('-');
    });

    it('should handle special characters', () => {
      const id = generateComponentId('atoms', 'Button_Component');
      expect(id).toBe('atoms-button_component');
    });
  });
});