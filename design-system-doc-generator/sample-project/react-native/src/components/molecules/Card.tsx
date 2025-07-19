import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface CardProps {
  /** カードのタイトル */
  title?: string;
  /** カードの内容 */
  children: React.ReactNode;
  /** フッター部分 */
  footer?: React.ReactNode;
  /** カードがタップ可能かどうか */
  onPress?: () => void;
  /** カードの影の強さ */
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

/**
 * カードコンポーネント
 * 
 * React Native版のカードコンポーネントです。
 * 情報をグループ化して表示するために使用します。
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  onPress,
  elevation = 'small',
}) => {
  const containerStyle = [
    styles.base,
    styles[`elevation${elevation.charAt(0).toUpperCase() + elevation.slice(1)}` as keyof typeof styles],
  ];

  const CardContent = (
    <View style={containerStyle}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        {children}
      </View>
      
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  
  // Elevation styles
  elevationNone: {
    shadowOpacity: 0,
    elevation: 0,
  },
  elevationSmall: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  elevationMedium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  elevationLarge: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});