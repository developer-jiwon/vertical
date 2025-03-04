import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import DayList from '@/components/calendar/DayList';
import DaySchedule from '@/components/calendar/DaySchedule';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define view types
type ViewType = 'month' | 'dayList';

// Get screen dimensions
const { height } = Dimensions.get('window');

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
  );
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const colorScheme = useColorScheme();

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (month: string) => {
    // Extract year and month from the date string
    const [year, monthNum] = month.split('-');
    // Create a new date string with the first day of the month
    const newSelectedMonth = `${year}-${monthNum}-01`;
    setSelectedMonth(newSelectedMonth);
  };

  const getToggleIcon = () => {
    return currentView === 'month' ? 'list.bullet' : 'calendar';
  };

  const handleToggle = () => {
    setCurrentView(currentView === 'month' ? 'dayList' : 'month');
  };

  const formatSelectedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatMonthYear = (dateString: string) => {
    return new Date(dateString).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.container}>
        {currentView === 'month' ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.contentContainer}>
              <ThemedView style={styles.calendarContainer}>
                <MonthlyCalendar
                  onDayPress={handleDayPress}
                  onMonthChange={handleMonthChange}
                  selectedDate={selectedDate}
                />
              </ThemedView>
              
              {selectedDate && (
                <ThemedView style={styles.dayScheduleContainer}>
                  <ThemedView style={styles.dayScheduleHeader}>
                    <View style={styles.spacer} />
                    <ThemedText type="subtitle" style={styles.dateHeaderText}>
                      {formatSelectedDate(selectedDate)}
                    </ThemedText>
                    <TouchableOpacity 
                      style={styles.toggleButton}
                      onPress={handleToggle}
                    >
                      <IconSymbol 
                        size={20} 
                        name={getToggleIcon()} 
                        color={Colors[colorScheme ?? 'light'].tint} 
                      />
                    </TouchableOpacity>
                  </ThemedView>
                  <ThemedView style={styles.dayScheduleContent}>
                    <DaySchedule
                      selectedDate={selectedDate}
                      onAddEvent={(time) => console.log('Add event at:', time)}
                    />
                  </ThemedView>
                </ThemedView>
              )}
            </ThemedView>
          </ScrollView>
        ) : (
          <ThemedView style={styles.dayListContainer}>
            <ThemedView style={styles.dayListHeader}>
              <View style={styles.spacer} />
              <ThemedText type="subtitle" style={styles.monthTitle}>
                {formatMonthYear(selectedMonth)}
              </ThemedText>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={handleToggle}
              >
                <IconSymbol 
                  size={20} 
                  name={getToggleIcon()} 
                  color={Colors[colorScheme ?? 'light'].tint} 
                />
              </TouchableOpacity>
            </ThemedView>
            <DayList
              selectedMonth={selectedMonth}
              onDayPress={handleDayPress}
              selectedDate={selectedDate}
            />
          </ThemedView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  calendarContainer: {
    maxHeight: height * 0.35, // 35% of screen height
  },
  dayListContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dayListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  monthTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Merriweather_700Bold',
  },
  dayScheduleContainer: {
    flex: 1,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#c0d0ce',
    minHeight: height * 0.55, // 55% of screen height
  },
  dayScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  dateHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Merriweather_700Bold',
  },
  spacer: {
    width: 36, // Same width as the toggle button to ensure centering
  },
  dayScheduleContent: {
    flex: 1,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
