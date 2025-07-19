import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** 入力フィールドのラベル */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** ヘルプテキスト */
  helpText?: string;
  /** 必須フィールドかどうか */
  required?: boolean;
  /** 入力フィールドのサイズ */
  size?: 'small' | 'medium' | 'large';
}

/**
 * 入力フィールドコンポーネント
 * 
 * React Native版の入力フィールドです。
 * ラベル、エラー表示、ヘルプテキストをサポートしています。
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  required = false,
  size = 'medium',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputStyle = [
    styles.input,
    styles[`${size}Input` as keyof typeof styles],
    isFocused && styles.focused,
    error && styles.error,
    props.editable === false && styles.disabled,
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TextInput
        {...props}
        style={inputStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="#9CA3AF"
        accessibilityLabel={label}
        accessibilityRequired={required}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  smallInput: {
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 36,
  },
  mediumInput: {
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  largeInput: {
    paddingVertical: 16,
    fontSize: 18,
    minHeight: 52,
  },
  focused: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  error: {
    borderColor: '#EF4444',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});