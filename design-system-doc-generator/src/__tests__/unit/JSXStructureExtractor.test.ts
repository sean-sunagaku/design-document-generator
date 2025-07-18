import { JSXStructureExtractor } from '../../extractors/ast/JSXStructureExtractor';

// Mock TypeScript ESLint
const mockParseAndGenerateServices = jest.fn();
jest.mock('@typescript-eslint/typescript-estree', () => ({
  parseAndGenerateServices: mockParseAndGenerateServices,
}));

describe('JSXStructureExtractor', () => {
  let extractor: JSXStructureExtractor;

  beforeEach(() => {
    extractor = new JSXStructureExtractor();
  });

  describe('extractJSXStructure', () => {
    it('should extract simple JSX structure from AST', () => {
      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'SimpleComponent' },
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'JSXElement',
                    openingElement: {
                      type: 'JSXOpeningElement',
                      name: { type: 'JSXIdentifier', name: 'div' },
                      attributes: [
                        {
                          type: 'JSXAttribute',
                          name: { type: 'JSXIdentifier', name: 'className' },
                          value: { type: 'Literal', value: 'bg-blue-500 p-4' }
                        }
                      ]
                    },
                    children: [
                      {
                        type: 'JSXElement',
                        openingElement: {
                          type: 'JSXOpeningElement',
                          name: { type: 'JSXIdentifier', name: 'h1' },
                          attributes: []
                        },
                        children: [
                          {
                            type: 'JSXText',
                            value: 'Hello World'
                          }
                        ],
                        closingElement: {
                          type: 'JSXClosingElement',
                          name: { type: 'JSXIdentifier', name: 'h1' }
                        }
                      }
                    ],
                    closingElement: {
                      type: 'JSXClosingElement',
                      name: { type: 'JSXIdentifier', name: 'div' }
                    }
                  }
                }
              ]
            }
          }
        ]
      };

      const result = extractor.extractJSXStructure(mockAst);
      
      expect(result).not.toBeNull();
      expect(result!.type).toBe('div');
      expect(result!.className).toBe('bg-blue-500 p-4');
      expect(result!.tailwindClasses).toContain('bg-blue-500');
      expect(result!.tailwindClasses).toContain('p-4');
      expect(result!.children).toHaveLength(1);
      
      const h1Element = result!.children![0];
      expect(typeof h1Element).toBe('object');
      expect((h1Element as any).type).toBe('h1');
    });

    it('should handle JSX fragments', () => {
      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'FragmentComponent' },
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'JSXFragment',
                    children: [
                      {
                        type: 'JSXElement',
                        openingElement: {
                          type: 'JSXOpeningElement',
                          name: { type: 'JSXIdentifier', name: 'h1' },
                          attributes: []
                        },
                        children: [{ type: 'JSXText', value: 'Title' }],
                        closingElement: {
                          type: 'JSXClosingElement',
                          name: { type: 'JSXIdentifier', name: 'h1' }
                        }
                      },
                      {
                        type: 'JSXElement',
                        openingElement: {
                          type: 'JSXOpeningElement',
                          name: { type: 'JSXIdentifier', name: 'p' },
                          attributes: []
                        },
                        children: [{ type: 'JSXText', value: 'Content' }],
                        closingElement: {
                          type: 'JSXClosingElement',
                          name: { type: 'JSXIdentifier', name: 'p' }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };

      const result = extractor.extractJSXStructure(mockAst);
      
      expect(result).not.toBeNull();
      expect(result!.type).toBe('Fragment');
      expect(result!.children).toHaveLength(2);
    });

    it('should handle conditional rendering', () => {
      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'ConditionalComponent' },
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'ConditionalExpression',
                    test: { type: 'Identifier', name: 'showContent' },
                    consequent: {
                      type: 'JSXElement',
                      openingElement: {
                        type: 'JSXOpeningElement',
                        name: { type: 'JSXIdentifier', name: 'div' },
                        attributes: [
                          {
                            type: 'JSXAttribute',
                            name: { type: 'JSXIdentifier', name: 'className' },
                            value: { type: 'Literal', value: 'content' }
                          }
                        ]
                      },
                      children: [{ type: 'JSXText', value: 'Content' }],
                      closingElement: {
                        type: 'JSXClosingElement',
                        name: { type: 'JSXIdentifier', name: 'div' }
                      }
                    },
                    alternate: { type: 'Literal', value: null }
                  }
                }
              ]
            }
          }
        ]
      };

      const result = extractor.extractJSXStructure(mockAst);
      
      expect(result).not.toBeNull();
      expect(result!.type).toBe('div');
      expect(result!.className).toBe('content');
    });

    it('should return null when no JSX structure found', () => {
      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'NoJSXComponent' },
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: { type: 'Literal', value: 'Hello World' }
                }
              ]
            }
          }
        ]
      };

      const result = extractor.extractJSXStructure(mockAst);
      expect(result).toBeNull();
    });

    it('should handle JSX expressions', () => {
      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'ExpressionComponent' },
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'JSXExpressionContainer',
                    expression: {
                      type: 'JSXElement',
                      openingElement: {
                        type: 'JSXOpeningElement',
                        name: { type: 'JSXIdentifier', name: 'div' },
                        attributes: []
                      },
                      children: [{ type: 'JSXText', value: 'Dynamic content' }],
                      closingElement: {
                        type: 'JSXClosingElement',
                        name: { type: 'JSXIdentifier', name: 'div' }
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      };

      const result = extractor.extractJSXStructure(mockAst);
      
      expect(result).not.toBeNull();
      expect(result!.type).toBe('div');
    });
  });
});