import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Project, PaymentType } from '../context/types';
import { minutesToDisplay, taskTotalEarnings, formatMoney } from '../utils/calculations';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';
import { useNavigation } from '@react-navigation/native';

const COLOR_OPTIONS = [colors.amber, colors.teal, colors.green, colors.red, '#A78BFA'];

export default function ProjectsScreen() {
  const { state, dispatch, activeClient, projectsForClient, tasksForProject } = useApp();
  const sym = state.settings.currencySymbol;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const addProjectSheetRef = useRef<AppBottomSheetRef>(null);

  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState(COLOR_OPTIONS[0]);

  const projects = useMemo(
    () => activeClient ? projectsForClient(activeClient.id) : [],
    [activeClient, projectsForClient]
  );

  const saveProject = () => {
    if (!activeClient || !projectName.trim()) return;
    dispatch({
      type: 'ADD_PROJECT',
      payload: {
        id: `p_${Date.now()}`, clientId: activeClient.id,
        name: projectName.trim(), color: projectColor, createdAt: new Date().toISOString(),
      },
    });
    setProjectName('');
    addProjectSheetRef.current?.close();
  };

  const renderProject = useCallback(({ item }: { item: Project }) => {
    const tasks = tasksForProject(item.id);
    const logs = state.logs.filter(l => l.projectId === item.id);
    const totalMin = logs.reduce((s, l) => s + l.durationMinutes, 0);
    const totalEarned = tasks.reduce((s, t) => s + taskTotalEarnings(t.id, logs, state.tasks), 0);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.leftAccent, { backgroundColor: item.color }]} />
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectSub}>{tasks.length} tasks · {minutesToDisplay(totalMin)}</Text>
        </View>
        <Text style={styles.projectEarned}>{formatMoney(totalEarned, sym)}</Text>
        <ChevronRight size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  }, [tasksForProject, state.logs, state.tasks, navigation]);

  return (
    <View style={styles.root}>
      <View style={[styles.screenHeader, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.screenTitle}>Projects</Text>
        <TouchableOpacity style={styles.addProjectBtn} onPress={() => addProjectSheetRef.current?.expand()}>
          <Plus size={15} color={colors.bg} />
          <Text style={styles.addProjectBtnText}>Add Project</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No projects yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => addProjectSheetRef.current?.expand()}>
              <Text style={styles.emptyBtnText}>+ Add Project</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AppBottomSheet ref={addProjectSheetRef} snapPoints={['45%']} title="Add Project">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Project Name</Text>
          <TextInput style={styles.input} value={projectName} onChangeText={setProjectName} placeholder="e.g. Website Redesign" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorCircle, { backgroundColor: c }, projectColor === c && styles.colorSelected]} onPress={() => setProjectColor(c)} />
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={saveProject}>
            <Text style={styles.saveBtnText}>Save Project</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  screenTitle: { fontSize: 20, fontFamily: 'Inter_500Medium', color: colors.text },
  addProjectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.amber, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  addProjectBtnText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.bg },
  listContent: { padding: 16, gap: 10 },
  projectCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', paddingRight: 14, paddingVertical: 14, gap: 12,
  },
  leftAccent: { width: 3, alignSelf: 'stretch' },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text },
  projectSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  projectEarned: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.amber },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    padding: 32, alignItems: 'center', gap: 12, marginTop: 20,
  },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  emptyBtn: { borderWidth: 1, borderColor: colors.amber, borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.amber },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 0, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
});
