import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, CircleDot, Calendar, Tag, FileText, X, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import {
  getMonthSummary, minutesToDisplay, formatMoney,
  calculateLogEarnings, derivePaymentStatus,
} from '../utils/calculations';
import { getPast6Months, formatMonthLabel, formatDate } from '../utils/dateHelpers';
import { PaymentRecord, PaymentStatus, Project } from '../context/types';
import AppBottomSheet, { AppBottomSheetRef } from '../components/BottomSheet';
import { format } from 'date-fns';

type DateMode = 'month' | 'custom';

const StatusIcon = ({ status }: { status: PaymentStatus }) => {
  if (status === 'paid') return <CheckCircle size={16} color={colors.green} />;
  if (status === 'partial') return <CircleDot size={16} color={colors.amber} />;
  return <AlertCircle size={16} color={colors.red} />;
};

const statusColor: Record<PaymentStatus, string> = { paid: colors.green, partial: colors.amber, pending: colors.red };

export default function ReportsScreen() {
  const { state, dispatch, activeClient, projectsForClient } = useApp();
  const sym = state.settings.currencySymbol;
  const insets = useSafeAreaInsets();
  const months = useMemo(() => getPast6Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [dateMode, setDateMode] = useState<DateMode>('month');
  const [customFrom, setCustomFrom] = useState(new Date());
  const [customTo, setCustomTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const paymentSheetRef = useRef<AppBottomSheetRef>(null);
  const exportSheetRef = useRef<AppBottomSheetRef>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');

  // Export selection state
  const [exportProjectIds, setExportProjectIds] = useState<Set<string>>(new Set());
  const [exportTaskIds, setExportTaskIds] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const projects = useMemo(
    () => activeClient ? projectsForClient(activeClient.id) : [],
    [activeClient, projectsForClient]
  );

  const filteredLogs = useMemo(() => {
    if (!activeClient) return [];
    let logs = state.logs.filter(l => l.clientId === activeClient.id);
    if (dateMode === 'month') {
      logs = logs.filter(l => l.date.startsWith(selectedMonth));
    } else {
      const from = formatDate(customFrom);
      const to = formatDate(customTo);
      logs = logs.filter(l => l.date >= from && l.date <= to);
    }
    if (selectedTags.length > 0) {
      logs = logs.filter(l => l.tags && selectedTags.every(tag => l.tags!.includes(tag)));
    }
    return logs;
  }, [activeClient, state.logs, dateMode, selectedMonth, customFrom, customTo, selectedTags]);

  const summary = useMemo(() => {
    const totalMin = filteredLogs.reduce((s, l) => s + l.durationMinutes, 0);
    const earned = filteredLogs.reduce((s, l) => {
      const task = state.tasks.find(t => t.id === l.taskId);
      return task ? s + calculateLogEarnings(l, task) : s;
    }, 0);
    const paid = dateMode === 'month'
      ? state.payments
          .filter(p => p.clientId === activeClient?.id && p.month === selectedMonth)
          .reduce((s, p) => s + p.amountPaid, 0)
      : 0;
    return { totalMin, earned, paid, pending: Math.max(0, earned - paid) };
  }, [filteredLogs, state.tasks, state.payments, dateMode, selectedMonth, activeClient]);

  const getProjectData = (project: Project) => {
    const projectLogs = filteredLogs.filter(l => l.projectId === project.id);
    const earned = projectLogs.reduce((s, l) => {
      const task = state.tasks.find(t => t.id === l.taskId);
      return task ? s + calculateLogEarnings(l, task) : s;
    }, 0);
    const totalMin = projectLogs.reduce((s, l) => s + l.durationMinutes, 0);
    const payment = dateMode === 'month'
      ? state.payments.find(p => p.projectId === project.id && p.month === selectedMonth)
      : undefined;
    const paid = payment?.amountPaid ?? 0;
    const pending = Math.max(0, earned - paid);
    return { earned, paid, pending, totalMin, status: derivePaymentStatus(earned, paid) };
  };

  const openPaymentSheet = (project: Project) => {
    setSelectedProject(project);
    setPartialAmount(''); setPaymentMode('full');
    paymentSheetRef.current?.expand();
  };

  const recordPayment = () => {
    if (!selectedProject || !activeClient) return;
    const { earned, paid: alreadyPaid } = getProjectData(selectedProject);
    const amount = paymentMode === 'full' ? Math.max(0, earned - alreadyPaid) : parseFloat(partialAmount) || 0;
    if (amount <= 0) return;
    const newPaid = alreadyPaid + amount;
    const newStatus = derivePaymentStatus(earned, newPaid);
    const monthKey = dateMode === 'month' ? selectedMonth : new Date().toISOString().slice(0, 7);
    const existing = state.payments.find(p => p.projectId === selectedProject.id && p.month === monthKey);
    if (existing) {
      dispatch({ type: 'UPDATE_PAYMENT', payload: { ...existing, amountPaid: newPaid, status: newStatus, paidAt: new Date().toISOString() } });
    } else {
      const payment: PaymentRecord = {
        id: `pay_${Date.now()}`, clientId: activeClient.id, projectId: selectedProject.id,
        month: monthKey, amountEarned: earned, amountPaid: newPaid, status: newStatus, paidAt: new Date().toISOString(),
      };
      dispatch({ type: 'RECORD_PAYMENT', payload: payment });
    }
    paymentSheetRef.current?.close();
  };

  const openExportSheet = () => {
    // Pre-select all projects/tasks that have data in the current period
    const pIds = new Set<string>();
    const tIds = new Set<string>();
    const expanded = new Set<string>();
    projects.forEach(p => {
      const { totalMin } = getProjectData(p);
      if (totalMin > 0) {
        pIds.add(p.id);
        expanded.add(p.id);
        state.tasks.filter(t => t.projectId === p.id).forEach(t => tIds.add(t.id));
      }
    });
    setExportProjectIds(pIds);
    setExportTaskIds(tIds);
    setExpandedProjects(expanded);
    exportSheetRef.current?.expand();
  };

  const toggleExportProject = (projectId: string) => {
    setExportProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
        // deselect all tasks under this project
        const tasksIds = state.tasks.filter(t => t.projectId === projectId).map(t => t.id);
        setExportTaskIds(prev2 => { const n = new Set(prev2); tasksIds.forEach(id => n.delete(id)); return n; });
      } else {
        next.add(projectId);
        // select all tasks under this project
        const tasksIds = state.tasks.filter(t => t.projectId === projectId).map(t => t.id);
        setExportTaskIds(prev2 => { const n = new Set(prev2); tasksIds.forEach(id => n.add(id)); return n; });
      }
      return next;
    });
  };

  const toggleExportTask = (taskId: string) => {
    setExportTaskIds(prev => { const n = new Set(prev); n.has(taskId) ? n.delete(taskId) : n.add(taskId); return n; });
  };

  const doExport = async () => {
    if (!activeClient) return;
    exportSheetRef.current?.close();

    const exportLogs = filteredLogs.filter(
      l => exportProjectIds.has(l.projectId) && exportTaskIds.has(l.taskId)
    );

    const exportTotalMin = exportLogs.reduce((s, l) => s + l.durationMinutes, 0);
    const exportEarned = exportLogs.reduce((s, l) => {
      const task = state.tasks.find(t => t.id === l.taskId);
      return task ? s + calculateLogEarnings(l, task) : s;
    }, 0);
    const exportPaid = summary.paid;
    const exportPending = Math.max(0, exportEarned - exportPaid);

    const periodLabel = dateMode === 'month'
      ? formatMonthLabel(selectedMonth)
      : `${format(customFrom, 'MMM d, yyyy')} – ${format(customTo, 'MMM d, yyyy')}`;

    const projectRows = projects
      .filter(p => exportProjectIds.has(p.id))
      .map(p => {
        const pLogs = exportLogs.filter(l => l.projectId === p.id);
        const totalMin = pLogs.reduce((s, l) => s + l.durationMinutes, 0);
        const earned = pLogs.reduce((s, l) => {
          const task = state.tasks.find(t => t.id === l.taskId);
          return task ? s + calculateLogEarnings(l, task) : s;
        }, 0);
        const payment = state.payments.find(pay => pay.projectId === p.id && pay.month === selectedMonth);
        const status = derivePaymentStatus(earned, payment?.amountPaid ?? 0);
        if (totalMin === 0) return '';
        return `<tr><td>${p.name}</td><td>${minutesToDisplay(totalMin)}</td><td>${earned > 0 ? formatMoney(earned, sym) : 'Non-billable'}</td><td>${earned > 0 ? status : '—'}</td></tr>`;
      }).join('');

    const logRows = exportLogs.map(l => {
      const task = state.tasks.find(t => t.id === l.taskId);
      const project = state.projects.find(p => p.id === l.projectId);
      if (!task || !project) return '';
      const earned = calculateLogEarnings(l, task);
      return `<tr><td>${l.date}</td><td>${project.name}</td><td>${task.name}</td><td>${minutesToDisplay(l.durationMinutes)}</td><td>${task.paymentType !== 'non-billable' ? formatMoney(earned, sym) : '—'}</td><td>${l.note ?? ''}</td><td>${l.tags?.join(', ') ?? ''}</td></tr>`;
    }).join('');

    const html = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;color:#555;font-weight:normal;margin-bottom:24px}
      h3{font-size:15px;margin:24px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#f5f5f5;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
      .summary{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .card{border:1px solid #eee;border-radius:8px;padding:12px 16px;min-width:90px}
      .card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px}
      .card-value{font-size:20px;font-weight:bold;margin-top:4px}
    </style></head><body>
      <h1>${activeClient.name} — Work Report</h1>
      <h2>${periodLabel}${selectedTags.length > 0 ? ' · Tags: ' + selectedTags.join(', ') : ''}</h2>
      <div class="summary">
        <div class="card"><div class="card-label">Total Time</div><div class="card-value">${minutesToDisplay(exportTotalMin)}</div></div>
        <div class="card"><div class="card-label">Earned</div><div class="card-value">${formatMoney(exportEarned, sym)}</div></div>
        <div class="card"><div class="card-label">Paid</div><div class="card-value">${formatMoney(exportPaid, sym)}</div></div>
        <div class="card"><div class="card-label">Pending</div><div class="card-value">${formatMoney(exportPending, sym)}</div></div>
      </div>
      <h3>Projects</h3>
      <table><thead><tr><th>Project</th><th>Hours</th><th>Earned</th><th>Status</th></tr></thead>
      <tbody>${projectRows || '<tr><td colspan="4">No data</td></tr>'}</tbody></table>
      <h3>Work Log</h3>
      <table><thead><tr><th>Date</th><th>Project</th><th>Task</th><th>Duration</th><th>Earned</th><th>Note</th><th>Tags</th></tr></thead>
      <tbody>${logRows || '<tr><td colspan="7">No entries</td></tr>'}</tbody></table>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Report' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch {
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const renderProject = ({ item }: { item: Project }) => {
    const { earned, paid, pending, totalMin, status } = getProjectData(item);
    if (totalMin === 0) return null;
    const isFreeProject = earned === 0 && paid === 0;
    return (
      <View style={styles.projectCard}>
        <View style={styles.projectCardTop}>
          <View style={styles.projectCardLeft}>
            <Text style={styles.projectCardName}>{item.name}</Text>
            <Text style={styles.projectCardHours}>{minutesToDisplay(totalMin)}</Text>
          </View>
          {isFreeProject ? (
            <Text style={[styles.statusText, { color: colors.muted }]}>Non-billable</Text>
          ) : (
            <View style={styles.projectCardBadge}>
              <StatusIcon status={status} />
              <Text style={[styles.statusText, { color: statusColor[status] }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          )}
        </View>
        {!isFreeProject && (
          <>
            <View style={styles.projectCardBottom}>
              <Text style={styles.earnedText}>Earned: {formatMoney(earned, sym)}</Text>
              {paid > 0
                ? <Text style={[styles.paidText, { color: colors.green }]}>Paid: {formatMoney(paid, sym)}</Text>
                : pending > 0
                  ? <Text style={[styles.paidText, { color: colors.red }]}>Pending: {formatMoney(pending, sym)}</Text>
                  : null}
            </View>
            {status !== 'paid' && earned > 0 && (
              <TouchableOpacity style={styles.markPaymentBtn} onPress={() => openPaymentSheet(item)}>
                <Text style={styles.markPaymentText}>Mark Payment</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.screenTitle}>Reports</Text>
        <TouchableOpacity
          style={[styles.exportBtn, summary.totalMin === 0 && styles.exportBtnDisabled]}
          onPress={summary.totalMin > 0 ? openExportSheet : undefined}
          disabled={summary.totalMin === 0}
        >
          <FileText size={16} color={colors.bg} />
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Date mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeTab, dateMode === 'month' && styles.modeTabActive]} onPress={() => setDateMode('month')}>
          <Text style={[styles.modeTabText, dateMode === 'month' && styles.modeTabTextActive]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeTab, dateMode === 'custom' && styles.modeTabActive]} onPress={() => setDateMode('custom')}>
          <Calendar size={13} color={dateMode === 'custom' ? colors.amber : colors.muted} />
          <Text style={[styles.modeTabText, dateMode === 'custom' && styles.modeTabTextActive]}>Custom Range</Text>
        </TouchableOpacity>
      </View>

      {dateMode === 'month' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthStrip}>
          {months.map(m => (
            <TouchableOpacity key={m} style={[styles.monthTab, selectedMonth === m && styles.monthTabActive]} onPress={() => setSelectedMonth(m)}>
              <Text style={[styles.monthTabText, selectedMonth === m && styles.monthTabTextActive]}>{formatMonthLabel(m)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.dateRangeRow}>
          <View style={styles.datePickerCol}>
            <Text style={styles.datePickerLabel}>FROM</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.datePickerText}>{format(customFrom, 'MMM d, yyyy')}</Text>
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={customFrom} mode="date" display="compact"
                onChange={(_, d) => { setShowFromPicker(false); if (d) setCustomFrom(d); }}
              />
            )}
          </View>
          <Text style={styles.dateRangeSep}>–</Text>
          <View style={styles.datePickerCol}>
            <Text style={styles.datePickerLabel}>TO</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowToPicker(true)}>
              <Text style={styles.datePickerText}>{format(customTo, 'MMM d, yyyy')}</Text>
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={customTo} mode="date" display="compact"
                onChange={(_, d) => { setShowToPicker(false); if (d) setCustomTo(d); }}
              />
            )}
          </View>
        </View>
      )}

      {/* Tag filter */}
      {state.tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagStrip} contentContainerStyle={styles.tagStripContent}>
          {state.tags.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <TouchableOpacity key={tag} style={[styles.tagChip, active && styles.tagChipActive]} onPress={() => toggleTag(tag)}>
                <Tag size={11} color={active ? colors.amber : colors.muted} />
                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
          {selectedTags.length > 0 && (
            <TouchableOpacity style={styles.tagClear} onPress={() => setSelectedTags([])}>
              <X size={13} color={colors.muted} />
              <Text style={styles.tagClearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Summary grid */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.summaryBorderRight, styles.summaryBorderBottom]}>
          <Text style={styles.summaryLabel}>Total Time</Text>
          <Text style={[styles.summaryValue, { color: colors.teal }]}>{minutesToDisplay(summary.totalMin) || '0h'}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryBorderBottom]}>
          <Text style={styles.summaryLabel}>Earned</Text>
          <Text style={[styles.summaryValue, { color: colors.amber }]}>{formatMoney(summary.earned, sym)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryBorderRight]}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: colors.green }]}>{formatMoney(summary.paid, sym)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: summary.pending > 0 ? colors.red : colors.muted }]}>
            {summary.pending > 0 ? formatMoney(summary.pending, sym) : '—'}
          </Text>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No data for this period</Text>
          </View>
        }
      />

      {/* Export selection sheet */}
      <AppBottomSheet ref={exportSheetRef} snapPoints={['80%']} title="Select for Export">
        <View style={styles.exportSheetInner}>
          <ScrollView contentContainerStyle={styles.exportSheetContent}>
            {projects.map(project => {
              const tasks = state.tasks.filter(t => t.projectId === project.id);
              const projectLogs = filteredLogs.filter(l => l.projectId === project.id);
              if (projectLogs.length === 0) return null;
              const projSelected = exportProjectIds.has(project.id);
              const isExpanded = expandedProjects.has(project.id);
              return (
                <View key={project.id} style={styles.exportProject}>
                  <View style={styles.exportProjectHeader}>
                    <TouchableOpacity onPress={() => toggleExportProject(project.id)} style={styles.exportCheck}>
                      {projSelected
                        ? <CheckSquare size={20} color={colors.amber} />
                        : <Square size={20} color={colors.muted} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportProjectLabel}
                      onPress={() => setExpandedProjects(prev => {
                        const n = new Set(prev);
                        n.has(project.id) ? n.delete(project.id) : n.add(project.id);
                        return n;
                      })}
                    >
                      <View style={[styles.exportProjectDot, { backgroundColor: project.color }]} />
                      <Text style={styles.exportProjectName}>{project.name}</Text>
                      {isExpanded
                        ? <ChevronDown size={16} color={colors.muted} />
                        : <ChevronRight size={16} color={colors.muted} />}
                    </TouchableOpacity>
                  </View>
                  {isExpanded && tasks.map(task => {
                    const hasLogs = projectLogs.some(l => l.taskId === task.id);
                    if (!hasLogs) return null;
                    const taskSelected = exportTaskIds.has(task.id);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[styles.exportTask, !projSelected && styles.exportTaskDisabled]}
                        onPress={() => projSelected && toggleExportTask(task.id)}
                      >
                        {taskSelected && projSelected
                          ? <CheckSquare size={17} color={colors.amber} />
                          : <Square size={17} color={colors.muted} />}
                        <Text style={[styles.exportTaskName, !projSelected && { color: colors.muted }]}>{task.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.exportSheetFooter}>
            <TouchableOpacity
              style={[styles.exportConfirmBtn, exportProjectIds.size === 0 && styles.exportConfirmDisabled]}
              onPress={exportProjectIds.size > 0 ? doExport : undefined}
              disabled={exportProjectIds.size === 0}
            >
              <FileText size={16} color={colors.bg} />
              <Text style={styles.exportConfirmText}>Generate PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppBottomSheet>

      <AppBottomSheet ref={paymentSheetRef} snapPoints={['45%']} title="Mark Payment">
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          {selectedProject && <Text style={styles.sheetSub}>{selectedProject.name}</Text>}
          <View style={styles.toggle}>
            {(['full', 'partial'] as const).map(mode => (
              <TouchableOpacity key={mode} style={[styles.toggleSeg, paymentMode === mode && styles.toggleActive]} onPress={() => setPaymentMode(mode)}>
                <Text style={[styles.toggleText, paymentMode === mode && styles.toggleTextActive]}>{mode === 'full' ? 'Full Payment' : 'Partial Payment'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {paymentMode === 'partial' && (
            <View>
              <Text style={styles.inputLabel}>Amount Paid ({sym})</Text>
              <TextInput style={styles.input} value={partialAmount} onChangeText={setPartialAmount} placeholder="Enter amount" placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.amber} />
            </View>
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
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  screenTitle: { fontSize: 20, fontFamily: 'Inter_500Medium', color: colors.text },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.amber, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  exportBtnDisabled: { backgroundColor: colors.muted, opacity: 0.5 },
  exportBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.bg },
  exportSheetInner: { flex: 1 },
  exportSheetContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 4 },
  exportProject: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 10 },
  exportProjectHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 14 },
  exportCheck: { paddingHorizontal: 14 },
  exportProjectLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportProjectDot: { width: 10, height: 10, borderRadius: 5 },
  exportProjectName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text },
  exportTask: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  exportTaskDisabled: { opacity: 0.4 },
  exportTaskName: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text },
  exportSheetFooter: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  exportConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.amber, borderRadius: 100, paddingVertical: 14 },
  exportConfirmDisabled: { backgroundColor: colors.muted, opacity: 0.5 },
  exportConfirmText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
  modeRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeTabActive: { borderBottomColor: colors.amber },
  modeTabText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  modeTabTextActive: { color: colors.amber, fontFamily: 'Inter_500Medium' },
  monthStrip: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  monthTab: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  monthTabActive: { borderBottomColor: colors.amber },
  monthTabText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  monthTabTextActive: { color: colors.amber },
  dateRangeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  datePickerCol: { flex: 1 },
  datePickerLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  datePickerBtn: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  datePickerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text },
  dateRangeSep: { fontSize: 16, color: colors.muted, marginTop: 18 },
  tagStrip: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  tagStripContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  tagChipActive: { borderColor: colors.amber, backgroundColor: colors.amber + '18' },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  tagChipTextActive: { color: colors.amber },
  tagClear: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  tagClearText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  summaryCard: { width: '50%', paddingHorizontal: 16, paddingVertical: 14 },
  summaryBorderRight: { borderRightWidth: 1, borderRightColor: colors.border },
  summaryBorderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_500Medium' },
  listContent: { padding: 16, gap: 12 },
  projectCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  projectCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  projectCardLeft: { flex: 1 },
  projectCardName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.text },
  projectCardHours: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  projectCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  projectCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnedText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  paidText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  markPaymentBtn: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, alignItems: 'center' },
  markPaymentText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.amber },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sheetSub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 20 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  toggleSeg: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  toggleActive: { backgroundColor: colors.amber },
  toggleText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.muted },
  toggleTextActive: { color: colors.bg },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text, marginBottom: 4 },
  saveBtn: { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.bg },
});
