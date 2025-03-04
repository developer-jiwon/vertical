import React, { useState, useRef } from 'react';
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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
  );
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

  const handleAddEvent = (time: string, duration: number) => {
    // Store the event details for the modal
    setNewEventTime(time);
    
    // Set start date from the selected time
    const startDate = new Date(time);
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
    // Set the appointment details in the modal
    const startDate = new Date(appointment.startTime);
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
    // Validate that title is not empty
    if (!newEventTitle.trim()) {
      Alert.alert(
        "Missing Title",
        "Please enter a title for your appointment",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Calculate duration in minutes
    const duration = calculateDuration();
    
    // Format the start time string
    const year = newEventStartDate.getFullYear();
    const month = (newEventStartDate.getMonth() + 1).toString().padStart(2, '0');
    const day = newEventStartDate.getDate().toString().padStart(2, '0');
    const hours = newEventStartDate.getHours().toString().padStart(2, '0');
    const minutes = newEventStartDate.getMinutes().toString().padStart(2, '0');
    
    const startTimeString = `${year}-${month}-${day}T${hours}:${minutes}:00`;
    
    if (isEditMode && editingAppointmentId) {
      // Update existing appointment using the shared state
      editAppointment(editingAppointmentId, {
        startTime: startTimeString,
        duration: duration,
        title: newEventTitle,
      });
      
      // Show confirmation to the user
      Alert.alert(
        'Appointment Updated',
        `"${newEventTitle}" updated from ${formatTimeOnly(newEventStartDate)} to ${formatTimeOnly(newEventEndDate)}`,
        [{ text: 'OK' }]
      );
    } else {
      // Create a new appointment using the shared state
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        date: selectedDate,
        startTime: startTimeString,
        duration: duration,
        title: newEventTitle,
      };
      
      // Add to appointments list using the shared state
      addAppointment(newAppointment);
      
      // Format the duration in a human-readable way
      const durationHours = Math.floor(duration / 60);
      const durationMinutes = duration % 60;
      let durationText = '';
      
      if (durationHours > 0) {
        durationText += `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
      }
      
      if (durationMinutes > 0) {
        if (durationText) durationText += ' ';
        durationText += `${durationMinutes} minute${durationMinutes > 1 ? 's' : ''}`;
      }
      
      // Show confirmation to the user
      Alert.alert(
        'Appointment Created',
        `"${newEventTitle}" added from ${formatTimeOnly(newEventStartDate)} to ${formatTimeOnly(newEventEndDate)} (${durationText})`,
        [{ text: 'OK' }]
      );
    }
    
    // Close the modal
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
                    minuteInterval={5}
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
                  minuteInterval={5}
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
});
