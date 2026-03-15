import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';

export interface ActionSheetOption { label: string; onPress: () => void; destructive?: boolean; }

interface ActionSheetProps { visible: boolean; onClose: () => void; title?: string; options: ActionSheetOption[]; }

export function ActionSheet({ visible, onClose, title, options }: ActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {title && <View style={styles.titleRow}><Text style={styles.title}>{title}</Text></View>}
          {options.map((opt, i) => (
            <TouchableOpacity key={i} accessibilityRole="button" style={[styles.option, i === 0 && styles.optionFirst]} onPress={() => { onClose(); opt.onPress(); }}>
              <Text style={[styles.optionLabel, opt.destructive && styles.destructive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F3F4F6', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 16, paddingTop: 8 },
  titleRow: { alignItems: 'center', paddingVertical: 12 },
  title: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  option: { backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 1, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  optionFirst: { marginTop: 8 },
  optionLabel: { fontSize: 17, color: '#3B82F6', fontWeight: '400' },
  destructive: { color: '#EF4444' },
  cancelBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 8, paddingVertical: 16, alignItems: 'center' },
  cancelLabel: { fontSize: 17, color: '#111827', fontWeight: '600' },
});
