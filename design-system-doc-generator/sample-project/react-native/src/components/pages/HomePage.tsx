import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ProductList, Product } from '../organisms/ProductList';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Modal } from '../molecules/Modal';

/**
 * ホームページコンポーネント
 * 
 * React Native版のホームページです。
 * 商品リストや検索機能を含みます。
 */
export const HomePage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // サンプル商品データ
  const products: Product[] = [
    {
      id: '1',
      name: 'React Native スターターキット',
      price: 2980,
      category: 'Development',
      inStock: true,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'TypeScript 実践ガイド',
      price: 3500,
      category: 'Books',
      inStock: true,
      rating: 4.6,
    },
    {
      id: '3',
      name: 'デザインシステム テンプレート',
      price: 1500,
      category: 'Design',
      inStock: false,
      rating: 4.9,
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductPress = (product: Product) => {
    console.log('Product pressed:', product.name);
  };

  const handleAddToCart = (product: Product) => {
    console.log('Added to cart:', product.name);
    setIsModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>おすすめ商品</Text>
        <Text style={styles.subtitle}>
          React Nativeで作られたデザインシステムのサンプルです
        </Text>
      </View>

      <View style={styles.searchSection}>
        <Input
          placeholder="商品を検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          size="medium"
        />
      </View>

      <ProductList
        products={filteredProducts}
        onProductPress={handleProductPress}
        onAddToCart={handleAddToCart}
      />

      <Modal
        visible={isModalVisible}
        title="カートに追加しました"
        onClose={() => setIsModalVisible(false)}
        actionButtonText="カートを見る"
        onAction={() => {
          setIsModalVisible(false);
          console.log('Navigate to cart');
        }}
      >
        <Text style={styles.modalText}>
          商品がカートに追加されました。
          ショッピングを続けるか、カートで確認してください。
        </Text>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'center',
  },
});