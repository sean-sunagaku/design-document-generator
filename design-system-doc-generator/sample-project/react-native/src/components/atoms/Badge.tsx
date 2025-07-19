import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BadgeProps {
  /** バッジのテキスト */
  children: React.ReactNode;
  /** バッジの種類 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** バッジのサイズ */
  size?: 'small' | 'medium' | 'large';
}

/**
 * バッジコンポーネント
 * 
 * React Native版のバッジコンポーネントです。
 * ステータス表示や数値表示に使用します。
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
}) => {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  default: {
    backgroundColor: '#F3F4F6',
  },
  primary: {
    backgroundColor: '#3B82F6',
  },
  success: {
    backgroundColor: '#10B981',
  },
  warning: {
    backgroundColor: '#F59E0B',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  
  // Sizes
  sizeSmall: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sizeMedium: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sizeLarge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultText: {
    color: '#374151',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  successText: {
    color: '#FFFFFF',
  },
  warningText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});