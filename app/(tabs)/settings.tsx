import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Switch, Linking, Modal, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { signOut, deleteAccount } from '@/lib/auth';
import { router } from 'expo-router';
import { isBiometricAvailable, getBiometricType, setBiometricEnabled, isBiometricEnabled } from '@/lib/biometrics';
import { shareContent } from '@/lib/share';
import LanguagePicker from '@/components/LanguagePicker';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';

import { NotificationPreferences } from '@/components/NotificationPreferences';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const { user, setSession, setUser } = useAuthStore();
  const uname = user?.email?.split('@')[0] ?? 'User';

  const MENU = [
    { icon: 'notifications-outline', label: t('settings.notifications'), value: t('settings.notificationsOn') },
    { icon: 'lock-closed-outline', label: t('settings.changePassword'), value: '' },
    { icon: 'shield-checkmark-outline', label: t('settings.privacySecurity'), value: '' },
    { icon: 'help-circle-outline', label: t('settings.support'), value: '' },
    { icon: 'chatbubble-outline', label: t('settings.contactSupport'), value: '' },
    { icon: 'information-circle-outline', label: t('settings.aboutApp'), value: 'v1.0.0' },
    { icon: 'gift-outline', label: t('settings.referFriend'), value: '' },
  ];

  const [editVisible, setEditVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? uname);
  const [saving, setSaving] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricType, setBiometricTypeState] = useState<'face' | 'fingerprint' | 'none'>('none');

  useEffect(() => {
    async function checkBiometric() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricTypeState(type);
        const enabled = await isBiometricEnabled();
        setBiometricEnabledState(enabled);
      }
    }
    checkBiometric();
  }, []);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      if (error) showToast(error.message, 'error');
      else { showToast('Profile updated!', 'success'); setEditVisible(false); }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setBiometricEnabled(value);
    setBiometricEnabledState(value);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteForever'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (!error) {
              setSession(null);
              setUser(null);
              router.replace('/auth/login');
            } else {
              showToast('Failed to delete account. Please contact support@govpass.app', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: async () => {
        await signOut(); setSession(null); setUser(null); router.replace('/auth/login');
      }}
    ]);
  };

  const handleMenuPress = (label: string) => {
    const notificationsLabel = t('settings.notifications');
    const changePasswordLabel = t('settings.changePassword');
    const privacyLabel = t('settings.privacySecurity');
    const supportLabel = t('settings.support');
    const contactLabel = t('settings.contactSupport');
    const aboutLabel = t('settings.aboutApp');
    const referLabel = t('settings.referFriend');

    if (label === notificationsLabel) {
      setShowNotifPrefs(true);
    } else if (label === changePasswordLabel) {
      Alert.alert(
        t('settings.resetPassword'),
        t('settings.resetPasswordConfirm', { email: user?.email }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.sendLink'),
            onPress: async () => {
              try {
                await supabase.auth.resetPasswordForEmail(user?.email ?? '', {
                  redirectTo: 'govpass://auth/reset-password',
                });
                showToast(t('settings.checkInboxReset'), 'success');
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Failed to send reset link';
                showToast(message, 'error');
              }
            },
          },
        ]
      );
    } else if (label === privacyLabel) {
      Linking.openURL('https://govpass.app/privacy');
    } else if (label === supportLabel) {
      Linking.openURL('https://govpass.app/help');
    } else if (label === contactLabel) {
      Linking.openURL('mailto:support@govpass.app');
    } else if (label === aboutLabel) {
      showToast('GovPass v1.0.0 — AI-powered government document processing.', 'info');
    } else if (label === referLabel) {
      shareContent({ title: 'Join GovPass', message: 'Join me on GovPass!', url: 'https://govpass.app/?ref=USER123' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <ScrollView>
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
          <Text style={s.header}>{t('settings.title')}</Text>
          <View style={s.profileCard}>
            <View style={s.avatar}><Text style={s.avatarText}>{uname[0]?.toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{displayName || uname}</Text>
              <Text style={s.profileEmail}>{user?.email}</Text>
            </View>
            <PressableScale haptic="light" accessibilityRole="button" onPress={() => setEditVisible(true)} style={{ padding: 6 }}>
              <Ionicons name="pencil-outline" size={18} color="#1E40AF" />
            </PressableScale>
          </View>
        </Animated.View>
        <View style={s.section}>
          <LanguagePicker />
          <View style={s.menuBorder} />
          {MENU.map((item, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(200 + i * 60).duration(350)}>
              <PressableScale haptic="light" accessibilityRole="button" style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}
                onPress={() => handleMenuPress(item.label)}>
                <Ionicons name={item.icon as any} size={20} color="#1E40AF" />
                <Text style={s.menuLabel}>{item.label}</Text>
                <View style={{ flex: 1 }} />
                <Text style={s.menuVal}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </PressableScale>
            </Animated.View>
          ))}
        </View>
        {biometricAvailable && (
          <View style={s.biometricCard}>
            <View style={s.biometricLeft}>
              <Text style={s.biometricIcon}>{biometricType === 'face' ? '🔐' : '👆'}</Text>
              <View>
                <Text style={s.biometricTitle}>
                  {biometricType === 'face' ? t('settings.faceId') : t('settings.fingerprint')}
                </Text>
                <Text style={s.biometricSub}>{t('settings.quickSecureSignIn')}</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={biometricEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        )}
        <PressableScale haptic="light" accessibilityRole="button" style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={s.signOutText}>{t('settings.signOut')}</Text>
        </PressableScale>
        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>{t('settings.dangerZone')}</Text>
          <PressableScale haptic="medium" accessibilityRole="button" style={s.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={s.deleteText}>{t('settings.deleteAccount')}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    
      <NotificationPreferences visible={showNotifPrefs} onClose={() => setShowNotifPrefs(false)} />

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Edit Profile</Text>
            <Text style={s.modalLabel}>Display Name</Text>
            <TextInput
              style={s.modalInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#636366"
              autoFocus
            />
            <View style={s.modalActions}>
              <PressableScale haptic="light" accessibilityRole="button" style={s.modalCancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </PressableScale>
              <PressableScale haptic="medium" accessibilityRole="button" style={[s.modalSaveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.modalSaveText}>Save</Text>}
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={hideToast} />
      </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', padding: 20, paddingBottom: 0 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, margin: 20, padding: 16, borderRadius: 12, backgroundColor: '#0F1B35', borderWidth: 1, borderColor: '#1A2744' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1E40AF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  profileName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  section: { marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F1B35', borderWidth: 1, borderColor: '#1A2744' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#1A2744' },
  menuLabel: { fontSize: 15, color: '#FFFFFF' },
  menuVal: { color: '#94A3B8', fontSize: 14, marginRight: 8 },
  biometricCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#0F1B35', borderRadius: 12, borderWidth: 1, borderColor: '#1A2744' },
  biometricLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  biometricIcon: { fontSize: 20 },
  biometricTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  biometricSub: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 20, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF444440', backgroundColor: '#EF444410' },
  signOutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  dangerZone: { marginHorizontal: 20, marginBottom: 32, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF444430', backgroundColor: '#EF444408' },
  dangerTitle: { fontSize: 12, fontWeight: '700', color: '#EF4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteText: { color: '#EF4444', fontSize: 15, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#2C2C2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#48484A', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#EBEBF5', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#EBEBF5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#3A3A3C', borderRadius: 10, borderWidth: 1, borderColor: '#48484A', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: '#48484A', alignItems: 'center' },
  modalCancelText: { color: '#EBEBF5', fontSize: 16, fontWeight: '600' },
  modalSaveBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1E40AF', alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
