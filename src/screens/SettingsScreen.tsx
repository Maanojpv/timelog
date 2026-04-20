import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, DollarSign, ChevronRight, Zap, Trash2, Tag, Plus, X, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete everything and restart the app fresh. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_ALL' });
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  };

  const nameSheetRef = useRef<AppBottomSheetRef>(null);
  const rateSheetRef = useRef<AppBottomSheetRef>(null);
  const currencySheetRef = useRef<AppBottomSheetRef>(null);
  const tagsSheetRef = useRef<AppBottomSheetRef>(null);

  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  const saveName = () => {
    if (!editName.trim()) return;
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...settings, userName: editName.trim() } });
    nameSheetRef.current?.close();
  };

  const saveRate = () => {
    const rate = parseFloat(editRate);
    if (isNaN(rate)) return;
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...settings, defaultRate: rate } });
    rateSheetRef.current?.close();
  };

  const saveCurrency = (c: typeof CURRENCIES[0]) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...settings, currency: c.code, currencySymbol: c.symbol } });
    currencySheetRef.current?.close();
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => { setEditName(settings.userName); nameSheetRef.current?.expand(); }}
            activeOpacity={0.6}
          >
            <View style={styles.rowIcon}><User size={18} color={colors.muted} /></View>
            <Text style={styles.rowLabel}>Your Name</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{settings.userName || 'Not set'}</Text>
              <ChevronRight size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => currencySheetRef.current?.expand()}
            activeOpacity={0.6}
          >
            <View style={styles.rowIcon}><DollarSign size={18} color={colors.muted} /></View>
            <Text style={styles.rowLabel}>Currency</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{settings.currency} ({settings.currencySymbol})</Text>
              <ChevronRight size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => { setEditRate(settings.defaultRate > 0 ? String(settings.defaultRate) : ''); rateSheetRef.current?.expand(); }}
            activeOpacity={0.6}
          >
            <View style={styles.rowIcon}><Zap size={18} color={colors.muted} /></View>
            <Text style={styles.rowLabel}>Default Hourly Rate</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>
                {settings.defaultRate > 0 ? `${settings.currencySymbol}${settings.defaultRate}/h` : 'Not set'}
              </Text>
              <ChevronRight size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Tags</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => tagsSheetRef.current?.expand()} activeOpacity={0.6}>
            <View style={styles.rowIcon}><Tag size={18} color={colors.muted} /></View>
            <Text style={styles.rowLabel}>Manage Tags</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{state.tags.length} tags</Text>
              <ChevronRight size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={clearData} activeOpacity={0.6}>
            <View style={styles.rowIcon}><Trash2 size={18} color={colors.red} /></View>
            <Text style={[styles.rowLabel, { color: colors.red }]}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Work Log · v1.0.0</Text>
      </ScrollView>

      {/* Edit Name Sheet */}
      <AppBottomSheet ref={nameSheetRef} snapPoints={['40%']} title="Your Name">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="e.g. Alex Johnson"
            placeholderTextColor={colors.muted}
            selectionColor={colors.amber}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>

      {/* Edit Rate Sheet */}
      <AppBottomSheet ref={rateSheetRef} snapPoints={['40%']} title="Default Hourly Rate">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Rate ({settings.currencySymbol}/h)</Text>
          <TextInput
            style={styles.input}
            value={editRate}
            onChangeText={setEditRate}
            placeholder="e.g. 85"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            selectionColor={colors.amber}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveRate}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>

      {/* Tags Sheet */}
      <AppBottomSheet ref={tagsSheetRef} snapPoints={['60%']} title="Manage Tags">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="New tag name…"
              placeholderTextColor={colors.muted}
              selectionColor={colors.amber}
              onSubmitEditing={() => {
                const t = newTag.trim();
                if (t) { dispatch({ type: 'ADD_TAG', payload: t }); setNewTag(''); }
              }}
            />
            <TouchableOpacity
              style={styles.tagAddBtn}
              onPress={() => {
                const t = newTag.trim();
                if (t) { dispatch({ type: 'ADD_TAG', payload: t }); setNewTag(''); }
              }}
            >
              <Plus size={18} color={colors.bg} />
            </TouchableOpacity>
          </View>
          {state.tags.length === 0 && (
            <Text style={styles.tagEmpty}>No tags yet. Add one above.</Text>
          )}
          {state.tags.map(tag => {
            const isEditing = editingTag === tag;
            return (
              <View key={tag} style={styles.tagRow}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.tagEditInput}
                      value={editingTagValue}
                      onChangeText={setEditingTagValue}
                      autoFocus
                      selectionColor={colors.amber}
                      onSubmitEditing={() => {
                        const v = editingTagValue.trim();
                        if (v && v !== tag) dispatch({ type: 'RENAME_TAG', payload: { oldName: tag, newName: v } });
                        setEditingTag(null);
                      }}
                    />
                    <TouchableOpacity style={styles.tagActionBtn} onPress={() => {
                      const v = editingTagValue.trim();
                      if (v && v !== tag) dispatch({ type: 'RENAME_TAG', payload: { oldName: tag, newName: v } });
                      setEditingTag(null);
                    }}>
                      <Check size={16} color={colors.green} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tagActionBtn} onPress={() => setEditingTag(null)}>
                      <X size={16} color={colors.muted} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.tagLabel} onPress={() => { setEditingTag(tag); setEditingTagValue(tag); }}>
                      <Text style={styles.tagChipText}>{tag}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tagActionBtn} onPress={() => { setEditingTag(tag); setEditingTagValue(tag); }}>
                      <Text style={styles.tagEditHint}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tagActionBtn} onPress={() => dispatch({ type: 'DELETE_TAG', payload: tag })}>
                      <X size={16} color={colors.red} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      </AppBottomSheet>

      {/* Currency Sheet */}
      <AppBottomSheet ref={currencySheetRef} snapPoints={['55%']} title="Currency">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[styles.currencyRow, c.code === settings.currency && styles.currencyRowActive]}
              onPress={() => saveCurrency(c)}
            >
              <Text style={styles.currencySymbol}>{c.symbol}</Text>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyCode}>{c.code}</Text>
                <Text style={styles.currencyLabel}>{c.label}</Text>
              </View>
              {c.code === settings.currency && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  screenTitle: { fontSize: 20, fontFamily: 'Inter_500Medium', color: colors.text, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  group: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', marginBottom: 24, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.surface },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  footer: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 16 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  currencyRowActive: { backgroundColor: colors.amber + '12' },
  currencySymbol: { fontSize: 20, fontFamily: 'Inter_500Medium', color: colors.text, width: 32, textAlign: 'center' },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text },
  currencyLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  tagInputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tagInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  tagAddBtn: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12 },
  tagLabel: { flex: 1 },
  tagChipText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text },
  tagEditInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.amber, paddingVertical: 2 },
  tagActionBtn: { paddingHorizontal: 10 },
  tagEditHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.amber },
  tagEmpty: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 8 },
});
