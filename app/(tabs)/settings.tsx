import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { signOut, deleteAccount } from '@/lib/auth';
import { router } from 'expo-router';
import { isBiometricAvailable, getBiometricType, setBiometricEnabled, isBiometricEnabled } from '@/lib/biometrics';
import { shareContent } from '@/lib/share';

const MENU = [
  { icon: 'globe-outline', label: 'Language', value: 'English' },
  { icon: 'notifications-outline', label: 'Notifications', value: 'On' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', value: '' },
  { icon: 'help-circle-outline', label: 'Help & Support', value: '' },
  { icon: 'information-circle-outline', label: 'About GovPass', value: 'v1.0.0' },
  { icon: 'gift-outline', label: 'Refer a Friend', value: '' },
];

export default function SettingsScreen() {
  const { user, setSession, setUser } = useAuthStore();
  const uname = user?.email?.split('@')[0] ?? 'User';

  const [biometricAvailable, setBiometricAvailable] = useState(false);
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

  const handleBiometricToggle = async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricEnabledState(value);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            setSession(null);
            setUser(null);
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut(); setSession(null); setUser(null); router.replace('/auth/login');
      }}
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <ScrollView>
        <Text style={s.header}>Settings</Text>
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{uname[0]?.toUpperCase()}</Text></View>
          <View>
            <Text style={s.profileName}>{uname}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
          </View>
        </View>
        <View style={s.section}>
          {MENU.map((item, i) => (
            <TouchableOpacity accessibilityRole="button" key={i} style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}
              onPress={item.label === 'Refer a Friend' ? () => shareContent('Join me on GovPass! Use my link for a free month: https://govpass.app/?ref=USER123') : undefined}>
              <Ionicons name={item.icon as any} size={20} color="#1E40AF" />
              <Text style={s.menuLabel}>{item.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.menuVal}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
        {biometricAvailable && (
          <View style={s.biometricCard}>
            <View style={s.biometricLeft}>
              <Text style={s.biometricIcon}>{biometricType === 'face' ? '🔐' : '👆'}</Text>
              <View>
                <Text style={s.biometricTitle}>
                  {biometricType === 'face' ? 'Face ID' : 'Fingerprint'}
                </Text>
                <Text style={s.biometricSub}>Quick & secure sign-in</Text>
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
        <TouchableOpacity accessibilityRole="button" style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity accessibilityRole="button" style={s.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={s.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
