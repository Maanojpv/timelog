import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { formatDate, isFutureDay, isDayToday } from '../utils/dateHelpers';
import { format, startOfWeek, addWeeks, addDays, differenceInCalendarWeeks } from 'date-fns';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  logDates: Set<string>;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const WeekStrip = React.memo(({ selectedDate, onSelectDate, logDates }: Props) => {
  const today = new Date();
  const todayStr = formatDate(today);
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  const [weekOffset, setWeekOffset] = useState(0);

  // Sync week when selectedDate changes externally (e.g. "Today" reset)
  useEffect(() => {
    const selDate = new Date(selectedDate + 'T00:00:00');
    const selWeekStart = startOfWeek(selDate, { weekStartsOn: 1 });
    const offset = differenceInCalendarWeeks(selWeekStart, currentWeekStart, { weekStartsOn: 1 });
    if (offset !== weekOffset) setWeekOffset(offset);
  }, [selectedDate]);

  const { weekDays, weekLabel } = useMemo(() => {
    const weekStart = addWeeks(currentWeekStart, weekOffset);
    const days = getWeekDays(weekStart);
    const weekEnd = days[6];
    const label = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
    return { weekDays: days, weekLabel: label };
  }, [weekOffset]);

  const canGoForward = weekOffset < 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CalendarDays size={15} color={colors.muted} />
          <Text style={styles.headerDate}>{weekLabel}</Text>
        </View>
        <View style={styles.navRow}>
          {weekOffset !== 0 && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => { setWeekOffset(0); onSelectDate(todayStr); }}
            >
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navBtn} onPress={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft size={18} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            onPress={() => canGoForward && setWeekOffset(w => w + 1)}
            disabled={!canGoForward}
          >
            <ChevronRight size={18} color={canGoForward ? colors.muted : colors.border} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.daysRow}>
        {weekDays.map((day, i) => {
          const dateStr = formatDate(day);
          const isSelected = dateStr === selectedDate;
          const isToday = isDayToday(day);
          const isFuture = isFutureDay(day);
          const hasLogs = logDates.has(dateStr) && !isSelected;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.dayCol, isFuture && styles.futureDay]}
              onPress={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
            >
              <Text style={[styles.dayLabel, isSelected && styles.activeDayLabel]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[
                styles.circle,
                isSelected && styles.selectedCircle,
                !isSelected && isToday && styles.todayCircle,
              ]}>
                <Text style={[
                  styles.dayNum,
                  isSelected && styles.selectedDayNum,
                  !isSelected && isToday && styles.todayDayNum,
                ]}>
                  {format(day, 'd')}
                </Text>
              </View>
              {hasLogs ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDate: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayBtn: {
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 4,
  },
  todayText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.amber,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  futureDay: {
    opacity: 0.3,
  },
  dayLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  activeDayLabel: {
    color: colors.amber,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: colors.amber,
  },
  todayCircle: {
    borderWidth: 1,
    borderColor: colors.amber,
  },
  dayNum: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  selectedDayNum: {
    color: colors.bg,
    fontFamily: 'Inter_500Medium',
  },
  todayDayNum: {
    color: colors.amber,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
});

export default WeekStrip;
