import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps { visible: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean; }

export function ConfirmModal({ visible, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconCircle, destructive && styles.iconCircleDanger]}>
            <Ionicons name={destructive ? 'trash' : 'help-circle'} size={28} color={destructive ? '#EF4444' : '#3B82F6'} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={[styles.confirmBtn, destructive && styles.confirmBtnDanger, loading && styles.btnDisabled]} onPress={onConfirm} disabled={loading}>
              <Text style={styles.confirmLabel}>{loading ? 'Loading...' : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircleDanger: { backgroundColor: '#FEF2F2' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  cancelLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6' },
  confirmBtnDanger: { backgroundColor: '#EF4444' },
  btnDisabled: { opacity: 0.5 },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
