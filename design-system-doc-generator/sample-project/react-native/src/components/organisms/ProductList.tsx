import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../molecules/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  rating: number;
}

export interface ProductListProps {
  /** 商品のリスト */
  products: Product[];
  /** 商品がタップされた時のハンドラ */
  onProductPress?: (product: Product) => void;
  /** カートに追加ボタンがタップされた時のハンドラ */
  onAddToCart?: (product: Product) => void;
  /** リストのヘッダー */
  header?: React.ReactNode;
  /** 空の状態の表示 */
  emptyState?: React.ReactNode;
}

/**
 * 商品リストコンポーネント
 * 
 * React Native版の商品リストコンポーネントです。
 * FlatListを使用してパフォーマンスの良いリスト表示を実現します。
 */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  onProductPress,
  onAddToCart,
  header,
  emptyState,
}) => {
  const renderProduct = ({ item }: { item: Product }) => {
    const handlePress = () => onProductPress?.(item);
    const handleAddToCart = () => onAddToCart?.(item);

    return (
      <Card onPress={handlePress} elevation="small">
        <View style={styles.productContent}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>
            
            <View style={styles.stockBadge}>
              <Badge
                variant={item.inStock ? 'success' : 'danger'}
                size="small"
              >
                {item.inStock ? '在庫あり' : '在庫なし'}
              </Badge>
            </View>
          </View>
          
          <View style={styles.productDetails}>
            <View style={styles.priceSection}>
              <Text style={styles.price}>
                ¥{item.price.toLocaleString()}
              </Text>
              <View style={styles.rating}>
                <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
              </View>
            </View>
            
            <Button
              variant="primary"
              size="small"
              onPress={handleAddToCart}
              disabled={!item.inStock}
            >
              カートに追加
            </Button>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (emptyState) {
      return <View style={styles.emptyContainer}>{emptyState}</View>;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>商品が見つかりませんでした</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  productContent: {
    padding: 0, // Card already has padding
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockBadge: {
    alignSelf: 'flex-start',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSection: {
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});