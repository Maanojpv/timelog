import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, CreditCard } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Task, PaymentType, PaymentRecord } from '../context/types';
import {
  minutesToDisplay, taskTotalEarnings, formatMoney, derivePaymentStatus,
} from '../utils/calculations';
import { formatDisplayDate } from '../utils/dateHelpers';
import Badge from '../components/Badge';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';

export default function ProjectDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state, dispatch, tasksForProject } = useApp();
  const sym = state.settings.currencySymbol;
  const insets = useSafeAreaInsets();
  const { projectId } = route.params;

  const project = state.projects.find(p => p.id === projectId);
  const tasks = useMemo(() => tasksForProject(projectId), [tasksForProject, projectId, state.tasks]);
  const logs = useMemo(() => state.logs.filter(l => l.projectId === projectId), [state.logs, projectId]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
  const addTaskSheetRef = useRef<AppBottomSheetRef>(null);
  const editTaskSheetRef = useRef<AppBottomSheetRef>(null);
  const paymentSheetRef = useRef<AppBottomSheetRef>(null);

  const [taskName, setTaskName] = useState('');
  const [taskPaymentType, setTaskPaymentType] = useState<PaymentType>('hourly');
  const [taskRate, setTaskRate] = useState('');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskPaymentType, setEditTaskPaymentType] = useState<PaymentType>('hourly');
  const [editTaskRate, setEditTaskRate] = useState('');

  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');

  const totalMinutes = useMemo(() => logs.reduce((s, l) => s + l.durationMinutes, 0), [logs]);
  const totalEarned = useMemo(
    () => tasks.reduce((s, t) => s + taskTotalEarnings(t.id, logs, state.tasks), 0),
    [tasks, logs, state.tasks]
  );
  const totalPaid = useMemo(
    () => state.payments
      .filter(p => p.projectId === projectId)
      .reduce((s, p) => s + p.amountPaid, 0),
    [state.payments, projectId]
  );
  const totalPending = useMemo(() => Math.max(0, totalEarned - totalPaid), [totalEarned, totalPaid]);

  const logsByTask = useMemo(() =>
    tasks
      .map(task => {
        const taskLogs = logs.filter(l => l.taskId === task.id);
        const totalMin = taskLogs.reduce((s, l) => s + l.durationMinutes, 0);
        const earned = taskTotalEarnings(task.id, logs, state.tasks);
        return { task, logs: taskLogs, totalMin, earned };
      })
      .filter(g => g.logs.length > 0),
    [tasks, logs, state.tasks]
  );

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditTaskPaymentType(task.paymentType);
    setEditTaskRate(String(task.rate));
    editTaskSheetRef.current?.expand();
  };

  const saveNewTask = () => {
    if (!project || !taskName.trim()) return;
    if (taskPaymentType !== 'non-billable' && !taskRate) return;
    const rate = taskPaymentType === 'non-billable' ? 0 : parseFloat(taskRate);
    if (taskPaymentType !== 'non-billable' && isNaN(rate)) return;
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: `t_${Date.now()}`, projectId: project.id, clientId: project.clientId,
        name: taskName.trim(), paymentType: taskPaymentType, rate,
        createdAt: new Date().toISOString(),
      },
    });
    setTaskName(''); setTaskRate(''); setTaskPaymentType('hourly');
    addTaskSheetRef.current?.close();
  };

  const saveEditTask = () => {
    if (!editingTask || !editTaskName.trim()) return;
    if (editTaskPaymentType !== 'non-billable' && !editTaskRate) return;
    const rate = editTaskPaymentType === 'non-billable' ? 0 : parseFloat(editTaskRate);
    if (editTaskPaymentType !== 'non-billable' && isNaN(rate)) return;
    dispatch({
      type: 'UPDATE_TASK',
      payload: { ...editingTask, name: editTaskName.trim(), paymentType: editTaskPaymentType, rate },
    });
    editTaskSheetRef.current?.close();
  };

  const recordPayment = () => {
    if (!project) return;
    const amount = paymentMode === 'full' ? totalPending : parseFloat(partialAmount) || 0;
    if (amount <= 0) return;
    const newPaid = totalPaid + amount;
    const newStatus = derivePaymentStatus(totalEarned, newPaid);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existing = state.payments.find(p => p.projectId === projectId && p.month === currentMonth);
    if (existing) {
      dispatch({ type: 'UPDATE_PAYMENT', payload: { ...existing, amountPaid: existing.amountPaid + amount, status: newStatus, paidAt: new Date().toISOString() } });
    } else {
      const payment: PaymentRecord = {
        id: `pay_${Date.now()}`, clientId: project.clientId, projectId,
        month: currentMonth, amountEarned: totalEarned, amountPaid: amount,
        status: newStatus, paidAt: new Date().toISOString(),
      };
      dispatch({ type: 'RECORD_PAYMENT', payload: payment });
    }
    setPartialAmount(''); setPaymentMode('full');
    paymentSheetRef.current?.close();
  };

  if (!project) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={[styles.colorDot, { backgroundColor: project.color }]} />
          <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => addTaskSheetRef.current?.expand()}>
          <Plus size={16} color={colors.bg} />
        </TouchableOpacity>
      </View>

      {/* 2×2 Summary Grid */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.borderRight, styles.borderBottom]}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={[styles.summaryValue, { color: colors.teal }]}>{minutesToDisplay(totalMinutes)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.borderBottom]}>
          <Text style={styles.summaryLabel}>Earned</Text>
          <Text style={[styles.summaryValue, { color: colors.amber }]}>{formatMoney(totalEarned, sym)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.borderRight]}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: colors.green }]}>{formatMoney(totalPaid, sym)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: totalPending > 0 ? colors.red : colors.muted }]}>
            {totalPending > 0 ? formatMoney(totalPending, sym) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'tasks' && styles.tabActive]} onPress={() => setActiveTab('tasks')}>
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>Tasks ({tasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'logs' && styles.tabActive]} onPress={() => setActiveTab('logs')}>
          <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>Work Log ({logs.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}>
          {tasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => addTaskSheetRef.current?.expand()}>
                <Text style={styles.emptyBtnText}>+ Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tasks.map(task => {
              const taskLogs = logs.filter(l => l.taskId === task.id);
              const taskMin = taskLogs.reduce((s, l) => s + l.durationMinutes, 0);
              const earned = taskTotalEarnings(task.id, logs, state.tasks);
              return (
                <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => openEditTask(task)} activeOpacity={0.75}>
                  <View style={styles.taskCardTop}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Badge
                      type={task.paymentType}
                      label={
                        task.paymentType === 'non-billable' ? 'Non-billable'
                        : task.paymentType === 'fixed' ? `Fixed ${formatMoney(task.rate, sym)}`
                        : `${formatMoney(task.rate, sym)}/h`
                      }
                    />
                  </View>
                  <View style={styles.taskCardBottom}>
                    <Text style={styles.taskHours}>{minutesToDisplay(taskMin)} logged</Text>
                    {task.paymentType !== 'non-billable' && (
                      <Text style={styles.taskEarned}>{formatMoney(earned, sym)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}>
          {logsByTask.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No work logged yet</Text>
            </View>
          ) : (
            logsByTask.map(({ task, logs: taskLogs, totalMin, earned }) => (
              <View key={task.id} style={styles.logGroup}>
                <View style={styles.logGroupHeader}>
                  <Text style={styles.logGroupName}>{task.name}</Text>
                  <View style={styles.logGroupMeta}>
                    <Text style={styles.logGroupHours}>{minutesToDisplay(totalMin)}</Text>
                    {task.paymentType !== 'non-billable'
                      ? <Text style={styles.logGroupEarned}>{formatMoney(earned, sym)}</Text>
                      : <Text style={styles.logGroupNonBillable}>Non-billable</Text>
                    }
                  </View>
                </View>
                {taskLogs.map(log => (
                  <View key={log.id} style={styles.logRow}>
                    <View style={styles.logRowLeft}>
                      <Text style={styles.logDate}>{formatDisplayDate(log.date)}</Text>
                      {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                    </View>
                    <View style={styles.logRowRight}>
                      {log.startTime && log.endTime
                        ? <Text style={styles.logTime}>{log.startTime} – {log.endTime}</Text>
                        : null}
                      <Text style={styles.logDuration}>{minutesToDisplay(log.durationMinutes)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Mark Payment button */}
      {totalPending > 0 && (
        <View style={[styles.floatingBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => { setPaymentMode('full'); setPartialAmount(''); paymentSheetRef.current?.expand(); }}>
            <CreditCard size={18} color={colors.bg} />
            <Text style={styles.floatingBtnText}>Mark Payment · {formatMoney(totalPending, sym)}</Text>
          </TouchableOpacity>
        </View>
      )}

      <AppBottomSheet ref={addTaskSheetRef} snapPoints={['55%']} title="Add Task">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Task Name</Text>
          <TextInput style={styles.input} value={taskName} onChangeText={setTaskName} placeholder="e.g. UI Design" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
          <Text style={styles.inputLabel}>Payment Type</Text>
          <View style={styles.toggle}>
            {(['hourly', 'fixed', 'non-billable'] as PaymentType[]).map(type => (
              <TouchableOpacity key={type} style={[styles.toggleSeg, taskPaymentType === type && styles.toggleActive]} onPress={() => setTaskPaymentType(type)}>
                <Text style={[styles.toggleText, taskPaymentType === type && styles.toggleTextActive]}>{type === 'hourly' ? 'Hourly' : type === 'fixed' ? 'Fixed' : 'Free'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {taskPaymentType !== 'non-billable' && (
            <>
              <Text style={styles.inputLabel}>{taskPaymentType === 'fixed' ? 'Fixed Amount ($)' : 'Hourly Rate ($/h)'}</Text>
              <TextInput style={styles.input} value={taskRate} onChangeText={setTaskRate} placeholder={taskPaymentType === 'fixed' ? '500' : '85'} placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
            </>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={saveNewTask}>
            <Text style={styles.saveBtnText}>Save Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>

      <AppBottomSheet ref={editTaskSheetRef} snapPoints={['55%']} title="Edit Task">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Task Name</Text>
          <TextInput style={styles.input} value={editTaskName} onChangeText={setEditTaskName} placeholder="e.g. UI Design" placeholderTextColor={colors.muted} selectionColor={colors.amber} />
          <Text style={styles.inputLabel}>Payment Type</Text>
          <View style={styles.toggle}>
            {(['hourly', 'fixed', 'non-billable'] as PaymentType[]).map(type => (
              <TouchableOpacity key={type} style={[styles.toggleSeg, editTaskPaymentType === type && styles.toggleActive]} onPress={() => setEditTaskPaymentType(type)}>
                <Text style={[styles.toggleText, editTaskPaymentType === type && styles.toggleTextActive]}>{type === 'hourly' ? 'Hourly' : type === 'fixed' ? 'Fixed' : 'Free'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {editTaskPaymentType !== 'non-billable' && (
            <>
              <Text style={styles.inputLabel}>{editTaskPaymentType === 'fixed' ? 'Fixed Amount ($)' : 'Hourly Rate ($/h)'}</Text>
              <TextInput style={styles.input} value={editTaskRate} onChangeText={setEditTaskRate} placeholder={editTaskPaymentType === 'fixed' ? '500' : '85'} placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
            </>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={saveEditTask}>
            <Text style={styles.saveBtnText}>Update Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>

      <AppBottomSheet ref={paymentSheetRef} snapPoints={['45%']} title="Mark Payment">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetSub}>{project.name} · Pending {formatMoney(totalPending, sym)}</Text>
          <View style={styles.toggle}>
            {(['full', 'partial'] as const).map(mode => (
              <TouchableOpacity key={mode} style={[styles.toggleSeg, paymentMode === mode && styles.toggleActive]} onPress={() => setPaymentMode(mode)}>
                <Text style={[styles.toggleText, paymentMode === mode && styles.toggleTextActive]}>{mode === 'full' ? 'Full Payment' : 'Partial'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {paymentMode === 'partial' && (
            <>
              <Text style={styles.inputLabel}>Amount Paid ($)</Text>
              <TextInput style={styles.input} value={partialAmount} onChangeText={setPartialAmount} placeholder="Enter amount" placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
            </>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={recordPayment}>
            <Text style={styles.saveBtnText}>Confirm Payment</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceHigh, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_500Medium', color: colors.text, flex: 1 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryCard: { width: '50%', paddingHorizontal: 16, paddingVertical: 14 },
  borderRight: { borderRightWidth: 1, borderRightColor: colors.border },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_500Medium' },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.amber },
  tabText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  tabTextActive: { color: colors.amber, fontFamily: 'Inter_500Medium' },
  listContent: { padding: 16, gap: 10 },
  taskCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14 },
  taskCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  taskName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text, flex: 1, marginRight: 8 },
  taskCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskHours: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.teal },
  taskEarned: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text },
  logGroup: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  logGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: colors.surfaceHigh, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logGroupName: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text, flex: 1 },
  logGroupMeta: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  logGroupHours: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.teal },
  logGroupEarned: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.amber },
  logGroupNonBillable: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  logRowLeft: { flex: 1, marginRight: 12 },
  logDate: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text },
  logNote: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  logRowRight: { alignItems: 'flex-end', gap: 2 },
  logTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted },
  logDuration: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.teal },
  floatingBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  floatingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.amber, borderRadius: 100, paddingVertical: 14,
  },
  floatingBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  emptyBtn: { borderWidth: 1, borderColor: colors.amber, borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.amber },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sheetSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 16, marginTop: 4 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 0, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  toggleSeg: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  toggleActive: { backgroundColor: colors.amber },
  toggleText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  toggleTextActive: { color: colors.bg },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
});
