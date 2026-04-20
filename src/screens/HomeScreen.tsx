import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Clock, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateHelpers';
import { calculateLogEarnings, minutesToDisplay, formatMoney, taskTotalEarnings } from '../utils/calculations';
import WeekStrip from '../components/WeekStrip';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';
import { TimeLog, Client, Task, Project } from '../context/types';
import { useNavigation } from '@react-navigation/native';

const CLIENT_COLOR_OPTIONS = [colors.amber, colors.teal, colors.green, colors.red, '#A78BFA', '#60A5FA'];

export default function HomeScreen() {
  const { state, dispatch, activeClient, logsForDate } = useApp();
  const sym = state.settings.currencySymbol;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const clientSheetRef = useRef<AppBottomSheetRef>(null);
  const [addingClient, setAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientColor, setNewClientColor] = useState(CLIENT_COLOR_OPTIONS[0]);

  const handleSelectDate = (date: string) => setSelectedDate(date);

  const dayLogs = useMemo(
    () => activeClient ? logsForDate(activeClient.id, selectedDate) : [],
    [activeClient, logsForDate, selectedDate]
  );

  const logDateSet = useMemo(() => {
    if (!activeClient) return new Set<string>();
    return new Set(state.logs.filter(l => l.clientId === activeClient.id).map(l => l.date));
  }, [state.logs, activeClient]);

  const dayStats = useMemo(() => {
    const totalMin = dayLogs.reduce((s, l) => s + l.durationMinutes, 0);
    const earned = dayLogs.reduce((s, l) => {
      const task = state.tasks.find(t => t.id === l.taskId);
      return task ? s + calculateLogEarnings(l, task) : s;
    }, 0);
    return { hours: minutesToDisplay(totalMin) || '0h', earned };
  }, [dayLogs, state.tasks]);

  const switchClient = (clientId: string) => {
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: clientId });
    setSelectedDate(formatDate(new Date()));
    clientSheetRef.current?.close();
  };

  const saveNewClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    const initial = name.charAt(0).toUpperCase();
    const newClient: Client = {
      id: `c_${Date.now()}`,
      name,
      initial,
      color: newClientColor,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: newClient.id });
    setNewClientName('');
    setNewClientColor(CLIENT_COLOR_OPTIONS[0]);
    setAddingClient(false);
    clientSheetRef.current?.close();
  };

  const taskGroups = useMemo(() => {
    const map = new Map<string, { task: Task; project: Project; logs: TimeLog[]; totalMin: number; totalEarned: number }>();
    for (const log of dayLogs) {
      const task = state.tasks.find(t => t.id === log.taskId);
      const project = state.projects.find(p => p.id === log.projectId);
      if (!task || !project) continue;
      if (!map.has(task.id)) {
        map.set(task.id, { task, project, logs: [], totalMin: 0, totalEarned: 0 });
      }
      const group = map.get(task.id)!;
      group.logs.push(log);
      group.totalMin += log.durationMinutes;
      group.totalEarned += calculateLogEarnings(log, task);
    }
    return Array.from(map.values());
  }, [dayLogs, state.tasks, state.projects]);

  return (
    <View style={styles.root}>
      <View style={[styles.switcher, { paddingTop: insets.top + 14 }]}>
        <View style={[styles.avatar, { backgroundColor: activeClient?.color ?? colors.muted }]}>
          <Text style={styles.avatarText}>{activeClient?.initial ?? '?'}</Text>
        </View>
        <View style={styles.switcherInfo}>
          <Text style={styles.switcherLabel}>Current Client</Text>
          <Text style={styles.switcherName}>{activeClient?.name ?? 'None'}</Text>
        </View>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => clientSheetRef.current?.expand()}>
          <ChevronDown size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <WeekStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} logDates={logDateSet} />

      <View style={styles.statGrid}>
        <View style={[styles.statCard, { borderRightWidth: 1, borderRightColor: colors.border }]}>
          <Text style={styles.statCardLabel}>Hours</Text>
          <Text style={[styles.statCardValue, { color: colors.teal }]}>{dayStats.hours}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Earned</Text>
          <Text style={[styles.statCardValue, { color: colors.amber }]}>{formatMoney(dayStats.earned, sym)}</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.entryCount}>{dayLogs.length} {dayLogs.length === 1 ? 'entry' : 'entries'}</Text>
      </View>

      {taskGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Clock size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No logs for this day</Text>
            <TouchableOpacity style={styles.addLogBtn} onPress={() => navigation.navigate('LogTimeModal')}>
              <Text style={styles.addLogText}>+ Add Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} style={styles.list}>
          {taskGroups.map(({ task, project, logs, totalMin, totalEarned }) => (
            <View key={task.id} style={styles.taskGroup}>
              <View style={styles.taskGroupHeader}>
                <Text style={styles.taskGroupName}>{task.name}</Text>
                <View style={styles.taskGroupRight}>
                  <Text style={styles.taskGroupHours}>{minutesToDisplay(totalMin)}</Text>
                  {task.paymentType !== 'non-billable' && (
                    <Text style={styles.taskGroupEarned}>{formatMoney(totalEarned, sym)}</Text>
                  )}
                </View>
              </View>
              {logs.map(log => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.logRow}
                  onPress={() => navigation.navigate('LogTimeModal', { logId: log.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.logRowLeft}>
                    <Text style={styles.logRowProject}>{project.name}</Text>
                    {log.note ? <Text style={styles.logRowNote}>{log.note}</Text> : null}
                  </View>
                  <View style={styles.logRowRight}>
                    {log.startTime && log.endTime
                      ? <Text style={styles.logRowTime}>{log.startTime} – {log.endTime}</Text>
                      : null}
                    <Text style={styles.logRowDuration}>{minutesToDisplay(log.durationMinutes)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <AppBottomSheet
        ref={clientSheetRef}
        snapPoints={['65%']}
        title={addingClient ? 'Add Client' : 'Switch Client'}
        headerAction={
          !addingClient ? (
            <TouchableOpacity style={styles.addClientHeaderBtn} onPress={() => setAddingClient(true)}>
              <Plus size={16} color={colors.bg} />
            </TouchableOpacity>
          ) : undefined
        }
        onHeaderClose={addingClient ? () => { setAddingClient(false); setNewClientName(''); setNewClientColor(CLIENT_COLOR_OPTIONS[0]); } : undefined}
        onClose={() => { setAddingClient(false); setNewClientName(''); setNewClientColor(CLIENT_COLOR_OPTIONS[0]); }}
      >
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          {addingClient ? (
            <>
              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput
                style={styles.input}
                value={newClientName}
                onChangeText={setNewClientName}
                placeholder="e.g. Acme Corp"
                placeholderTextColor={colors.muted}
                selectionColor={colors.amber}
              />
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorRow}>
                {CLIENT_COLOR_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, newClientColor === c && styles.colorSelected]}
                    onPress={() => setNewClientColor(c)}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveNewClient}>
                <Text style={styles.saveBtnText}>Save Client</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {state.clients.length === 0 ? (
                <View style={styles.noClientsCard}>
                  <Text style={styles.noClientsText}>No clients yet</Text>
                  <Text style={styles.noClientsSub}>Tap + to add your first client</Text>
                </View>
              ) : (
                state.clients.map((client: Client) => {
                  const isActive = client.id === state.activeClientId;
                  const clientProjects = state.projects.filter(p => p.clientId === client.id);
                  const totalMin = state.logs.filter(l => l.clientId === client.id).reduce((s, l) => s + l.durationMinutes, 0);
                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={[styles.clientRow, isActive && { backgroundColor: client.color + '12' }]}
                      onPress={() => switchClient(client.id)}
                    >
                      <View style={[styles.clientAvatar, { backgroundColor: client.color }]}>
                        <Text style={styles.clientAvatarText}>{client.initial}</Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <Text style={styles.clientSub}>{clientProjects.length} projects · {minutesToDisplay(totalMin)} logged</Text>
                      </View>
                      {isActive && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  switcher: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingBottom: 14, gap: 12,
  },
  arrowBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 34, height: 34, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  switcherInfo: { flex: 1 },
  switcherLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  switcherName: { fontSize: 17, fontFamily: 'Inter_500Medium', color: colors.text },
  statGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  statCardLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statCardValue: {
    fontSize: 22,
    fontFamily: 'Inter_500Medium',
  },
  listHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, alignItems: 'flex-end' },
  entryCount: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 12 },
  taskGroup: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  taskGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: colors.surfaceHigh, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  taskGroupName: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text, flex: 1 },
  taskGroupRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskGroupHours: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.teal },
  taskGroupEarned: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.amber },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  logRowLeft: { flex: 1, marginRight: 12 },
  logRowProject: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text },
  logRowNote: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  logRowRight: { alignItems: 'flex-end', gap: 2 },
  logRowTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted },
  logRowDuration: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.teal },
  emptyContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    padding: 32, alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  addLogBtn: { borderWidth: 1, borderColor: colors.amber, borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  addLogText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.amber },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_500Medium', color: colors.text, marginBottom: 16, marginTop: 4 },
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, marginBottom: 2, gap: 12,
  },
  clientAvatar: { width: 40, height: 40, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 17, fontFamily: 'Inter_500Medium', color: colors.bg },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text },
  clientSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  addClientHeaderBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  noClientsCard: {
    paddingVertical: 40, alignItems: 'center', gap: 6,
  },
  noClientsText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text },
  noClientsSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 0, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
});
