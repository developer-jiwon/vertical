import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Animated,
  SectionList,
  Platform,
  Vibration,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { router } from 'expo-router';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing checked items in AsyncStorage
const CHECKED_ITEMS_STORAGE_KEY = 'verticalCalendar_checkedItems';

export default function ListScreen() {
  const colorScheme = useColorScheme();
  const { appointments, deleteAppointment } = useAppointments();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const secondRotateAnim = useRef(new Animated.Value(0)).current;
  
  // Load checked items from AsyncStorage on component mount
  useEffect(() => {
    const loadCheckedItems = async () => {
      try {
        const savedItems = await AsyncStorage.getItem(CHECKED_ITEMS_STORAGE_KEY);
        if (savedItems) {
          setCheckedItems(JSON.parse(savedItems));
        }
      } catch (error) {
        console.error('Error loading checked items from AsyncStorage:', error);
      }
    };

    loadCheckedItems();
  }, []);

  // Save checked items to AsyncStorage whenever they change
  useEffect(() => {
    const saveCheckedItems = async () => {
      try {
        await AsyncStorage.setItem(CHECKED_ITEMS_STORAGE_KEY, JSON.stringify(checkedItems));
      } catch (error) {
        console.error('Error saving checked items to AsyncStorage:', error);
      }
    };

    saveCheckedItems();
  }, [checkedItems]);

  // Start animations
  useEffect(() => {
    // Create and start rotation animations with clear start/stop management
    const firstRotationAnim = Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 6000, // Slightly faster
      easing: Easing.linear,
      useNativeDriver: true
    });
    
    const secondRotationAnim = Animated.timing(secondRotateAnim, {
      toValue: 1,
      duration: 4000, // Slightly faster
      easing: Easing.linear,
      useNativeDriver: true
    });
    
    // Clear looping function for continuous rotation
    const loopFirstRotation = () => {
      rotateAnim.setValue(0); // Reset to start
      firstRotationAnim.start(loopFirstRotation); // Callback triggers next cycle
    };
    
    const loopSecondRotation = () => {
      secondRotateAnim.setValue(0); // Reset to start
      secondRotationAnim.start(loopSecondRotation); // Callback triggers next cycle
    };
    
    // Start the loops
    firstRotationAnim.start(loopFirstRotation);
    secondRotationAnim.start(loopSecondRotation);
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Cleanup function
    return () => {
      firstRotationAnim.stop();
      secondRotationAnim.stop();
    };
  }, []);
  
  // Calculate rotation interpolations
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const secondRotate = secondRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Get today's date in YYYY-MM-DD format in local timezone
  // This will work correctly in any timezone, including Korea
  const now = new Date();
  const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  // Calculate completion percentage
  useEffect(() => {
    const totalItems = appointments.length;
    const completedItems = Object.values(checkedItems).filter(Boolean).length;
    setCompletionPercentage((completedItems / totalItems) * 100 || 0);
  }, [checkedItems, appointments]);

  // Filter and group appointments by date
  const groupedAppointments = React.useMemo(() => {
    const filtered = appointments.filter(appointment => {
      if (filter === 'all') return true;
      if (filter === 'today') return appointment.date === today;
      if (filter === 'upcoming') return appointment.date >= today;
      return true;
    });

    const groups: { [key: string]: Appointment[] } = {};
    filtered.forEach(appointment => {
      if (!groups[appointment.date]) {
        groups[appointment.date] = [];
      }
      groups[appointment.date].push(appointment);
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        title: date,
        data: data.sort((a, b) => a.startTime.localeCompare(b.startTime))
      }));
  }, [appointments, filter, today]);

  // Format date for section headers
  const formatSectionDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    if (dateString === today) {
      return 'Today';
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateString === tomorrowStr) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    // Parse the time string directly without timezone conversion
    // Format is: YYYY-MM-DDTHH:MM:SS
    const [datePart, timePart] = timeString.split('T');
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create a date object with these values
    // This will work correctly in any timezone, including Korea
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format the time in the user's local timezone and locale
    // This will automatically use the user's locale settings
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Handle appointment press - navigate to calendar view with the date
  const handleAppointmentPress = (appointment: Appointment) => {
    // Navigate to calendar tab with the appointment date
    // This will trigger the useEffect in the HomeScreen component
    // which will update the selectedMonth based on the selectedDate
    router.navigate({
      pathname: "/(tabs)",
      params: { date: appointment.date }
    });
  };

  // Handle delete appointment
  const handleDeleteAppointment = (id: string, title: string) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => {
            deleteAppointment(id);
            Alert.alert('Appointment Deleted', `"${title}" has been deleted`);
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Toggle checkbox with haptic feedback and save to AsyncStorage
  const toggleCheckbox = (id: string) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 50]);
    }
    setCheckedItems(prev => {
      const newItems = {
        ...prev,
        [id]: !prev[id]
      };
      return newItems;
    });
  };

  // Render section header
  const renderSectionHeader = ({ section }: { section: { title: string, data: Appointment[] } }) => {
    const completedInSection = section.data.filter(item => checkedItems[item.id]).length;

    return (
      <View style={[
        styles.sectionHeader,
        { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f9fa' }
      ]}>
        <View style={styles.sectionTitleContainer}>
          <ThemedText style={styles.sectionTitle}>
            {formatSectionDate(section.title)}
          </ThemedText>
          <ThemedText style={styles.sectionCount}>
            {completedInSection}/{section.data.length}
          </ThemedText>
        </View>
      </View>
    );
  };

  // Render appointment item
  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const isChecked = checkedItems[item.id] || false;
    const accentColor = Colors[colorScheme || 'light'].tint;
    
    return (
      <Animated.View style={[
        styles.appointmentItem,
        { 
          backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
          opacity: isChecked ? 0.7 : 1
        }
      ]}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => toggleCheckbox(item.id)}
        >
          <View style={[
            styles.checkbox,
            {
              backgroundColor: isChecked ? accentColor : 'transparent',
              borderColor: isChecked ? 'transparent' : accentColor
            }
          ]}>
            {isChecked && (
              <IconSymbol name="checkmark" size={14} color="#ffffff" />
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.appointmentContent}
          onPress={() => handleAppointmentPress(item)}
        >
          <View style={styles.appointmentHeader}>
            <ThemedText style={[
              styles.appointmentTitle,
              isChecked && styles.checkedText
            ]}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.timeText}>
              {formatTime(item.startTime)}
            </ThemedText>
          </View>
          
          <View style={styles.appointmentDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="clock" size={14} color={accentColor} />
              <ThemedText style={[
                styles.detailText,
                isChecked && styles.checkedText
              ]}>
                {formatDuration(item.duration)}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAppointment(item.id, item.title)}
        >
          <IconSymbol name="trash" size={18} color={`${accentColor}80`} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { 
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f9fa',
          justifyContent: 'center'
        }
      ]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.topSection}>
        <View style={styles.progressCircleWrapper}>
          {/* First Orbit - no dot */}
          <Animated.View style={[
            styles.firstOrbit,
            { 
              transform: [{ rotate }],
              borderColor: 'rgba(46,93,75,0.12)'
            }
          ]}>
            {/* No dots here */}
          </Animated.View>
          
          {/* Second Orbit - no dot */}
          <Animated.View style={[
            styles.secondOrbit,
            {
              transform: [{ rotate: secondRotate }],
              borderColor: 'rgba(46,93,75,0.08)'
            }
          ]}>
            {/* No dots here */}
          </Animated.View>
          
          {/* Main progress circle */}
          <Animated.View style={[
            styles.progressCircle,
            { 
              borderColor: Colors[colorScheme || 'light'].tint,
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <ThemedText style={styles.progressNumber}>
              {Math.round(completionPercentage)}
            </ThemedText>
            <ThemedText style={styles.progressPercentSymbol}>%</ThemedText>
            <ThemedText style={styles.progressLabel}>complete</ThemedText>
          </Animated.View>
        </View>
      </View>
      
      <View style={styles.filterContainer}>
        {(['all', 'today', 'upcoming'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filter === type && styles.activeFilterChip,
              { borderColor: Colors[colorScheme || 'light'].tint }
            ]}
            onPress={() => setFilter(type)}
          >
            <IconSymbol 
              name={
                type === 'all' ? 'list.bullet' :
                type === 'today' ? 'sun.max' : 'calendar'
              } 
              size={12} 
              color={filter === type ? Colors[colorScheme || 'light'].tint : '#666'}
            />
            <ThemedText style={[
              styles.filterText,
              filter === type && [
                styles.activeFilterText,
                { color: Colors[colorScheme || 'light'].tint }
              ]
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {groupedAppointments.length > 0 ? (
        <SectionList
          sections={groupedAppointments}
          renderItem={renderAppointmentItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[
            styles.emptyIconContainer,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff' }
          ]}>
            <IconSymbol 
              name="sparkles" 
              size={32}
              color={Colors[colorScheme || 'light'].tint}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>All Clear!</ThemedText>
          <ThemedText style={styles.emptyText}>
            {filter === 'all' 
              ? "Time to add some plans ✨"
              : filter === 'today'
                ? "Nothing planned for today 🌤"
                : "Your schedule is open 🎉"
            }
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: Colors[colorScheme || 'light'].tint }
            ]}
            onPress={() => router.navigate("/(tabs)")}
          >
            <IconSymbol name="plus" size={18} color="#ffffff" />
            <ThemedText style={styles.addButtonText}>New Plan</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 30,
    height: 180,
    paddingTop: 0,
    paddingBottom: 0,
  },
  progressCircleWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  progressCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  progressNumber: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 40,
    includeFontPadding: false,
  },
  progressPercentSymbol: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.6,
    textAlign: 'center',
    marginTop: -4,
  },
  progressLabel: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  orbitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  firstOrbit: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  secondOrbit: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 10,
    paddingTop: 0,
    paddingBottom: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(46,93,75,0.1)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  activeFilterText: {
    opacity: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
  },
  appointmentItem: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  checkboxContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentContent: {
    flex: 1,
    padding: 14,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: '500',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.4,
  },
  appointmentDetails: {
    marginTop: 4,
    opacity: 0.6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 24,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
}); 