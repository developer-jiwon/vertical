import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DayListProps {
  selectedMonth: string; // Format: 'YYYY-MM-DD'
  onDayPress: (date: string) => void;
  selectedDate?: string;
}

interface DayItem {
  date: string; // Format: 'YYYY-MM-DD'
  day: number;
  weekday: string;
}

const DayList: React.FC<DayListProps> = ({ selectedMonth, onDayPress, selectedDate }) => {
  const [days, setDays] = useState<DayItem[]>([]);
  const colorScheme = useColorScheme();
  const animatedValues = useRef<{[key: string]: Animated.Value}>({}).current;

  useEffect(() => {
    if (selectedMonth) {
      const daysInMonth = generateDaysForMonth(selectedMonth);
      setDays(daysInMonth);
      
      // Initialize animated values for each day
      daysInMonth.forEach(day => {
        if (!animatedValues[day.date]) {
          animatedValues[day.date] = new Animated.Value(1);
        }
      });
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedDate && animatedValues[selectedDate]) {
      // Reset animation
      animatedValues[selectedDate].setValue(1);
      
      // Create pulse animation
      Animated.sequence([
        Animated.timing(animatedValues[selectedDate], {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[selectedDate], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedDate]);

  const generateDaysForMonth = (dateString: string): DayItem[] => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    const daysArray: DayItem[] = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, i);
      const weekday = weekdays[currentDate.getDay()];
      const formattedDate = `${year}-${month}-${i.toString().padStart(2, '0')}`;
      
      daysArray.push({
        date: formattedDate,
        day: i,
        weekday,
      });
    }
    
    return daysArray;
  };

  const renderDayItem = ({ item }: { item: DayItem }) => {
    const isSelected = selectedDate === item.date;
    const isToday = new Date().toISOString().split('T')[0] === item.date;
    const animatedStyle = {
      transform: [{ scale: animatedValues[item.date] || new Animated.Value(1) }]
    };
    
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.dayItem,
            isSelected && { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
          ]}
          onPress={() => onDayPress(item.date)}
        >
          <ThemedView style={styles.dayContainer}>
            <ThemedView 
              style={[
                styles.dayNumber, 
                isSelected && { backgroundColor: Colors[colorScheme ?? 'light'].tint }
              ]}
            >
              <ThemedText 
                type={isToday ? 'defaultBold' : 'default'}
                style={[
                  styles.dayNumberText,
                  isSelected && styles.selectedDayNumberText
                ]}
              >
                {item.day}
              </ThemedText>
            </ThemedView>
            <ThemedText 
              type={isToday ? 'defaultItalic' : 'default'}
              style={styles.weekday}
            >
              {item.weekday}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={days}
      renderItem={renderDayItem}
      keyExtractor={(item) => item.date}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 70, // Add padding for the bottom button
  },
  dayItem: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dayNumberText: {
    fontSize: 18,
  },
  selectedDayNumberText: {
    color: '#ffffff',
  },
  weekday: {
    fontSize: 16,
  },
});

export default DayList; 