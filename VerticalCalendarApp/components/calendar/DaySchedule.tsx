import React, { useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DayScheduleProps {
  selectedDate: string;
  onAddEvent?: (time: string) => void;
}

const DaySchedule: React.FC<DayScheduleProps> = ({ selectedDate, onAddEvent }) => {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Show only business hours (8am-8pm) for a more compact view
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  
  useEffect(() => {
    // Fade in animation when component mounts or selectedDate changes
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Reset animation when component unmounts
      fadeAnim.setValue(0);
    };
  }, [selectedDate]);
  
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
    if (hours < 8 || hours > 20) return -1;
    
    // Adjust for our 8am start time
    return (hours - 8) * 60 + minutes;
  };

  // Position the current time indicator
  const timePosition = getCurrentTimePosition();
  const indicatorTop = timePosition >= 0 ? (timePosition / 60) * 60 : -1; // 60px per hour

  // Check if the selected date is today
  const isToday = new Date().toISOString().split('T')[0] === selectedDate;

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {isToday && indicatorTop >= 0 && (
            <Animated.View 
              style={[
                styles.currentTimeIndicator, 
                { top: indicatorTop }
              ]}
            />
          )}
          {hours.map((hour) => (
            <TouchableOpacity 
              key={hour} 
              style={styles.hourRow}
              onPress={() => onAddEvent && onAddEvent(`${selectedDate}T${hour.toString().padStart(2, '0')}:00:00`)}
            >
              <ThemedView style={styles.timeColumn}>
                <ThemedText type="small" style={styles.hourText}>
                  {formatHour(hour)}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.eventColumn}>
                <ThemedView style={styles.halfHourLine} />
                {/* This is where events would be rendered */}
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: 60,
  },
  timeColumn: {
    width: 70,
    paddingRight: 10,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  hourText: {
    opacity: 0.7,
  },
  eventColumn: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#c0d0ce',
    position: 'relative',
  },
  halfHourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 30,
    borderTopWidth: 1,
    borderTopColor: '#d6e2e0',
    borderStyle: 'dashed',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 70,
    right: 0,
    height: 2,
    backgroundColor: Colors.light.tint,
    zIndex: 1000,
  },
});

export default DaySchedule; 