import { StyleConverter } from '../../utils/StyleConverter';

describe('StyleConverter', () => {
  let converter: StyleConverter;

  beforeEach(() => {
    converter = new StyleConverter();
  });

  describe('tailwindToStyleSheet', () => {
    it('should convert basic Tailwind classes to React Native StyleSheet', () => {
      const tailwindClasses = ['p-4', 'bg-blue-500', 'text-white', 'rounded-lg'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.success).toBe(true);
      expect(result.converted.container).toEqual({
        padding: 16,
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        borderRadius: 8
      });
      expect(result.warnings).toHaveLength(0);
      expect(result.unmappedProperties).toHaveLength(0);
    });

    it('should handle dynamic padding classes', () => {
      const tailwindClasses = ['px-2', 'py-3', 'pt-1'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.success).toBe(true);
      expect(result.converted.container).toEqual({
        paddingHorizontal: 8,
        paddingVertical: 12,
        paddingTop: 4
      });
    });

    it('should handle flex layout classes', () => {
      const tailwindClasses = ['flex', 'flex-1', 'items-center', 'justify-between'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.success).toBe(true);
      expect(result.converted.container).toEqual({
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between'
      });
    });

    it('should warn about responsive classes', () => {
      const tailwindClasses = ['p-4', 'md:p-6'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('manual_review');
      expect(result.warnings[0].message).toContain('Responsive breakpoints');
    });

    it('should warn about dark mode classes', () => {
      const tailwindClasses = ['bg-white', 'dark:bg-black'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('manual_review');
      expect(result.warnings[0].message).toContain('Dark mode styling');
    });

    it('should mark unmapped classes', () => {
      const tailwindClasses = ['p-4', 'custom-unknown-class'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.success).toBe(false);
      expect(result.unmappedProperties).toContain('custom-unknown-class');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('unsupported');
    });
  });

  describe('styleSheetToTailwind', () => {
    it('should convert React Native StyleSheet to Tailwind classes', () => {
      const styleSheet = {
        padding: 16,
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        borderRadius: 8
      };
      const result = converter.styleSheetToTailwind(styleSheet);

      expect(result.success).toBe(true);
      expect(result.converted).toEqual(['p-4', 'bg-blue-500', 'text-white', 'rounded-lg']);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle flex properties', () => {
      const styleSheet = {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between'
      };
      const result = converter.styleSheetToTailwind(styleSheet);

      expect(result.success).toBe(true);
      expect(result.converted).toEqual(['flex', 'flex-1', 'items-center', 'justify-between']);
    });

    it('should handle individual margin/padding', () => {
      const styleSheet = {
        paddingTop: 8,
        paddingHorizontal: 16,
        marginBottom: 12
      };
      const result = converter.styleSheetToTailwind(styleSheet);

      expect(result.success).toBe(true);
      expect(result.converted).toEqual(['pt-2', 'px-4', 'mb-3']);
    });

    it('should mark unmapped properties', () => {
      const styleSheet = {
        padding: 16,
        shadowOpacity: 0.5, // React Native specific
        elevation: 3 // React Native specific
      };
      const result = converter.styleSheetToTailwind(styleSheet);

      expect(result.success).toBe(false);
      expect(result.unmappedProperties).toContain('shadowOpacity: 0.5');
      expect(result.unmappedProperties).toContain('elevation: 3');
    });

    it('should approximate non-standard values', () => {
      const styleSheet = {
        fontSize: 22 // Not a standard Tailwind size
      };
      const result = converter.styleSheetToTailwind(styleSheet);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('approximation');
      expect(result.warnings[0].message).toContain('Approximate conversion');
    });
  });

  describe('checkCrossPlatformCompatibility', () => {
    it('should detect Web to React Native compatibility issues', () => {
      const webStyles = 'box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;';
      const result = converter.checkCrossPlatformCompatibility(webStyles, 'web', 'react-native');

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('CSS property \'box-shadow\' is not supported in React Native');
      expect(result.issues).toContain('CSS property \'cursor\' is not supported in React Native');
      expect(result.suggestions).toContain('Replace box-shadow with shadowColor, shadowOffset, shadowOpacity, shadowRadius');
    });

    it('should detect React Native to Web compatibility issues', () => {
      const rnStyles = {
        paddingHorizontal: 16,
        paddingVertical: 8,
        elevation: 3
      };
      const result = converter.checkCrossPlatformCompatibility(rnStyles, 'react-native', 'web');

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('React Native property \'paddingHorizontal\' needs manual conversion for web');
      expect(result.suggestions).toContain('Replace paddingHorizontal/paddingVertical with padding-left/right or padding-top/bottom');
    });

    it('should return compatible for compatible styles', () => {
      const styles = {
        padding: 16,
        backgroundColor: '#3B82F6',
        color: '#FFFFFF'
      };
      const result = converter.checkCrossPlatformCompatibility(styles, 'web', 'react-native');

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('color conversion', () => {
    it('should convert Tailwind color classes correctly', () => {
      const tailwindClasses = ['bg-red-500', 'text-green-600', 'border-blue-400'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.success).toBe(true);
      expect(result.converted.container.backgroundColor).toBe('#EF4444');
      expect(result.converted.container.color).toBe('#16A34A');
      expect(result.converted.container.borderColor).toBe('#60A5FA');
    });
  });

  describe('size conversion', () => {
    it('should convert size values correctly', () => {
      const tailwindClasses = ['w-full', 'h-auto', 'w-64'];
      const result = converter.tailwindToStyleSheet(tailwindClasses);

      expect(result.converted.container.width).toBe('100%');
      expect(result.converted.container.height).toBe('auto');
      // w-64 should convert to 256 (64 * 4)
      expect(result.converted.container.width).toBe(256);
    });
  });
});