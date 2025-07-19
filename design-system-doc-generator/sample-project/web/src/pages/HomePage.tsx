import React, { useState } from 'react';
import Header from '../components/organisms/Header';
import ProductList from '../components/organisms/ProductList';
import Modal from '../components/molecules/Modal';
import Button from '../components/atoms/Button';
import { Product } from '../components/organisms/ProductList';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 299.99,
    currency: '$',
    category: 'Electronics',
    inStock: true,
    rating: 4.5,
    reviews: 128,
    image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Headphones',
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Advanced fitness tracking with heart rate monitoring',
    price: 199.99,
    currency: '$',
    category: 'Wearables',
    inStock: false,
    rating: 4.2,
    reviews: 89,
    image: 'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Watch',
  },
  {
    id: '3',
    name: 'Wireless Speaker',
    description: 'Portable bluetooth speaker with 360° sound',
    price: 79.99,
    currency: '$',
    category: 'Audio',
    inStock: true,
    rating: 4.8,
    reviews: 256,
    image: 'https://via.placeholder.com/300x300/22C55E/FFFFFF?text=Speaker',
  },
  {
    id: '4',
    name: 'Laptop Stand',
    description: 'Ergonomic aluminum laptop stand for better posture',
    price: 49.99,
    currency: '$',
    category: 'Accessories',
    inStock: true,
    rating: 4.1,
    reviews: 42,
    image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Stand',
  },
  {
    id: '5',
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches',
    price: 149.99,
    currency: '$',
    category: 'Peripherals',
    inStock: true,
    rating: 4.7,
    reviews: 167,
    image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Keyboard',
  },
  {
    id: '6',
    name: 'Webcam HD',
    description: '1080p HD webcam with auto-focus and built-in microphone',
    price: 89.99,
    currency: '$',
    category: 'Electronics',
    inStock: true,
    rating: 4.3,
    reviews: 91,
    image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Webcam',
  },
];

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const navigationItems = [
    { label: 'Home', href: '/', active: true },
    { label: 'Products', href: '/products', active: false },
    { label: 'About', href: '/about', active: false },
    { label: 'Contact', href: '/contact', active: false },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <Header
        title="Tech Store"
        subtitle="Premium Electronics & Accessories"
        navigation={navigationItems}
        showNotification={true}
        notificationCount={3}
        user={{
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/32x32/3B82F6/FFFFFF?text=JD',
        }}
        actions={
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Featured Products
          </h2>
          <p className="text-lg text-secondary-600">
            Discover our latest collection of premium tech products
          </p>
        </div>
        
        <ProductList
          products={mockProducts}
          onProductClick={handleProductClick}
          showCategory={true}
          showRating={true}
          gridCols={3}
        />
      </main>
      
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedProduct?.name}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            {selectedProduct.image && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-secondary-100">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-secondary-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-lg text-secondary-600 mt-1">
                    {selectedProduct.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-secondary-900">
                    {selectedProduct.currency || '$'}{selectedProduct.price}
                  </div>
                  {selectedProduct.inStock !== undefined && (
                    <div className="mt-1">
                      {selectedProduct.inStock ? (
                        <span className="text-success-600 font-medium">In Stock</span>
                      ) : (
                        <span className="text-danger-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedProduct.rating && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < selectedProduct.rating! ? 'text-warning-400' : 'text-secondary-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-secondary-500">
                    {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                  </span>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedProduct.inStock}
                  fullWidth
                >
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}