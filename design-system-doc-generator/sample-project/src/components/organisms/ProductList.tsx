import React from 'react';
import { clsx } from 'clsx';
import Card from '../molecules/Card';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  category?: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
}

export interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  showCategory?: boolean;
  showRating?: boolean;
  gridCols?: 1 | 2 | 3 | 4;
}

export default function ProductList({
  products,
  loading = false,
  onProductClick,
  showCategory = true,
  showRating = true,
  gridCols = 3,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="space-y-4">
              <div className="bg-secondary-200 h-48 rounded-lg"></div>
              <div className="space-y-2">
                <div className="bg-secondary-200 h-4 rounded w-3/4"></div>
                <div className="bg-secondary-200 h-4 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={clsx('grid gap-6', gridClasses[gridCols])}>
      {products.map((product) => (
        <Card 
          key={product.id}
          hoverable={!!onProductClick}
          className="flex flex-col h-full"
        >
          {/* Product Image */}
          {product.image && (
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-secondary-100 mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center group-hover:opacity-75"
              />
            </div>
          )}
          
          {/* Product Info */}
          <div className="flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-secondary-900 line-clamp-2">
                  {product.name}
                </h3>
                {showCategory && product.category && (
                  <Badge variant="secondary" size="sm">
                    {product.category}
                  </Badge>
                )}
              </div>
              
              {product.description && (
                <p className="text-sm text-secondary-600 line-clamp-3">
                  {product.description}
                </p>
              )}
              
              {showRating && product.rating && (
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={clsx(
                          'w-4 h-4',
                          i < product.rating! ? 'text-warning-400' : 'text-secondary-300'
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {product.reviews && (
                    <span className="text-sm text-secondary-500">
                      ({product.reviews})
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Price and Action */}
            <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-secondary-900">
                  {product.currency || '$'}{product.price}
                </span>
                {product.inStock !== undefined && (
                  <Badge 
                    variant={product.inStock ? 'success' : 'danger'}
                    size="sm"
                  >
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                )}
              </div>
              
              {onProductClick && (
                <Button
                  size="sm"
                  onClick={() => onProductClick(product)}
                  disabled={product.inStock === false}
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}