import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface ButtonProps {
  /** ボタンのテキスト */
  children: React.ReactNode;
  /** ボタンの種類 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** ボタンのサイズ */
  size?: 'small' | 'medium' | 'large';
  /** 非活性状態 */
  disabled?: boolean;
  /** クリック時のハンドラ */
  onPress?: () => void;
  /** アクセシビリティラベル */
  accessibilityLabel?: string;
}

/**
 * ボタンコンポーネント
 * 
 * React Native版のボタンコンポーネントです。
 * TouchableOpacityとStyleSheetを使用してスタイリングされています。
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onPress,
  accessibilityLabel,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility friendly touch target
  },
  
  // Variants
  primary: {
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondary: {
    backgroundColor: '#6B7280',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  
  // Sizes
  sizeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  sizeMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  sizeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});