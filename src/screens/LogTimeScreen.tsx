import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { X, Clock, Timer, AlignLeft, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { minutesToDisplay } from '../utils/calculations';
import { formatDate } from '../utils/dateHelpers';
import { TimeLog } from '../context/types';
import { format, parse } from 'date-fns';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';

type Method = 'range' | 'duration';

export default function LogTimeScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state, dispatch, activeClient, projectsForClient, tasksForProject } = useApp();
  const taskSheetRef = useRef<AppBottomSheetRef>(null);
  const editingLogId: string | undefined = route?.params?.logId;
  const existingLog = editingLogId ? state.logs.find(l => l.id === editingLogId) : undefined;

  const [selectedTask, setSelectedTask] = useState<ReturnType<typeof tasksForProject>[0] | null>(null);
  const [method, setMethod] = useState<Method>('range');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMins, setDurationMins] = useState(0);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskProject, setNewTaskProject] = useState<ReturnType<typeof projectsForClient>[0] | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskType, setNewTaskType] = useState<'hourly' | 'fixed' | 'non-billable'>('hourly');
  const [newTaskRate, setNewTaskRate] = useState('');

  const projects = useMemo(
    () => activeClient ? projectsForClient(activeClient.id) : [],
    [activeClient, projectsForClient]
  );

  useEffect(() => {
    if (!existingLog) return;
    const task = state.tasks.find(t => t.id === existingLog.taskId) ?? null;
    setSelectedTask(task);
    setMethod(existingLog.method as Method);
    setNote(existingLog.note ?? '');
    setSelectedTags(existingLog.tags ?? []);
    if (existingLog.method === 'range' && existingLog.startTime && existingLog.endTime) {
      const base = new Date();
      const [sh, sm] = existingLog.startTime.split(':').map(Number);
      const [eh, em] = existingLog.endTime.split(':').map(Number);
      const s = new Date(base); s.setHours(sh, sm, 0);
      const e = new Date(base); e.setHours(eh, em, 0);
      setStartTime(s);
      setEndTime(e);
    } else {
      setDurationHours(Math.floor(existingLog.durationMinutes / 60));
      setDurationMins(existingLog.durationMinutes % 60);
    }
  }, [editingLogId]);

  const durationMinutes = useMemo(() => {
    if (method === 'duration') return durationHours * 60 + durationMins;
    if (!startTime || !endTime) return 0;
    const diff = (endTime.getTime() - startTime.getTime()) / 60000;
    return diff > 0 ? Math.round(diff) : 0;
  }, [method, durationHours, durationMins, startTime, endTime]);

  const isValid = selectedTask && durationMinutes > 0 && note.trim().length > 0;

  const saveNewTask = () => {
    if (!newTaskProject || !newTaskName.trim() || !activeClient) return;
    if (newTaskType !== 'non-billable' && !newTaskRate) return;
    const rate = newTaskType === 'non-billable' ? 0 : parseFloat(newTaskRate);
    if (newTaskType !== 'non-billable' && isNaN(rate)) return;
    const newTask = {
      id: `t_${Date.now()}`, projectId: newTaskProject.id, clientId: activeClient.id,
      name: newTaskName.trim(), paymentType: newTaskType, rate,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    setSelectedTask(newTask as any);
    setNewTaskName(''); setNewTaskRate(''); setNewTaskType('hourly'); setNewTaskProject(null);
    setAddingTask(false);
    taskSheetRef.current?.close();
  };

  const saveLog = () => {
    if (!isValid || !activeClient || !selectedTask) return;
    const logData: TimeLog = {
      id: existingLog?.id ?? `l_${Date.now()}`,
      taskId: selectedTask.id,
      projectId: selectedTask.projectId,
      clientId: activeClient.id,
      date: existingLog?.date ?? formatDate(new Date()),
      method,
      startTime: method === 'range' && startTime ? format(startTime, 'HH:mm') : undefined,
      endTime: method === 'range' && endTime ? format(endTime, 'HH:mm') : undefined,
      durationMinutes,
      note: note.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      createdAt: existingLog?.createdAt ?? new Date().toISOString(),
    };
    dispatch({ type: existingLog ? 'UPDATE_LOG' : 'ADD_LOG', payload: logData });
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{existingLog ? 'Edit Log' : 'Log Time'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.taskSelector} onPress={() => taskSheetRef.current?.expand()}>
          <Text style={[styles.taskSelectorText, selectedTask && styles.taskSelectorSelected]}>
            {selectedTask ? selectedTask.name : 'Select a task…'}
          </Text>
          <ChevronDown size={18} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.toggle}>
          {(['range', 'duration'] as Method[]).map(m => (
            <TouchableOpacity key={m} style={[styles.toggleSeg, method === m && styles.toggleActive]} onPress={() => setMethod(m)}>
              {m === 'range'
                ? <Clock size={15} color={method === m ? colors.bg : colors.muted} />
                : <Timer size={15} color={method === m ? colors.bg : colors.muted} />
              }
              <Text style={[styles.toggleText, method === m && styles.toggleTextActive]}>
                {m === 'range' ? 'Start – End' : 'Duration'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'range' && (
          <View>
            <View style={styles.timeRow}>
              <View style={styles.timePicker}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => { if (!startTime) setStartTime(new Date()); setShowStartPicker(true); }}>
                  <Text style={styles.timeBtnText}>{startTime ? format(startTime, 'HH:mm') : '--:--'}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker value={startTime ?? new Date()} mode="time" is24Hour display="compact" onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (date) {
                      setStartTime(date);
                      if (!endTime || endTime <= date) {
                        const autoEnd = new Date(date.getTime() + 60 * 60 * 1000);
                        setEndTime(autoEnd);
                      }
                    }
                  }} />
                )}
              </View>
              <View style={styles.timePicker}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => { if (!endTime) setEndTime(new Date()); setShowEndPicker(true); }}>
                  <Text style={styles.timeBtnText}>{endTime ? format(endTime, 'HH:mm') : '--:--'}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker value={endTime ?? new Date()} mode="time" is24Hour display="compact" onChange={(_, date) => { setShowEndPicker(Platform.OS === 'ios'); if (date) setEndTime(date); }} />
                )}
              </View>
            </View>
            {durationMinutes > 0 && (
              <View style={styles.durationBanner}>
                <Timer size={15} color={colors.teal} />
                <Text style={styles.durationBannerText}>Duration: {minutesToDisplay(durationMinutes)}</Text>
              </View>
            )}
          </View>
        )}

        {method === 'duration' && (
          <View style={styles.spinnerRow}>
            <View style={styles.spinnerCol}>
              <Text style={styles.spinnerLabel}>HOURS</Text>
              <TouchableOpacity style={styles.spinnerBtn} onPress={() => setDurationHours(h => Math.min(23, h + 1))}>
                <ChevronUp size={20} color={colors.amber} />
              </TouchableOpacity>
              <View style={styles.spinnerValue}>
                <Text style={styles.spinnerValueText}>{String(durationHours).padStart(2, '0')}</Text>
              </View>
              <TouchableOpacity style={styles.spinnerBtn} onPress={() => setDurationHours(h => Math.max(0, h - 1))}>
                <ChevronDown size={20} color={colors.amber} />
              </TouchableOpacity>
            </View>
            <Text style={styles.spinnerSep}>:</Text>
            <View style={styles.spinnerCol}>
              <Text style={styles.spinnerLabel}>MINUTES</Text>
              <TouchableOpacity style={styles.spinnerBtn} onPress={() => setDurationMins(m => m >= 55 ? 0 : m + 5)}>
                <ChevronUp size={20} color={colors.amber} />
              </TouchableOpacity>
              <View style={styles.spinnerValue}>
                <Text style={styles.spinnerValueText}>{String(durationMins).padStart(2, '0')}</Text>
              </View>
              <TouchableOpacity style={styles.spinnerBtn} onPress={() => setDurationMins(m => m <= 0 ? 55 : m - 5)}>
                <ChevronDown size={20} color={colors.amber} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.inputLabel}>Note</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="What did you work on?"
          placeholderTextColor={colors.muted}
          selectionColor={colors.amber}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>Tags</Text>
        {(state.tags ?? []).length === 0 ? (
          <Text style={styles.tagEmptyHint}>No tags yet — add them in Settings.</Text>
        ) : (
          <View style={styles.tagRow}>
            {(state.tags ?? []).map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => setSelectedTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                >
                  <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]} onPress={saveLog} disabled={!isValid}>
          <Text style={styles.saveBtnText}>{existingLog ? 'Update Log' : 'Save Log'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <AppBottomSheet
        ref={taskSheetRef}
        snapPoints={['70%']}
        title={addingTask ? 'New Task' : 'Select Task'}
        headerAction={
          !addingTask ? (
            <TouchableOpacity style={styles.sheetAddBtn} onPress={() => { setNewTaskProject(projects[0] ?? null); setAddingTask(true); }}>
              <Plus size={16} color={colors.bg} />
            </TouchableOpacity>
          ) : undefined
        }
        onHeaderClose={addingTask ? () => { setAddingTask(false); setNewTaskName(''); setNewTaskRate(''); } : undefined}
        onClose={() => { setAddingTask(false); setNewTaskName(''); setNewTaskRate(''); }}
      >
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          {addingTask ? (
            <>
              <Text style={styles.inputLabelSheet}>Project</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPicker}>
                {projects.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.projectChip, newTaskProject?.id === p.id && styles.projectChipActive]} onPress={() => setNewTaskProject(p)}>
                    <Text style={[styles.projectChipText, newTaskProject?.id === p.id && styles.projectChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabelSheet}>Task Name</Text>
              <TextInput style={styles.sheetInput} value={newTaskName} onChangeText={setNewTaskName} placeholder="e.g. UI Design" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
              <Text style={styles.inputLabelSheet}>Payment Type</Text>
              <View style={styles.toggle}>
                {(['hourly', 'fixed', 'non-billable'] as const).map(t => (
                  <TouchableOpacity key={t} style={[styles.toggleSeg, newTaskType === t && styles.toggleActive]} onPress={() => setNewTaskType(t)}>
                    <Text style={[styles.toggleText, newTaskType === t && styles.toggleTextActive]}>{t === 'hourly' ? 'Hourly' : t === 'fixed' ? 'Fixed' : 'Free'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newTaskType !== 'non-billable' && (
                <>
                  <Text style={styles.inputLabelSheet}>{newTaskType === 'fixed' ? 'Fixed Amount ($)' : 'Hourly Rate ($/h)'}</Text>
                  <TextInput style={styles.sheetInput} value={newTaskRate} onChangeText={setNewTaskRate} placeholder={newTaskType === 'fixed' ? '500' : '85'} placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
                </>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={saveNewTask}>
                <Text style={styles.saveBtnText}>Create & Select Task</Text>
              </TouchableOpacity>
            </>
          ) : (
            (['hourly', 'fixed', 'non-billable'] as const).map(type => {
              const typeTasks = projects.flatMap(p =>
                tasksForProject(p.id)
                  .filter(t => t.paymentType === type)
                  .map(t => ({ task: t, project: p }))
              );
              if (typeTasks.length === 0) return null;
              const groupLabel = type === 'hourly' ? 'Hourly' : type === 'fixed' ? 'Fixed' : 'Non-billable';
              return (
                <View key={type}>
                  <Text style={styles.groupLabel}>{groupLabel}</Text>
                  {typeTasks.map(({ task, project }) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskRow, selectedTask?.id === task.id && styles.taskRowSelected]}
                      onPress={() => { setSelectedTask(task); taskSheetRef.current?.close(); }}
                    >
                      <View style={styles.taskRowLeft}>
                        <Text style={styles.taskRowName}>{task.name}</Text>
                        <Text style={styles.taskRowProject}>{project.name}</Text>
                      </View>
                      <Text style={styles.taskRowRate}>
                        {task.paymentType === 'non-billable' ? 'Non-billable' : task.paymentType === 'fixed' ? `$${task.rate} fixed` : `$${task.rate}/h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceHigh },
  handleContainer: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    marginBottom: 4,
  },
  title: { fontSize: 17, fontFamily: 'Inter_500Medium', color: colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 16, gap: 4 },
  taskSelector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16,
  },
  taskSelectorText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.muted },
  taskSelectorSelected: { color: colors.text },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  toggleSeg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, backgroundColor: colors.surface },
  toggleActive: { backgroundColor: colors.amber },
  toggleText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  toggleTextActive: { color: colors.bg },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timePicker: { flex: 1 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  timeBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  timeBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text },
  durationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.teal + '0F', borderWidth: 1, borderColor: colors.teal + '33',
    borderRadius: 0, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8, marginBottom: 12,
  },
  durationBannerText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.teal },
  spinnerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 8, marginBottom: 8,
  },
  spinnerCol: { alignItems: 'center', gap: 0 },
  spinnerLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.muted, letterSpacing: 1, marginBottom: 6 },
  spinnerBtn: {
    width: 56, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  spinnerValue: {
    width: 56, height: 56, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceHigh, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border,
  },
  spinnerValueText: { fontSize: 28, fontFamily: 'Inter_500Medium', color: colors.text },
  spinnerSep: { fontSize: 28, fontFamily: 'Inter_500Medium', color: colors.muted, marginTop: 22 },
  noteInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text, minHeight: 100, marginBottom: 24 },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: colors.muted },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  groupLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 16 },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.surface, borderRadius: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  taskRowSelected: { backgroundColor: colors.amber + '18' },
  taskRowLeft: { flex: 1 },
  taskRowName: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text },
  taskRowProject: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  taskRowRate: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  tagEmptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, fontStyle: 'italic', marginBottom: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tagChipActive: { borderColor: colors.amber, backgroundColor: colors.amber + '18' },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  tagChipTextActive: { color: colors.amber },
  sheetAddBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  inputLabelSheet: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  sheetInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  projectPicker: { flexGrow: 0, marginBottom: 4 },
  projectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  projectChipActive: { borderColor: colors.amber, backgroundColor: colors.amber + '18' },
  projectChipText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  projectChipTextActive: { color: colors.amber },
});
