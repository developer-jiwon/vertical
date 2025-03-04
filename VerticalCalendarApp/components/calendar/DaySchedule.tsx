import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  Animated,
  Text,
  GestureResponderEvent,
  PanResponder,
  Alert,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
}

interface DayScheduleProps {
  selectedDate: string;
  onAddEvent?: (time: string, duration: number) => void;
  appointments?: Appointment[];
  onEditAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
}

const DaySchedule = forwardRef<ScrollView, DayScheduleProps>(({ selectedDate, onAddEvent, appointments = [], onEditAppointment, onDeleteAppointment }, ref) => {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const currentTimeAnimValue = useRef(new Animated.Value(0)).current;
  const [swipingAppointmentId, setSwipingAppointmentId] = useState<string | null>(null);
  const swipeAnimValues = useRef<{[key: string]: Animated.Value}>({}).current;
  
  // Show full 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60; // height in pixels for one hour
  const TIME_COLUMN_WIDTH = 70;
  
  // Check if the selected date is today
  const isToday = new Date().toISOString().split('T')[0] === selectedDate;
  
  useEffect(() => {
    // Fade in animation when component mounts or selectedDate changes
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Scroll to appropriate time based on selected date
    const scrollToAppropriateTime = () => {
      let yPosition = 0;
      
      if (isToday) {
        // For today, scroll to current time minus 1 hour
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const scrollToHour = Math.max(0, currentHour - 1);
        yPosition = scrollToHour * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;
      } else {
        // For other days, scroll to 8 AM as a reasonable starting point
        yPosition = 8 * HOUR_HEIGHT;
      }
      
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: yPosition, animated: true });
        }
      }, 500);
    };
    
    scrollToAppropriateTime();
    
    // Start animation for current time indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(currentTimeAnimValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(currentTimeAnimValue, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => {
      // Reset animation when component unmounts
      fadeAnim.setValue(0);
    };
  }, [selectedDate, isToday]);

  // Initialize swipe animation values for appointments
  useEffect(() => {
    // Create animation values for new appointments
    appointments.forEach(appointment => {
      if (!swipeAnimValues[appointment.id]) {
        swipeAnimValues[appointment.id] = new Animated.Value(0);
      }
    });
    
    // Clean up animation values for deleted appointments
    Object.keys(swipeAnimValues).forEach(id => {
      if (!appointments.find(appointment => appointment.id === id)) {
        delete swipeAnimValues[id];
      }
    });
  }, [appointments]);

  const handleTimeSlotPress = (hour: number, event: GestureResponderEvent) => {
    if (onAddEvent) {
      // Calculate exact minutes based on touch position
      const yOffset = event.nativeEvent.locationY;
      const minutesWithinHour = Math.floor((yOffset / HOUR_HEIGHT) * 60);
      const totalMinutes = hour * 60 + minutesWithinHour;
      
      // Round to nearest 5 minutes for better UX
      const roundedMinutes = Math.round(totalMinutes / 5) * 5;
      const finalHour = Math.floor(roundedMinutes / 60);
      const finalMinute = roundedMinutes % 60;
      
      // Format time string
      const timeString = `${selectedDate}T${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}:00`;
      
      // Default duration: 1 hour
      const duration = 60;
      
      // Only call the callback to show the modal
      onAddEvent(timeString, duration);
    }
  };
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Calculate current time position for the indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Only show indicator during business hours
    if (hours < 8 || hours >= 20) {
      return -1000; // Position off-screen
    }
    
    // Calculate position based on hours and minutes since start hour
    return ((hours - 8) * 60) + ((minutes / 60) * 60);
  };

  // Position the current time indicator
  const timePosition = getCurrentTimePosition();
  const indicatorTop = (timePosition / 60) * HOUR_HEIGHT;

  // Format minutes to time string (e.g. 90 -> "1:30 AM")
  const formatTimeFromMinutes = (minutes: number) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    if (hour === 0) {
      return `12:${minute.toString().padStart(2, '0')} AM`;
    }
    if (hour === 12) {
      return `12:${minute.toString().padStart(2, '0')} PM`;
    }
    return hour < 12 
      ? `${hour}:${minute.toString().padStart(2, '0')} AM` 
      : `${hour - 12}:${minute.toString().padStart(2, '0')} PM`;
  };

  // Convert ISO time string to minutes from midnight
  const timeStringToMinutes = (timeString: string): number => {
    const date = new Date(timeString);
    return date.getHours() * 60 + date.getMinutes();
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    if (onEditAppointment) {
      onEditAppointment(appointment);
    }
  };

  const SWIPE_THRESHOLD = 80; // Reduced threshold to make deletion easier

  const createPanResponder = (appointment: Appointment) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements that are more significant than vertical ones
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setSwipingAppointmentId(appointment.id);
        // Reset any ongoing animations
        swipeAnimValues[appointment.id].setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow right swipe (positive dx) with a maximum value
        if (gestureState.dx > 0) {
          // Apply some resistance as the swipe gets further
          const resistance = gestureState.dx > 100 ? 0.5 : 1;
          swipeAnimValues[appointment.id].setValue(gestureState.dx * resistance);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Show confirmation dialog before deleting
          Alert.alert(
            "Delete Appointment",
            `Are you sure you want to delete "${appointment.title}"?`,
            [
              {
                text: "Cancel",
                onPress: () => {
                  // Animate back to original position if user cancels
                  Animated.spring(swipeAnimValues[appointment.id], {
                    toValue: 0,
                    friction: 6,
                    tension: 80,
                    useNativeDriver: true,
                  }).start(() => {
                    setSwipingAppointmentId(null);
                  });
                },
                style: "cancel"
              },
              { 
                text: "Delete", 
                onPress: () => {
                  // Swipe completed - animate off screen with acceleration
                  Animated.timing(swipeAnimValues[appointment.id], {
                    toValue: 500, // Move far to the right
                    duration: 250, // Faster animation
                    useNativeDriver: true,
                  }).start(() => {
                    // Delete the appointment
                    if (onDeleteAppointment) {
                      onDeleteAppointment(appointment.id);
                    }
                  });
                },
                style: "destructive"
              }
            ]
          );
        } else {
          // Swipe not completed - animate back to original position with spring for bounce effect
          Animated.spring(swipeAnimValues[appointment.id], {
            toValue: 0,
            friction: 6, // Higher friction for less oscillation
            tension: 80, // Higher tension for faster return
            useNativeDriver: true,
          }).start(() => {
            setSwipingAppointmentId(null);
          });
        }
      },
      onPanResponderTerminate: () => {
        // If the gesture is terminated for any reason, reset position
        Animated.spring(swipeAnimValues[appointment.id], {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start(() => {
          setSwipingAppointmentId(null);
        });
      }
    });
  };

  const renderAppointments = () => {
    return appointments.map((appointment) => {
      const startMinutes = timeStringToMinutes(appointment.startTime);
      const top = (startMinutes / 60) * HOUR_HEIGHT;
      const height = (appointment.duration / 60) * HOUR_HEIGHT;
      
      // Only render if within business hours
      if (startMinutes < 8 * 60 || startMinutes >= 20 * 60) {
        return null;
      }
      
      // Initialize animation value if needed
      if (!swipeAnimValues[appointment.id]) {
        swipeAnimValues[appointment.id] = new Animated.Value(0);
      }
      
      // Create pan responder for this appointment
      const panResponder = createPanResponder(appointment);
      
      return (
        <Animated.View
          key={appointment.id}
          style={[
            styles.appointment,
            {
              top,
              height,
              left: TIME_COLUMN_WIDTH + 10,
              right: 10,
              backgroundColor: Colors[colorScheme ?? 'light'].tint + '80', // Add transparency
              transform: [{ translateX: swipeAnimValues[appointment.id] }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.appointmentContent}
            onPress={() => handleAppointmentPress(appointment)}
            disabled={swipingAppointmentId === appointment.id}
          >
            <ThemedText style={styles.appointmentTitle}>
              {appointment.title}
            </ThemedText>
            <ThemedText style={styles.appointmentTime}>
              {formatTimeFromMinutes(startMinutes)} - {formatTimeFromMinutes(startMinutes + appointment.duration)}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  return (
    <ScrollView
      ref={ref || scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={true}
      overScrollMode="auto"
    >
      <View style={styles.timelineContainer}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          {hours.map(hour => (
            <View key={`hour-${hour}`} style={styles.hourCell}>
              <ThemedText style={styles.hourText}>
                {formatHour(hour)}
              </ThemedText>
            </View>
          ))}
        </View>
        
        {/* Schedule column */}
        <View style={styles.scheduleColumn}>
          {/* Hour grid lines */}
          {hours.map(hour => (
            <TouchableOpacity
              key={`grid-${hour}`}
              style={styles.hourGrid}
              onPress={(e) => handleTimeSlotPress(hour, e)}
            >
              <View style={styles.hourGridLine} />
            </TouchableOpacity>
          ))}
          
          {/* Current time indicator */}
          {isToday && (
            <Animated.View
              style={[
                styles.currentTimeIndicator,
                {
                  transform: [{ translateY: currentTimeAnimValue }]
                }
              ]}
            >
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeLine} />
            </Animated.View>
          )}
          
          {/* Render appointments */}
          {renderAppointments()}
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    minHeight: 60 * 24, // HOUR_HEIGHT * 24
    paddingBottom: 60, // Add padding at the bottom for better scrolling
  },
  timelineContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 70,
    paddingRight: 10,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  hourCell: {
    height: 60,
  },
  hourText: {
    opacity: 0.7,
  },
  scheduleColumn: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#c0d0ce',
    position: 'relative',
  },
  hourGrid: {
    height: 60,
  },
  hourGridLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#d6e2e0',
    borderStyle: 'dashed',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 70,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 5,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'red',
  },
  appointment: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
    borderRadius: 4,
    padding: 8,
    zIndex: 100,
  },
  appointmentContent: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  appointmentTime: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default DaySchedule; 