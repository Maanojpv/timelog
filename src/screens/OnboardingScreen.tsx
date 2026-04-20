import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

const CLIENT_COLORS = [colors.amber, colors.teal, colors.green, '#A78BFA', '#60A5FA', colors.red];

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { dispatch } = useApp();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [defaultRate, setDefaultRate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientColor, setClientColor] = useState(CLIENT_COLORS[0]);
  const [projectName, setProjectName] = useState('');
  const [taskName, setTaskName] = useState('');

  const canNext0 = name.trim().length > 0;
  const canNext1 = defaultRate.trim().length > 0;
  const canFinish = clientName.trim().length > 0 && projectName.trim().length > 0 && taskName.trim().length > 0;

  const finish = () => {
    const rate = parseFloat(defaultRate) || 0;
    dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: name.trim(), currency: currency.code, currencySymbol: currency.symbol, defaultRate: rate } });

    const clientId = `c_${Date.now()}`;
    const projectId = `p_${Date.now() + 1}`;
    const taskId = `t_${Date.now() + 2}`;

    dispatch({
      type: 'ADD_CLIENT',
      payload: { id: clientId, name: clientName.trim(), initial: clientName.trim().charAt(0).toUpperCase(), color: clientColor, createdAt: new Date().toISOString() },
    });
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: clientId });
    dispatch({
      type: 'ADD_PROJECT',
      payload: { id: projectId, clientId, name: projectName.trim(), color: colors.teal, createdAt: new Date().toISOString() },
    });
    dispatch({
      type: 'ADD_TASK',
      payload: { id: taskId, projectId, clientId, name: taskName.trim(), paymentType: 'hourly', rate, createdAt: new Date().toISOString() },
    });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    navigation.replace('Main');
  };

  const steps = [
    // Step 0 — Personal info
    <View key="0" style={styles.stepContainer}>
      <View style={styles.logoRow}>
        <Logo size={64} />
        <View>
          <Text style={styles.appName}>Timelog</Text>
          <Text style={styles.appTagline}>Track · Invoice · Get Paid</Text>
        </View>
      </View>
      <Text style={styles.stepTitle}>Welcome 👋</Text>
      <Text style={styles.stepSub}>Let's set up your workspace. What's your name?</Text>
      <Text style={styles.inputLabel}>Your Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Alex Johnson" placeholderTextColor={colors.muted} selectionColor={colors.amber} autoFocus />
      <TouchableOpacity style={[styles.nextBtn, !canNext0 && styles.btnDisabled]} onPress={() => canNext0 && setStep(1)} disabled={!canNext0}>
        <Text style={styles.nextBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>,

    // Step 1 — Currency & Rate
    <View key="1" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Currency & Rate</Text>
      <Text style={styles.stepSub}>Set your preferred currency and default hourly rate.</Text>
      <Text style={styles.inputLabel}>Currency</Text>
      <View style={styles.currencyGrid}>
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.code}
            style={[styles.currencyOption, currency.code === c.code && styles.currencyOptionActive]}
            onPress={() => setCurrency(c)}
          >
            <Text style={[styles.currencySymbol, currency.code === c.code && styles.currencySymbolActive]}>{c.symbol}</Text>
            <Text style={[styles.currencyCode, currency.code === c.code && styles.currencyCodeActive]}>{c.code}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.inputLabel}>Default Hourly Rate ({currency.symbol}/h)</Text>
      <TextInput style={styles.input} value={defaultRate} onChangeText={setDefaultRate} placeholder="e.g. 85" placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
      <TouchableOpacity style={[styles.nextBtn, !canNext1 && styles.btnDisabled]} onPress={() => canNext1 && setStep(2)} disabled={!canNext1}>
        <Text style={styles.nextBtnText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>,

    // Step 2 — First Client & Project
    <View key="2" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>First Client</Text>
      <Text style={styles.stepSub}>Add your first client, project and task to get started.</Text>
      <Text style={styles.inputLabel}>Client Name</Text>
      <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="e.g. Acme Corp" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
      <Text style={styles.inputLabel}>Client Color</Text>
      <View style={styles.colorRow}>
        {CLIENT_COLORS.map(c => (
          <TouchableOpacity key={c} style={[styles.colorCircle, { backgroundColor: c }, clientColor === c && styles.colorSelected]} onPress={() => setClientColor(c)} />
        ))}
      </View>
      <Text style={styles.inputLabel}>Project Name</Text>
      <TextInput style={styles.input} value={projectName} onChangeText={setProjectName} placeholder="e.g. Website Redesign" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
      <Text style={styles.inputLabel}>First Task Name</Text>
      <TextInput style={styles.input} value={taskName} onChangeText={setTaskName} placeholder="e.g. UI Design" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
      <TouchableOpacity style={[styles.nextBtn, !canFinish && styles.btnDisabled]} onPress={finish} disabled={!canFinish}>
        <Text style={styles.nextBtnText}>Get Started</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>,
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {steps[step]}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 24, paddingBottom: 8 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.amber },
  content: { padding: 24, paddingBottom: 60 },
  stepContainer: { gap: 0 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  appName: { fontSize: 26, fontFamily: 'Inter_500Medium', color: colors.text },
  appTagline: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  stepTitle: { fontSize: 24, fontFamily: 'Inter_500Medium', color: colors.text, marginBottom: 8 },
  stepSub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 28, lineHeight: 22 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  currencyOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  currencyOptionActive: { borderColor: colors.amber, backgroundColor: colors.amber + '18' },
  currencySymbol: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.muted },
  currencySymbolActive: { color: colors.amber },
  currencyCode: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  currencyCodeActive: { color: colors.amber },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  nextBtn: { backgroundColor: colors.amber, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { backgroundColor: colors.muted },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  backBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
});
