import { TailwindUtils } from '../../../utils/ast/TailwindUtils';

describe('TailwindUtils', () => {
  describe('isTailwindClass', () => {
    it('should identify layout classes', () => {
      expect(TailwindUtils.isTailwindClass('block')).toBe(true);
      expect(TailwindUtils.isTailwindClass('flex')).toBe(true);
      expect(TailwindUtils.isTailwindClass('grid')).toBe(true);
      expect(TailwindUtils.isTailwindClass('absolute')).toBe(true);
      expect(TailwindUtils.isTailwindClass('relative')).toBe(true);
    });

    it('should identify spacing classes', () => {
      expect(TailwindUtils.isTailwindClass('p-4')).toBe(true);
      expect(TailwindUtils.isTailwindClass('m-2')).toBe(true);
      expect(TailwindUtils.isTailwindClass('px-6')).toBe(true);
      expect(TailwindUtils.isTailwindClass('my-8')).toBe(true);
    });

    it('should identify color classes', () => {
      expect(TailwindUtils.isTailwindClass('bg-blue-500')).toBe(true);
      expect(TailwindUtils.isTailwindClass('text-white')).toBe(true);
      expect(TailwindUtils.isTailwindClass('border-red-300')).toBe(true);
    });

    it('should identify responsive classes', () => {
      expect(TailwindUtils.isTailwindClass('sm:p-4')).toBe(true);
      expect(TailwindUtils.isTailwindClass('md:text-lg')).toBe(true);
      expect(TailwindUtils.isTailwindClass('lg:w-full')).toBe(true);
      expect(TailwindUtils.isTailwindClass('xl:grid-cols-4')).toBe(true);
    });

    it('should identify state classes', () => {
      expect(TailwindUtils.isTailwindClass('hover:bg-blue-600')).toBe(true);
      expect(TailwindUtils.isTailwindClass('focus:ring-2')).toBe(true);
      expect(TailwindUtils.isTailwindClass('active:bg-blue-700')).toBe(true);
      expect(TailwindUtils.isTailwindClass('disabled:opacity-50')).toBe(true);
      expect(TailwindUtils.isTailwindClass('dark:bg-gray-800')).toBe(true);
    });

    it('should reject non-Tailwind classes', () => {
      expect(TailwindUtils.isTailwindClass('custom-class')).toBe(false);
      expect(TailwindUtils.isTailwindClass('my-component')).toBe(false);
      expect(TailwindUtils.isTailwindClass('some-style')).toBe(false);
    });
  });

  describe('categorizeClasses', () => {
    it('should categorize classes correctly', () => {
      const classes = [
        'flex', 'p-4', 'text-lg', 'bg-blue-500', 'border', 'shadow-md',
        'cursor-pointer', 'sm:p-6', 'hover:bg-blue-600', 'animate-pulse'
      ];

      const categorized = TailwindUtils.categorizeClasses(classes);

      expect(categorized.layout).toContain('flex');
      expect(categorized.spacing).toContain('p-4');
      expect(categorized.typography).toContain('text-lg');
      expect(categorized.colors).toContain('bg-blue-500');
      expect(categorized.borders).toContain('border');
      expect(categorized.effects).toContain('shadow-md');
      expect(categorized.interactivity).toContain('cursor-pointer');
      expect(categorized.responsive).toContain('sm:p-6');
      expect(categorized.states).toContain('hover:bg-blue-600');
      expect(categorized.animations).toContain('animate-pulse');
    });
  });

  describe('getBreakpointFromClass', () => {
    it('should extract breakpoints from responsive classes', () => {
      expect(TailwindUtils.getBreakpointFromClass('sm:p-4')).toBe('sm');
      expect(TailwindUtils.getBreakpointFromClass('md:text-lg')).toBe('md');
      expect(TailwindUtils.getBreakpointFromClass('lg:w-full')).toBe('lg');
      expect(TailwindUtils.getBreakpointFromClass('xl:grid-cols-4')).toBe('xl');
      expect(TailwindUtils.getBreakpointFromClass('2xl:container')).toBe('2xl');
    });

    it('should return null for non-responsive classes', () => {
      expect(TailwindUtils.getBreakpointFromClass('p-4')).toBeNull();
      expect(TailwindUtils.getBreakpointFromClass('hover:bg-blue-600')).toBeNull();
    });
  });

  describe('getStateFromClass', () => {
    it('should extract states from state classes', () => {
      expect(TailwindUtils.getStateFromClass('hover:bg-blue-600')).toBe('hover');
      expect(TailwindUtils.getStateFromClass('focus:ring-2')).toBe('focus');
      expect(TailwindUtils.getStateFromClass('active:bg-blue-700')).toBe('active');
      expect(TailwindUtils.getStateFromClass('disabled:opacity-50')).toBe('disabled');
      expect(TailwindUtils.getStateFromClass('dark:bg-gray-800')).toBe('dark');
    });

    it('should return null for non-state classes', () => {
      expect(TailwindUtils.getStateFromClass('p-4')).toBeNull();
      expect(TailwindUtils.getStateFromClass('sm:p-6')).toBeNull();
    });
  });

  describe('hasResponsiveVariants', () => {
    it('should detect responsive variants', () => {
      expect(TailwindUtils.hasResponsiveVariants(['p-4', 'sm:p-6'])).toBe(true);
      expect(TailwindUtils.hasResponsiveVariants(['md:text-lg', 'lg:text-xl'])).toBe(true);
      expect(TailwindUtils.hasResponsiveVariants(['p-4', 'text-lg'])).toBe(false);
    });
  });

  describe('hasDarkModeVariants', () => {
    it('should detect dark mode variants', () => {
      expect(TailwindUtils.hasDarkModeVariants(['bg-white', 'dark:bg-gray-800'])).toBe(true);
      expect(TailwindUtils.hasDarkModeVariants(['text-black', 'dark:text-white'])).toBe(true);
      expect(TailwindUtils.hasDarkModeVariants(['bg-white', 'text-black'])).toBe(false);
    });
  });

  describe('hasAnimations', () => {
    it('should detect animation classes', () => {
      expect(TailwindUtils.hasAnimations(['animate-pulse', 'transition-colors'])).toBe(true);
      expect(TailwindUtils.hasAnimations(['duration-200', 'ease-in-out'])).toBe(true);
      expect(TailwindUtils.hasAnimations(['bg-blue-500', 'text-white'])).toBe(false);
    });
  });

  describe('sortClasses', () => {
    it('should sort classes by category', () => {
      const classes = [
        'hover:bg-blue-600', 'p-4', 'flex', 'text-lg', 'bg-blue-500',
        'border', 'shadow-md', 'sm:p-6', 'animate-pulse'
      ];

      const sorted = TailwindUtils.sortClasses(classes);

      // Layout should come first
      expect(sorted.indexOf('flex')).toBeLessThan(sorted.indexOf('p-4'));
      // Spacing should come before typography
      expect(sorted.indexOf('p-4')).toBeLessThan(sorted.indexOf('text-lg'));
      // States should come later
      expect(sorted.indexOf('text-lg')).toBeLessThan(sorted.indexOf('hover:bg-blue-600'));
    });
  });

  describe('groupSimilarClasses', () => {
    it('should group classes by prefix', () => {
      const classes = ['bg-blue-500', 'bg-red-600', 'text-white', 'text-black', 'p-4', 'px-6'];
      const grouped = TailwindUtils.groupSimilarClasses(classes);

      expect(grouped.get('bg')).toEqual(['bg-blue-500', 'bg-red-600']);
      expect(grouped.get('text')).toEqual(['text-white', 'text-black']);
      expect(grouped.get('p')).toEqual(['p-4']);
      expect(grouped.get('px')).toEqual(['px-6']);
    });
  });
});