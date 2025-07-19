import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Badge } from '../atoms/Badge';

export interface HeaderProps {
  /** ヘッダーのタイトル */
  title?: string;
  /** 左側のアクションボタン */
  leftAction?: {
    label: string;
    onPress: () => void;
  };
  /** 右側のアクションボタン */
  rightAction?: {
    label: string;
    onPress: () => void;
    badge?: number;
  };
  /** ヘッダーの背景色 */
  backgroundColor?: string;
}

/**
 * ヘッダーコンポーネント
 * 
 * React Native版のヘッダーコンポーネントです。
 * ナビゲーションバーとして使用します。
 */
export const Header: React.FC<HeaderProps> = ({
  title = 'Design System RN',
  leftAction,
  rightAction,
  backgroundColor = '#3B82F6',
}) => {
  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.content}>
          {/* Left Action */}
          <View style={styles.leftSection}>
            {leftAction && (
              <TouchableOpacity onPress={leftAction.onPress} style={styles.actionButton}>
                <Text style={styles.actionText}>{leftAction.label}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          {/* Right Action */}
          <View style={styles.rightSection}>
            {rightAction && (
              <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
                <View style={styles.rightActionContent}>
                  <Text style={styles.actionText}>{rightAction.label}</Text>
                  {rightAction.badge && rightAction.badge > 0 && (
                    <View style={styles.badgeContainer}>
                      <Badge variant="danger" size="small">
                        {rightAction.badge > 99 ? '99+' : rightAction.badge.toString()}
                      </Badge>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Safe area for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 40,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  rightActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    marginLeft: 8,
    marginTop: -2,
  },
});