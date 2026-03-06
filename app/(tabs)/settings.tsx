import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { signOut } from '@/lib/auth';
import { router } from 'expo-router';

const MENU = [
  { icon: 'globe-outline', label: 'Language', value: 'English' },
  { icon: 'notifications-outline', label: 'Notifications', value: 'On' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', value: '' },
  { icon: 'help-circle-outline', label: 'Help & Support', value: '' },
  { icon: 'information-circle-outline', label: 'About GovPass', value: 'v1.0.0' },
];

export default function SettingsScreen() {
  const { user, setSession, setUser } = useAuthStore();
  const uname = user?.email?.split('@')[0] ?? 'User';

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
            <TouchableOpacity key={i} style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}>
              <Ionicons name={item.icon as any} size={20} color="#1E40AF" />
              <Text style={s.menuLabel}>{item.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.menuVal}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 20, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF444440', backgroundColor: '#EF444410' },
  signOutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
