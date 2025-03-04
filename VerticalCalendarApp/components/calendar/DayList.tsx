import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppointments, Appointment } from '@/hooks/useAppointments';

interface DayListProps {
  selectedMonth: string;
  onDayPress: (date: string) => void;
  selectedDate?: string;
}

const DayList: React.FC<DayListProps> = ({ selectedMonth, onDayPress, selectedDate }) => {
  const colorScheme = useColorScheme();
  const { appointments } = useAppointments();
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // Generate days for the selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const days = [];
    
    // Get the number of days in the month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= lastDay; i++) {
      const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
      const dateString = dayDate.toISOString().split('T')[0];
      
      // Initialize animation value for this date if it doesn't exist
      if (!animatedValues[dateString]) {
        animatedValues[dateString] = new Animated.Value(0);
      }
      
      days.push({
        date: dateString,
        day: i,
        dayOfWeek: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
      });
    }
    
    return days;
  };
  
  // Animate the selected date
  useEffect(() => {
    if (selectedDate) {
      // Reset all animations
      Object.keys(animatedValues).forEach(date => {
        if (date !== selectedDate) {
          Animated.timing(animatedValues[date], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }).start();
        }
      });
      
      // Ensure we have an animation value for the selected date
      if (!animatedValues[selectedDate]) {
        animatedValues[selectedDate] = new Animated.Value(0);
      }
      
      // Animate the selected date
      Animated.timing(animatedValues[selectedDate], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }).start();
    }
  }, [selectedDate]);
  
  const days = getDaysInMonth();
  
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };
  
  // Check if a date has appointments
  const hasAppointments = (dateString: string) => {
    return appointments.some(appointment => appointment.date === dateString);
  };
  
  // Get appointment count for a date
  const getAppointmentCount = (dateString: string) => {
    return appointments.filter(appointment => appointment.date === dateString).length;
  };
  
  // Get appointments for a date
  const getAppointmentsForDate = (dateString: string) => {
    return appointments.filter(appointment => appointment.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={{paddingBottom: 80}}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      bounces={true}
    >
      <ThemedView style={styles.container}>
        {days.map(({ date, day, dayOfWeek }) => {
          const isSelected = date === selectedDate;
          const dayIsToday = isToday(date);
          const dayHasAppointments = hasAppointments(date);
          const dayAppointments = getAppointmentsForDate(date);
          
          // Get animation value for this date, or create one if it doesn't exist
          if (!animatedValues[date]) {
            animatedValues[date] = new Animated.Value(0);
          }
          
          // Calculate animated styles
          const animatedScale = animatedValues[date].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.03]
          });
          
          const animatedOpacity = animatedValues[date].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          });
          
          return (
            <TouchableOpacity
              key={date}
              style={styles.dayItem}
              onPress={() => onDayPress(date)}
            >
              <Animated.View
                style={[
                  styles.dayContent,
                  { transform: [{ scale: animatedScale }] }
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumberContainer}>
                    <ThemedText
                      style={[
                        styles.dayNumber,
                        dayIsToday && styles.todayText
                      ]}
                    >
                      {day}
                    </ThemedText>
                    {dayIsToday && <View style={styles.todayDot} />}
                  </View>
                  
                  <ThemedText
                    style={[
                      styles.dayName,
                      dayIsToday && styles.todayText
                    ]}
                  >
                    {dayOfWeek}
                  </ThemedText>
                </View>
                
                {dayHasAppointments && (
                  <View style={styles.appointmentsContainer}>
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <View key={appointment.id} style={styles.appointmentItem}>
                        <View 
                          style={[
                            styles.appointmentDot, 
                            { backgroundColor: Colors[colorScheme || 'light'].tint }
                          ]} 
                        />
                        <ThemedText style={styles.appointmentTime}>
                          {formatTime(appointment.startTime)}
                        </ThemedText>
                        <ThemedText 
                          style={styles.appointmentTitle}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {appointment.title}
                        </ThemedText>
                      </View>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <ThemedText style={styles.moreAppointments}>
                        +{dayAppointments.length - 3} more
                      </ThemedText>
                    )}
                  </View>
                )}
              </Animated.View>
              
              {isSelected && (
                <Animated.View
                  style={[
                    styles.selectedIndicator,
                    {
                      opacity: animatedOpacity,
                      backgroundColor: Colors[colorScheme ?? 'light'].tint
                    }
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingVertical: 10,
  },
  dayItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 2,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  dayContent: {
    flexDirection: 'column',
    zIndex: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: 'Merriweather_700Bold',
    marginRight: 8,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Merriweather_400Regular',
  },
  todayText: {
    color: Colors.light.tint,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
    marginLeft: -4,
    marginTop: -10,
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1,
  },
  appointmentsContainer: {
    marginTop: 4,
    paddingLeft: 4,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  appointmentTime: {
    fontSize: 12,
    marginRight: 6,
    opacity: 0.8,
    minWidth: 60,
  },
  appointmentTitle: {
    fontSize: 13,
    flex: 1,
  },
  moreAppointments: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    opacity: 0.7,
  },
});

export default DayList; 