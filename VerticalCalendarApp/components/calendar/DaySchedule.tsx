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
  Easing,
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
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  
  // Debug the selected date
  console.log('DaySchedule selectedDate:', selectedDate);
  
  // Parse the date correctly to avoid timezone issues
  const parseSelectedDate = (dateString: string) => {
    // Create a date in UTC to avoid timezone issues
    // Format: YYYY-MM-DD -> convert to UTC date object
    return new Date(`${dateString}T12:00:00Z`);
  };
  
  const parsedDate = parseSelectedDate(selectedDate);
  console.log('DaySchedule parsed date:', parsedDate.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'  // Use UTC to avoid timezone shifts
  }));
  
  // Show full 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60; // height in pixels for one hour
  const TIME_COLUMN_WIDTH = 70;
  
  // Check if the selected date is today
  const isToday = () => {
    // Get today's date in YYYY-MM-DD format in the user's local timezone
    const today = new Date().toISOString().split('T')[0];
    
    // Compare with the selected date string directly
    // This works because both are in YYYY-MM-DD format
    return today === selectedDate;
  };
  
  const isTodayValue = isToday();
  console.log('Is today?', isTodayValue);
  
  // Add a specific effect to handle date changes
  useEffect(() => {
    // If it's not today, scroll to the top (12 AM)
    if (!isTodayValue && scrollViewRef.current) {
      console.log(`Date changed to ${selectedDate}, scrolling to top (12 AM)`);
      // Use both immediate and delayed scrolling for reliability
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
      
      // Also try with a small delay
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }, 100);
    }
  }, [selectedDate, isTodayValue]);
  
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
      
      if (isTodayValue) {
        // For today, scroll to current time minus 1 hour
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const scrollToHour = Math.max(0, currentHour - 1);
        yPosition = scrollToHour * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;
      } else {
        // For other days, scroll to 12 AM as requested
        yPosition = 0; // 0 AM = 12 AM
      }
      
      // Log for debugging
      console.log(`Scrolling to position: ${yPosition}px for date: ${selectedDate}, isToday: ${isTodayValue}`);
      
      // Use a more reliable approach with both immediate and animated scrolling
      if (scrollViewRef.current) {
        // First scroll without animation to ensure position
        scrollViewRef.current.scrollTo({ y: yPosition, animated: false });
        
        // Then scroll with animation for a smooth experience
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: yPosition, animated: true });
          }
        }, 50);
      }
    };
    
    // Call immediately and also with a small delay to ensure it works
    scrollToAppropriateTime();
    
    // Also set a timeout as a fallback
    const timeoutId = setTimeout(scrollToAppropriateTime, 300);
    
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
      clearTimeout(timeoutId);
    };
  }, [selectedDate, isTodayValue, HOUR_HEIGHT]);

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
    
    // Calculate position based on hours and minutes
    return (hours * 60) + minutes;
  };

  // Update the current time indicator position every minute
  useEffect(() => {
    if (!isTodayValue) return; // Only run for today
    
    // Function to update the position
    const updateTimeIndicatorPosition = () => {
      const timePosition = getCurrentTimePosition();
      const yPosition = (timePosition / 60) * HOUR_HEIGHT;
      
      // Update the position using state
      setCurrentTimePosition(yPosition);
      
      // Log the current time and position for debugging
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      console.log(`Current time: ${hours}:${minutes.toString().padStart(2, '0')}, Position: ${yPosition}px`);
    };
    
    // Initial update
    updateTimeIndicatorPosition();
    
    // Update every minute
    const interval = setInterval(updateTimeIndicatorPosition, 60000);
    
    return () => clearInterval(interval);
  }, [isTodayValue, HOUR_HEIGHT]);

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
      key={`day-schedule-${selectedDate}`}
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
          {isTodayValue && (
            <Animated.View
              style={[
                styles.currentTimeIndicator,
                {
                  top: currentTimePosition,
                  transform: [] // Remove the transform that was using translateY
                }
              ]}
            >
              <View style={[styles.currentTimeDot, { backgroundColor: Colors[colorScheme || 'light'].tint }]} />
              <View style={[styles.currentTimeLine, { backgroundColor: Colors[colorScheme || 'light'].tint }]} />
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
    marginRight: 5,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
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