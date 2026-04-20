import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { TimeLog, Task, Project } from '../context/types';
import { minutesToDisplay, calculateLogEarnings, formatMoney } from '../utils/calculations';
import { useApp } from '../context/AppContext';
import Badge from './Badge';

interface Props {
  log: TimeLog;
  task: Task;
  project: Project;
  onPress?: () => void;
}

const LogEntry = React.memo(({ log, task, project, onPress }: Props) => {
  const { state } = useApp();
  const symbol = state.settings.currencySymbol;
  const duration = minutesToDisplay(log.durationMinutes);
  const earned = calculateLogEarnings(log, task);
  const hasRange = !!(log.startTime && log.endTime);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.projectName}>{project.name}</Text>
          {log.note ? <Text style={styles.noteText}>{log.note}</Text> : null}
        </View>
        <Badge type={task.paymentType} />
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.timeRow}>
          <Clock size={13} color={colors.muted} />
          {hasRange ? (
            <>
              <Text style={styles.timeText}>{log.startTime} – {log.endTime}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.duration}>{duration}</Text>
            </>
          ) : (
            <Text style={styles.duration}>{duration}</Text>
          )}
        </View>
        <Text style={styles.earned}>{formatMoney(earned, symbol)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topLeft: {
    flex: 1,
    marginRight: 8,
  },
  taskName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
    marginBottom: 2,
  },
  projectName: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  noteText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  dot: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  duration: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.teal,
  },
  earned: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
});

export default LogEntry;
