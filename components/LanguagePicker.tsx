import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false },
  { code: 'es', label: 'Español', nativeLabel: 'Español', rtl: false },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', rtl: false },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', rtl: false },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true },
  { code: 'pt', label: 'Português', nativeLabel: 'Português', rtl: false },
  { code: 'fr', label: 'Français', nativeLabel: 'Français', rtl: false },
  { code: 'de', label: 'Deutsch', nativeLabel: 'Deutsch', rtl: false },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', rtl: false },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', rtl: false },
];

export default function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = async (code: string) => {
    await changeLanguage(code);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('settings.language')}
        style={s.trigger}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="globe-outline" size={20} color="#1E40AF" />
        <Text style={s.triggerLabel}>{t('settings.language')}</Text>
        <View style={{ flex: 1 }} />
        <Text style={s.triggerValue}>{currentLang.nativeLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{t('language.selectLanguage')}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = i18n.language === item.code;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={s.langItem}
                  onPress={() => handleSelect(item.code)}
                >
                  <Text
                    style={[
                      s.langNative,
                      item.rtl && s.rtlText,
                      isSelected && s.selectedText,
                    ]}
                  >
                    {item.nativeLabel}
                  </Text>
                  <Text style={s.langSub}>{item.label}</Text>
                  <View style={{ flex: 1 }} />
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerLabel: { fontSize: 15, color: '#FFFFFF' },
  triggerValue: { color: '#94A3B8', fontSize: 14, marginRight: 8 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#0F1B35',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#1A2744',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2744',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A274420',
    gap: 12,
  },
  langNative: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', minWidth: 80 },
  langSub: { fontSize: 13, color: '#94A3B8' },
  selectedText: { color: '#1E40AF' },
  rtlText: { textAlign: 'right' },
});
