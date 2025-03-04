import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DayListProps {
  selectedMonth: string;
  onDayPress: (date: string) => void;
  selectedDate?: string;
}

const DayList: React.FC<DayListProps> = ({ selectedMonth, onDayPress, selectedDate }) => {
  const colorScheme = useColorScheme();
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
  
  return (
    <ThemedView style={styles.container}>
      {days.map(({ date, day, dayOfWeek }) => {
        const isSelected = date === selectedDate;
        const dayIsToday = isToday(date);
        
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
  );
};

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
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
});

export default DayList; 