import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Alert, TextInput, Modal, Platform, KeyboardAvoidingView, Animated, Vibration, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import DayList from '@/components/calendar/DayList';
import DaySchedule from '@/components/calendar/DaySchedule';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useLocalSearchParams } from 'expo-router';

// Define view types
type ViewType = 'month' | 'dayList';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Calculate responsive sizes
const isSmallScreen = width < 375; // iPhone SE and similar
const modalWidth = isSmallScreen ? '95%' : '85%';
const fontSize = {
  title: isSmallScreen ? 16 : 18,
  label: isSmallScreen ? 14 : 16,
  input: isSmallScreen ? 14 : 16,
  button: isSmallScreen ? 14 : 16
};
const padding = {
  modal: isSmallScreen ? 15 : 20,
  button: isSmallScreen ? 10 : 12
};

// Add this helper function before the HomeScreen component
const checkForTimeConflict = (
  startTime1: string,
  duration1: number,
  startTime2: string,
  duration2: number
): boolean => {
  const start1 = new Date(startTime1);
  const end1 = new Date(start1.getTime() + duration1 * 60000);
  const start2 = new Date(startTime2);
  const end2 = new Date(start2.getTime() + duration2 * 60000);

  return start1 < end2 && start2 < end1;
};

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const dateFromParams = typeof params.date === 'string' ? params.date : null;
  
  // Get today's date for default values - this will work in any timezone
  const today = new Date();
  // Format as YYYY-MM-DD in local timezone (works in any timezone including Korea)
  const todayISOString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  // For testing purposes, force the current month to be March 2025
  // This is just a default value, the actual month will be based on the user's timezone
  const currentMonth = '2025-03-01';
  
  const [selectedDate, setSelectedDate] = useState<string>(
    dateFromParams || todayISOString
  );
  
  // Initialize selectedMonth with March 2025
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState(new Date());
  const [newEventEndDate, setNewEventEndDate] = useState(new Date());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const dayScheduleRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const startTimeAnimatedValue = useRef(new Animated.Value(0)).current;
  const endTimeAnimatedValue = useRef(new Animated.Value(0)).current;
  
  // Time slots for the custom time picker - organized by time period
  const timeSlots = {
    morning: ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    afternoon: ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'],
    evening: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM']
  };
  
  // Quick presets for duration
  const durationPresets = [
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '1.5h', minutes: 90 },
    { label: '2h', minutes: 120 }
  ];
  
  // Current active time period tab
  const [activeTimeTab, setActiveTimeTab] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  
  // Set initial active tab based on current time
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      setActiveTimeTab('morning');
    } else if (currentHour >= 12 && currentHour < 17) {
      setActiveTimeTab('afternoon');
    } else {
      setActiveTimeTab('evening');
    }
  }, []);
  
  // Parse time string to Date
  const parseTimeString = (timeString: string): Date => {
    const date = new Date();
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const { appointments, addAppointment, editAppointment, deleteAppointment } = useAppointments();

  // Handle URL parameter changes
  useEffect(() => {
    if (dateFromParams) {
      console.log('Date from URL params:', dateFromParams);
      setSelectedDate(dateFromParams);
      
      // When coming from URL params (list view), update the selectedMonth
      const [year, month] = dateFromParams.split('-');
      const newSelectedMonth = `${year}-${month}-01`;
      console.log('Setting selectedMonth from URL params:', newSelectedMonth);
      setSelectedMonth(newSelectedMonth);
    }
  }, [dateFromParams]);

  // Ensure we're showing the current month when the app starts
  useEffect(() => {
    // Initialize with the current month from selectedDate
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      const newSelectedMonth = `${year}-${month}-01`;
      console.log('Initial render, setting selectedMonth from selectedDate:', newSelectedMonth);
      
      // Only update if different to avoid infinite loop
      if (selectedMonth !== newSelectedMonth) {
        setSelectedMonth(newSelectedMonth);
      }
    }
  }, []);

  // We no longer automatically update selectedMonth when selectedDate changes
  // This allows the month view and list view to show different months
  // The month is only updated when explicitly changing months or when coming from URL params

  const handleDayPress = (date: string) => {
    console.log('Day pressed:', date);
    setSelectedDate(date);
    
    // Update selectedMonth to match the selected date
    // This is needed when clicking on a day in the calendar view
    const [year, month] = date.split('-');
    const newSelectedMonth = `${year}-${month}-01`;
    console.log('Setting selectedMonth from day press:', newSelectedMonth);
    setSelectedMonth(newSelectedMonth);
  };

  const handleMonthChange = (month: string) => {
    // Extract year and month from the date string
    const [year, monthNum] = month.split('-');
    // Create a new date string with the first day of the month
    const newSelectedMonth = `${year}-${monthNum}-01`;
    setSelectedMonth(newSelectedMonth);
  };

  // Navigate to the previous month
  const goToPreviousMonth = () => {
    console.log('goToPreviousMonth called, current selectedMonth:', selectedMonth);
    
    // Parse the current selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    console.log('Parsed year:', year, 'month:', month);
    
    // Calculate the previous month
    let prevMonth = month - 1;
    let prevYear = year;
    
    // Handle year change if needed
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    // Format the new month string
    const newSelectedMonth = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01`;
    console.log('Going to previous month:', newSelectedMonth);
    setSelectedMonth(newSelectedMonth);
  };

  // Navigate to the next month
  const goToNextMonth = () => {
    console.log('goToNextMonth called, current selectedMonth:', selectedMonth);
    
    // Parse the current selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    console.log('Parsed year:', year, 'month:', month);
    
    // Calculate the next month
    let nextMonth = month + 1;
    let nextYear = year;
    
    // Handle year change if needed
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    
    // Format the new month string
    const newSelectedMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    console.log('Going to next month:', newSelectedMonth);
    setSelectedMonth(newSelectedMonth);
  };

  const getToggleIcon = () => {
    return currentView === 'month' ? 'list.bullet' : 'calendar';
  };

  const handleToggle = () => {
    // Log the current state before toggling
    console.log('Before toggle - currentView:', currentView);
    console.log('Before toggle - selectedDate:', selectedDate);
    console.log('Before toggle - selectedMonth:', selectedMonth);
    
    const newView = currentView === 'month' ? 'dayList' : 'month';
    
    // When toggling views, we don't need to change the selectedMonth
    // This allows the month view and list view to show the same month
    
    console.log('After toggle - newView:', newView);
    console.log('After toggle - selectedMonth remains:', selectedMonth);
    
    setCurrentView(newView);
  };

  const formatSelectedDate = (dateString: string) => {
    // For debugging
    console.log('Formatting date:', dateString);
    
    // Parse the date string directly to avoid timezone issues
    // Format: YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date object with these values at noon to avoid timezone shifts
    // This will work correctly in any timezone, including Korea
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    console.log('Parsed date object:', date.toString());
    
    // Format the date in the user's local timezone
    // This will automatically use the user's locale and timezone settings
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateString: string) => {
    console.log('formatMonthYear called with:', dateString);
    
    try {
      // Parse the date string
      const [year, month] = dateString.split('-').map(Number);
      
      // Create a new Date object with the 1st day of the month at noon
      // Using noon (12:00) helps avoid timezone-related date shifts
      // This will work correctly in any timezone, including Korea
      const date = new Date(year, month - 1, 1, 12, 0, 0);
      
      console.log('Parsed date:', date.toString());
      
      // Format the date to show month and year in the user's locale
      // This will automatically use the user's locale settings
      const formatted = date.toLocaleString(undefined, { 
        month: 'long', 
        year: 'numeric' 
      });
      
      console.log('Formatted month/year:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting month/year:', error);
      return dateString; // Return the original string if there's an error
    }
  };

  const handleAddEvent = (time: string, duration: number) => {
    console.log('handleAddEvent called with time:', time, 'duration:', duration);
    console.log('Current selectedDate:', selectedDate);
    
    // Store the event details for the modal
    setNewEventTime(time);
    
    // Parse the time string to get the hour and minute
    const timeComponents = time.split('T')[1].split(':');
    const hour = parseInt(timeComponents[0]);
    const minute = parseInt(timeComponents[1]);
    
    // Create a new date object with the current time (not date)
    // We only care about the time part here
    const startDate = new Date();
    startDate.setHours(hour, minute, 0, 0);
    
    console.log('Created startDate with time:', startDate.toLocaleTimeString());
    setNewEventStartDate(startDate);
    
    // Set end date by adding the duration
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);
    setNewEventEndDate(endDate);
    
    // Clear the title field instead of setting a default value
    setNewEventTitle('');
    setIsEditMode(false);
    setEditingAppointmentId(null);
    
    // Show the modal to edit the event details
    setModalVisible(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    // Parse the time string directly without timezone conversion
    // Format is: YYYY-MM-DDTHH:MM:SS
    const [datePart, timePart] = appointment.startTime.split('T');
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create a date object with these values
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    setNewEventStartDate(startDate);
    
    // Calculate end date based on duration
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + appointment.duration);
    setNewEventEndDate(endDate);
    
    setNewEventTitle(appointment.title);
    setIsEditMode(true);
    setEditingAppointmentId(appointment.id);
    
    // Show the modal to edit the appointment
    setModalVisible(true);
  };

  // Add animation functions
  const animateTimeInput = (isStart: boolean) => {
    const animValue = isStart ? startTimeAnimatedValue : endTimeAnimatedValue;
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const showStartTimePicker = () => {
    setTimePickerMode('start');
    setShowTimePicker(true);
    animateTimeInput(true);
  };

  const showEndTimePicker = () => {
    setTimePickerMode('end');
    setShowTimePicker(true);
    animateTimeInput(false);
  };

  const handleTimeSelection = (timeString: string) => {
    const selectedDate = parseTimeString(timeString);
    
    if (timePickerMode === 'start') {
      // Update start time
      setNewEventStartDate(selectedDate);
      
      // If end time is earlier than start time, adjust end time
      if (selectedDate > newEventEndDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setMinutes(newEndDate.getMinutes() + 60);
        setNewEventEndDate(newEndDate);
      }
    } else {
      // Update end time
      // Ensure end time is after start time
      if (selectedDate > newEventStartDate) {
        setNewEventEndDate(selectedDate);
      } else {
        // If user tries to set end time before start time, show alert
        Alert.alert(
          'Invalid Time',
          'End time must be after start time.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    // This is preserved for Android
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      if (timePickerMode === 'start') {
        // Update start time
        setNewEventStartDate(selectedDate);
        
        // If end time is earlier than start time, adjust end time
        if (selectedDate > newEventEndDate) {
          const newEndDate = new Date(selectedDate);
          newEndDate.setHours(selectedDate.getHours() + 1);
          setNewEventEndDate(newEndDate);
        }
      } else {
        // Update end time
        // Ensure end time is after start time
        if (selectedDate > newEventStartDate) {
          setNewEventEndDate(selectedDate);
        } else {
          // If user tries to set end time before start time, set it to start time + 30 min
          const newEndDate = new Date(newEventStartDate);
          newEndDate.setMinutes(newEventStartDate.getMinutes() + 30);
          setNewEventEndDate(newEndDate);
          
          // Show alert
          Alert.alert(
            'Invalid Time',
            'End time must be after start time. End time has been adjusted.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  };

  const calculateDuration = (): number => {
    const diffMs = newEventEndDate.getTime() - newEventStartDate.getTime();
    return Math.round(diffMs / 60000); // Convert ms to minutes
  };

  // Apply duration preset
  const applyDurationPreset = (minutes: number) => {
    if (timePickerMode === 'start') {
      const endDate = new Date(newEventStartDate);
      endDate.setMinutes(endDate.getMinutes() + minutes);
      setNewEventEndDate(endDate);
      // Close the picker after setting both times
      setShowTimePicker(false);
    }
  };

  const formatTimeOnly = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSaveEvent = () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    const duration = calculateDuration();
    const appointmentDate = selectedDate;
    const hours = newEventStartDate.getHours();
    const minutes = newEventStartDate.getMinutes();
    const startTime = `${appointmentDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Check for conflicts with existing appointments
    const conflictingAppointment = appointments.find(appointment => {
      // Skip checking against the appointment being edited
      if (isEditMode && editingAppointmentId === appointment.id) {
        return false;
      }
      
      // Only check appointments on the same date
      if (appointment.date !== appointmentDate) {
        return false;
      }

      return checkForTimeConflict(
        startTime,
        duration,
        appointment.startTime,
        appointment.duration
      );
    });

    if (conflictingAppointment) {
      const conflictStart = new Date(conflictingAppointment.startTime);
      const conflictTimeStr = conflictStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      Alert.alert(
        'Time Conflict',
        `This appointment conflicts with "${conflictingAppointment.title}" at ${conflictTimeStr}. Please choose a different time.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // If no conflicts, proceed with saving
    if (isEditMode && editingAppointmentId) {
      editAppointment(editingAppointmentId, {
        id: editingAppointmentId,
        title: newEventTitle,
        startTime,
        duration,
        date: appointmentDate,
      });
    } else {
      addAppointment({
        id: Date.now().toString(),
        title: newEventTitle,
        startTime,
        duration,
        date: appointmentDate,
      });
    }

    setModalVisible(false);
  };

  const handleDeleteAppointment = () => {
    if (isEditMode && editingAppointmentId) {
      // Delete the appointment using the shared state
      deleteAppointment(editingAppointmentId);
      
      // Show confirmation to the user
      Alert.alert(
        'Appointment Deleted',
        `"${newEventTitle}" has been deleted`,
        [{ text: 'OK' }]
      );
      
      // Close the modal
      setModalVisible(false);
    }
  };

  // Get appointments for the selected date
  const getAppointmentsForSelectedDate = () => {
    return appointments.filter(appointment => appointment.date === selectedDate);
  };

  // Add this new function before the return statement
  const handleAppointmentDoubleTap = (date: string) => {
    // Set the selected date
    setSelectedDate(date);
    
    // Set the selected month based on the date
    const [year, month] = date.split('-');
    const newSelectedMonth = `${year}-${month}-01`;
    setSelectedMonth(newSelectedMonth);
    
    // Switch to month view
    setCurrentView('month');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.container}>
        {currentView === 'month' ? (
          <View style={styles.contentContainer}>
            <View style={styles.stickyCalendarContainer}>
              <MonthlyCalendar
                onDayPress={handleDayPress}
                onMonthChange={handleMonthChange}
                selectedDate={selectedDate}
              />
            </View>
            
            {selectedDate && (
              <View style={styles.dayScheduleWrapper}>
                <ThemedView style={styles.dayScheduleHeader}>
                  <TouchableOpacity 
                    style={styles.viewToggleButton}
                    onPress={handleToggle}
                  >
                    <ThemedText style={styles.viewToggleText}>List</ThemedText>
                    <IconSymbol 
                      size={15} 
                      name="list.bullet" 
                      color={Colors.light.tint} 
                    />
                  </TouchableOpacity>
                  <ThemedText type="subtitle" style={styles.dateHeaderText}>
                    {formatSelectedDate(selectedDate)}
                  </ThemedText>
                  <View style={styles.spacer} />
                </ThemedView>
                <ThemedView style={styles.dayScheduleContent}>
                  <DaySchedule
                    ref={dayScheduleRef}
                    selectedDate={selectedDate}
                    onAddEvent={handleAddEvent}
                    appointments={getAppointmentsForSelectedDate()}
                    onEditAppointment={handleEditAppointment}
                    onDeleteAppointment={handleDeleteAppointment}
                  />
                </ThemedView>
              </View>
            )}
          </View>
        ) : (
          <ThemedView style={styles.dayListContainer}>
            <ThemedView style={styles.dayListHeader}>
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={goToPreviousMonth}
              >
                <IconSymbol 
                  size={17} 
                  name="chevron.left" 
                  color="#555555" 
                />
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.monthTitle}>
                {formatMonthYear(selectedMonth)}
              </ThemedText>
              <View style={styles.headerRightButtons}>
                <TouchableOpacity 
                  style={styles.monthNavButton}
                  onPress={goToNextMonth}
                >
                  <IconSymbol 
                    size={17} 
                    name="chevron.right" 
                    color="#555555" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.viewToggleButton}
                  onPress={handleToggle}
                >
                  <ThemedText style={styles.viewToggleText}>Calendar</ThemedText>
                  <IconSymbol 
                    size={15} 
                    name="calendar" 
                    color={Colors.light.tint} 
                  />
                </TouchableOpacity>
              </View>
            </ThemedView>
            <DayList
              selectedMonth={selectedMonth}
              onDayPress={handleDayPress}
              selectedDate={selectedDate}
              onAppointmentDoubleTap={handleAppointmentDoubleTap}
            />
          </ThemedView>
        )}
        
        {/* Modal for creating/editing an event */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <ThemedView style={[
              styles.modalContent,
              {
                maxHeight: Platform.OS === 'ios' 
                  ? height * (showTimePicker ? 0.7 : 0.6) 
                  : height * 0.65
              }
            ]}>
              <ThemedText style={styles.modalTitle}>
                {isEditMode ? 'Edit' : 'New'} Appointment
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Add a title"
                placeholderTextColor="#bbbbbb"
                maxLength={40}
                multiline={false}
                numberOfLines={1}
              />
              
              <View style={styles.timeSection}>
                <Animated.View style={[
                  styles.timeColumn,
                  {
                    transform: [{
                      scale: startTimeAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05]
                      })
                    }]
                  }
                ]}>
                  <ThemedText style={styles.timeLabel}>Start</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      timePickerMode === 'start' && showTimePicker && styles.activeTimePickerButton
                    ]}
                    onPress={showStartTimePicker}
                  >
                    <ThemedText style={styles.timeText}>
                      {formatTimeOnly(newEventStartDate)}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[
                  styles.timeColumn,
                  {
                    transform: [{
                      scale: endTimeAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05]
                      })
                    }]
                  }
                ]}>
                  <ThemedText style={styles.timeLabel}>End</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      timePickerMode === 'end' && showTimePicker && styles.activeTimePickerButton
                    ]}
                    onPress={showEndTimePicker}
                  >
                    <ThemedText style={styles.timeText}>
                      {formatTimeOnly(newEventEndDate)}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              </View>
              
              {showTimePicker && Platform.OS === 'ios' && (
                <View style={styles.customTimePickerContainer}>
                  {/* Time period tabs */}
                  <View style={styles.timePeriodTabs}>
                    {Object.keys(timeSlots).map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.timePeriodTab,
                          activeTimeTab === period && styles.activeTimePeriodTab
                        ]}
                        onPress={() => setActiveTimeTab(period as 'morning' | 'afternoon' | 'evening')}
                      >
                        <ThemedText 
                          style={[
                            styles.timePeriodTabText,
                            activeTimeTab === period && styles.activeTimePeriodTabText
                          ]}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <ScrollView 
                    style={styles.timeSlotScrollView}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.timeSlotContainer}>
                      {timeSlots[activeTimeTab].map((timeSlot, index) => {
                        const timeDate = parseTimeString(timeSlot);
                        const isSelected = timePickerMode === 'start' 
                          ? formatTimeOnly(timeDate) === formatTimeOnly(newEventStartDate)
                          : formatTimeOnly(timeDate) === formatTimeOnly(newEventEndDate);
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlotButton,
                              isSelected && styles.selectedTimeSlot
                            ]}
                            onPress={() => handleTimeSelection(timeSlot)}
                          >
                            <ThemedText 
                              style={[
                                styles.timeSlotText,
                                isSelected && styles.selectedTimeSlotText
                              ]}
                            >
                              {timeSlot}
                            </ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                  
                  {/* Quick duration presets (only show when selecting start time) */}
                  {timePickerMode === 'start' && (
                    <View style={styles.durationPresetContainer}>
                      <ThemedText style={styles.durationPresetLabel}>
                        Quick Duration:
                      </ThemedText>
                      <View style={styles.durationPresetButtons}>
                        {durationPresets.map((preset, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.durationPresetButton}
                            onPress={() => applyDurationPreset(preset.minutes)}
                          >
                            <ThemedText style={styles.durationPresetText}>
                              {preset.label}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={timePickerMode === 'start' ? newEventStartDate : newEventEndDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleTimeChange}
                  minuteInterval={30}
                />
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText style={[styles.buttonText, { color: '#555' }]}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEvent}
                >
                  <ThemedText style={[styles.buttonText, { color: '#fff' }]}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </KeyboardAvoidingView>
        </Modal>
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
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stickyCalendarContainer: {
    maxHeight: height * 0.35,
    zIndex: 10,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayScheduleWrapper: {
    flex: 1,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#c0d0ce',
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
    fontSize: 20,
    fontFamily: 'Merriweather_700Bold',
    marginHorizontal: 10,
    color: Colors.light.text,
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
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Merriweather_700Bold',
  },
  spacer: {
    width: 80, // Match the width of the toggle button for centering
  },
  dayScheduleContent: {
    flex: 1,
  },
  toggleButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 0, // Add padding for iOS keyboard
  },
  modalContent: {
    width: modalWidth,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 15, // Slightly smaller
    marginBottom: 12, // Reduce margin
    textAlign: 'center',
    fontFamily: 'Merriweather_700Bold',
    color: Colors.light.tint,
    letterSpacing: 0.3,
  },
  modalInput: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: 0,
    padding: 6, // Reduce padding
    paddingBottom: 6,
    fontSize: 13,
    marginBottom: 16, // Reduce margin
    fontFamily: 'Merriweather_400Regular',
    backgroundColor: 'transparent',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16, // Reduce margin
  },
  timeColumn: {
    width: '48%',
  },
  timePickerButton: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: 0,
    padding: 8,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeLabel: {
    fontSize: 11,
    color: Colors.light.tint,
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '400',
  },
  customTimePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 12,
    width: '100%',
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  timePeriodTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  timePeriodTab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimePeriodTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  timePeriodTabText: {
    fontSize: 13,
    color: '#888',
  },
  activeTimePeriodTabText: {
    fontWeight: '600',
    color: Colors.light.tint,
  },
  timeSlotScrollView: {
    maxHeight: 120, // Reduce height
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  timeSlotButton: {
    width: '32%',
    padding: 8, // Reduce padding
    marginBottom: 6, // Reduce margin
    marginHorizontal: '0.66%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    minHeight: 38, // Reduce height
  },
  selectedTimeSlot: {
    backgroundColor: Colors.light.tint,
  },
  timeSlotText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '600',
  },
  durationPresetContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  durationPresetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  durationPresetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  durationPresetButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 55,
    alignItems: 'center',
  },
  durationPresetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6, // Reduce margin
  },
  modalButton: {
    padding: 10, // Reduce padding
    borderRadius: 16,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  monthNavButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTimePickerButton: {
    borderBottomColor: Colors.light.tint,
    borderBottomWidth: 2,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
    marginRight: 4,
  },
});
