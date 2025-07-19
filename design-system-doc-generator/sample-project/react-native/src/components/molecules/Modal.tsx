import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../atoms/Button';

export interface ModalProps {
  /** モーダルの表示状態 */
  visible: boolean;
  /** モーダルのタイトル */
  title?: string;
  /** モーダルの内容 */
  children: React.ReactNode;
  /** 閉じるボタンのテキスト */
  closeButtonText?: string;
  /** アクションボタンのテキスト */
  actionButtonText?: string;
  /** モーダルを閉じる時のハンドラ */
  onClose: () => void;
  /** アクションボタンを押した時のハンドラ */
  onAction?: () => void;
  /** モーダルのサイズ */
  size?: 'small' | 'medium' | 'large';
}

/**
 * モーダルコンポーネント
 * 
 * React Native版のモーダルコンポーネントです。
 * ダイアログやフォームの表示に使用します。
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  children,
  closeButtonText = 'キャンセル',
  actionButtonText,
  onClose,
  onAction,
  size = 'medium',
}) => {
  const modalStyle = [
    styles.modal,
    styles[`${size}Modal` as keyof typeof styles],
  ];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={modalStyle}>
            <TouchableOpacity activeOpacity={1}>
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
              
              <View style={styles.footer}>
                <Button
                  variant="secondary"
                  size="medium"
                  onPress={onClose}
                >
                  {closeButtonText}
                </Button>
                
                {actionButtonText && onAction && (
                  <Button
                    variant="primary"
                    size="medium"
                    onPress={onAction}
                    style={styles.actionButton}
                  >
                    {actionButtonText}
                  </Button>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  smallModal: {
    width: '80%',
  },
  mediumModal: {
    width: '90%',
  },
  largeModal: {
    width: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    marginLeft: 12,
  },
});