import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
  Modal, View, Animated, TouchableWithoutFeedback, StyleSheet, Dimensions,
  Text, TouchableOpacity,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface AppBottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface Props {
  children: React.ReactNode;
  snapPoints?: string[];
  title?: string;
  headerAction?: React.ReactNode;
  onHeaderClose?: () => void;
  onClose?: () => void;
  index?: number;
  enablePanDownToClose?: boolean;
  backgroundStyle?: object;
  handleIndicatorStyle?: object;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  ({ children, snapPoints = ['50%'], title, headerAction, onHeaderClose, onClose }, ref) => {
    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const sheetHeight = SCREEN_HEIGHT * (parseInt(snapPoints[0]) / 100);

    const show = () => {
      setVisible(true);
      slideAnim.setValue(sheetHeight);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    };

    const hide = () => {
      Animated.timing(slideAnim, { toValue: sheetHeight, duration: 220, useNativeDriver: true }).start(() => {
        setVisible(false);
        onClose?.();
      });
    };

    useImperativeHandle(ref, () => ({ expand: show, close: hide }));

    return (
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={hide}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={hide}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            {title && (
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.headerActions}>
                  {headerAction}
                  <TouchableOpacity onPress={onHeaderClose ?? hide} style={styles.closeBtn}>
                    <X size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {children}
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppBottomSheet;
