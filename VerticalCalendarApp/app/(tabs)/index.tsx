import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Alert, TextInput, Modal, Platform, KeyboardAvoidingView } from 'react-native';
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

  // Log selectedMonth changes
  useEffect(() => {
    console.log('selectedMonth changed to:', selectedMonth);
  }, [selectedMonth]);

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

  const showStartTimePicker = () => {
    setTimePickerMode('start');
    setShowTimePicker(true);
  };

  const showEndTimePicker = () => {
    setTimePickerMode('end');
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
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
    
    // Use the selectedDate for the appointment date
    const appointmentDate = selectedDate;
    console.log('Saving appointment with date from selectedDate:', appointmentDate);
    
    // Get hours and minutes from the newEventStartDate
    // This will be in the user's local timezone (works in any timezone including Korea)
    const hours = newEventStartDate.getHours();
    const minutes = newEventStartDate.getMinutes();
    
    // Create a time string in local time (without timezone)
    // Format: YYYY-MM-DDTHH:MM:SS
    // This format preserves the exact local time regardless of timezone
    const startTime = `${appointmentDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    console.log('Final startTime with correct date (local time):', startTime);
    
    // DO NOT change the selectedMonth when saving an event
    // This ensures the month stays the same in the list view
    
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
                  size={18} 
                  name="chevron.left" 
                  color={Colors[colorScheme ?? 'light'].tint} 
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
                    size={18} 
                    name="chevron.right" 
                    color={Colors[colorScheme ?? 'light'].tint} 
                  />
                </TouchableOpacity>
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
              </View>
            </ThemedView>
            <ThemedText style={{display: 'none'}}>
              {`Debug: selectedMonth=${selectedMonth}`}
            </ThemedText>
            <DayList
              selectedMonth={selectedMonth}
              onDayPress={handleDayPress}
              selectedDate={selectedDate}
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
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                {isEditMode ? 'Edit Appointment' : 'Create New Appointment'}
              </ThemedText>
              
              <ThemedText style={styles.modalLabel}>Title</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Enter appointment title"
                placeholderTextColor="#999"
                autoCorrect={false}
                maxLength={50}
              />
              
              <View style={styles.timeSection}>
                <View style={styles.timeColumn}>
                  <ThemedText style={styles.modalLabel}>Start Time</ThemedText>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={showStartTimePicker}
                  >
                    <ThemedText>{formatTimeOnly(newEventStartDate)}</ThemedText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timeColumn}>
                  <ThemedText style={styles.modalLabel}>End Time</ThemedText>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={showEndTimePicker}
                  >
                    <ThemedText>{formatTimeOnly(newEventEndDate)}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              
              {showTimePicker && Platform.OS === 'ios' && (
                <View style={styles.pickerContainer}>
                  <ThemedText style={styles.pickerTitle}>
                    Select {timePickerMode === 'start' ? 'Start' : 'End'} Time
                  </ThemedText>
                  <DateTimePicker
                    value={timePickerMode === 'start' ? newEventStartDate : newEventEndDate}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimeChange}
                    minuteInterval={30}
                    style={styles.datePicker}
                  />
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
              
              <ThemedText style={styles.durationText}>
                Duration: {Math.floor(calculateDuration() / 60)}h {calculateDuration() % 60}m
              </ThemedText>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEvent}
                >
                  <ThemedText style={styles.buttonText}>Save</ThemedText>
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
    maxHeight: height * 0.35, // 35% of screen height
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: modalWidth,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: padding.modal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: fontSize.title,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Merriweather_700Bold',
  },
  modalLabel: {
    fontSize: fontSize.label,
    marginTop: 15,
    marginBottom: 5,
    fontFamily: 'Merriweather_700Bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: fontSize.input,
    marginBottom: 5,
    fontFamily: 'Merriweather_400Regular',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeColumn: {
    width: '48%',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  pickerContainer: {
    marginTop: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    maxHeight: height * 0.3,
  },
  datePicker: {
    height: isSmallScreen ? 150 : 200,
  },
  pickerTitle: {
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Merriweather_700Bold',
    fontSize: fontSize.label,
  },
  durationText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: fontSize.input,
    fontFamily: 'Merriweather_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: padding.button,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.button,
    fontFamily: 'Merriweather_700Bold',
  },
  monthNavButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
