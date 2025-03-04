import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface MonthlyCalendarProps {
  onDayPress: (date: string) => void;
  onMonthChange: (month: string) => void;
  selectedDate?: string;
}

interface DayComponentProps {
  date: DateData;
  state?: string;
  marking?: any;
  onPress: (date: DateData) => void;
  onLongPress?: (date: DateData) => void;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  onDayPress,
  onMonthChange,
  selectedDate,
}) => {
  const colorScheme = useColorScheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      // Reset animation
      pulseAnim.setValue(1);
      
      // Create pulse animation sequence
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedDate]);

  const theme = {
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    calendarBackground: Colors[colorScheme ?? 'light'].background,
    textSectionTitleColor: Colors[colorScheme ?? 'light'].text,
    selectedDayBackgroundColor: Colors[colorScheme ?? 'light'].tint,
    selectedDayTextColor: '#ffffff',
    todayTextColor: Colors[colorScheme ?? 'light'].tint,
    dayTextColor: Colors[colorScheme ?? 'light'].text,
    textDisabledColor: '#d9e1e8',
    dotColor: Colors[colorScheme ?? 'light'].tint,
    selectedDotColor: '#ffffff',
    arrowColor: Colors[colorScheme ?? 'light'].tint,
    monthTextColor: Colors[colorScheme ?? 'light'].text,
    indicatorColor: Colors[colorScheme ?? 'light'].tint,
    textDayFontFamily: 'Merriweather_400Regular',
    textMonthFontFamily: 'Merriweather_700Bold',
    textDayHeaderFontFamily: 'Merriweather_400Regular',
    textDayFontWeight: '400',
    textMonthFontWeight: '700',
    textDayHeaderFontWeight: '400',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5,
      },
      week: {
        marginTop: 2,
        marginBottom: 2,
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 6,
        alignItems: 'center',
      },
      monthText: {
        fontSize: 16,
        fontFamily: 'Merriweather_700Bold',
        margin: 5,
      },
      arrow: {
        padding: 5,
      },
    },
    'stylesheet.day.basic': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        fontSize: 14,
        fontFamily: 'Merriweather_400Regular',
      },
    },
  };

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          disableTouchEvent: true,
        },
      }
    : {};

  return (
    <ThemedView style={styles.container}>
      <Calendar
        style={styles.calendar}
        theme={theme}
        onDayPress={(day: DateData) => {
          console.log('Calendar day pressed:', day);
          console.log('Calendar dateString format:', day.dateString, '(YYYY-MM-DD)');
          // The dateString is already in YYYY-MM-DD format which is timezone-safe
          onDayPress(day.dateString);
        }}
        onMonthChange={(month: DateData) => onMonthChange(month.dateString)}
        markedDates={markedDates}
        enableSwipeMonths={true}
        hideExtraDays={false}
        customDayComponent={(props: DayComponentProps) => {
          const isSelected = props.date.dateString === selectedDate;
          return (
            <TouchableOpacity
              style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
              ]}
              onPress={() => props.onPress(props.date)}
            >
              {isSelected ? (
                <Animated.View 
                  style={[
                    styles.selectedDayInner,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <ThemedText 
                    style={styles.selectedDayText}
                  >
                    {props.date.day}
                  </ThemedText>
                </Animated.View>
              ) : (
                <ThemedText 
                  style={[
                    styles.dayText,
                    props.date.dateString === new Date().toISOString().split('T')[0] && styles.todayText
                  ]}
                >
                  {props.date.day}
                </ThemedText>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    margin: 5,
  },
  calendar: {
    paddingBottom: 5,
    height: 280,
  },
  dayContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: 'transparent',
  },
  selectedDayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Merriweather_400Regular',
    color: '#000',
  },
  selectedDayText: {
    fontSize: 14,
    fontFamily: 'Merriweather_400Regular',
    color: '#fff',
  },
  todayText: {
    color: Colors.light.tint,
    fontFamily: 'Merriweather_700Bold',
  },
});

export default MonthlyCalendar; 