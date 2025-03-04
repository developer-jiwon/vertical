import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { router } from 'expo-router';
import Checkbox from 'expo-checkbox';

export default function ListScreen() {
  const colorScheme = useColorScheme();
  const { appointments, deleteAppointment } = useAppointments();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'today') return appointment.date === today;
    if (filter === 'upcoming') {
      return appointment.date >= today;
    }
    return true;
  });

  // Sort appointments by date and time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    // First sort by date
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // Then sort by time
    return a.startTime.localeCompare(b.startTime);
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
    router.navigate("/(tabs)");
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

  // Toggle checkbox
  const toggleCheckbox = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render appointment item
  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const isToday = item.date === today;
    const isChecked = checkedItems[item.id] || false;
    
    // Use original color scheme
    const cardBg = colorScheme === 'dark' ? '#1c1c1e' : '#ffffff';
    const accentColor = Colors[colorScheme || 'light'].tint;
    
    return (
      <View
        style={[
          styles.appointmentItem,
          { 
            backgroundColor: cardBg,
            borderLeftColor: isChecked ? '#78788c' : accentColor,
            opacity: isChecked ? 0.7 : 1
          }
        ]}
      >
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
              <IconSymbol 
                name="checkmark" 
                size={14} 
                color="#ffffff" 
              />
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.appointmentContent}
          onPress={() => handleAppointmentPress(item)}
        >
          <View style={styles.appointmentHeader}>
            <ThemedText 
              style={[
                styles.appointmentTitle,
                isChecked && styles.checkedText
              ]}
            >
              {item.title}
            </ThemedText>
          </View>
          
          <View style={styles.appointmentDetails}>
            <View style={styles.detailRow}>
              <IconSymbol 
                name="calendar" 
                size={14} 
                color={accentColor} 
              />
              <ThemedText 
                style={[
                  styles.detailText,
                  isChecked && styles.checkedText
                ]}
              >
                {formatDate(item.date)} {isToday && <ThemedText style={styles.todayBadge}>Today</ThemedText>}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <IconSymbol 
                name="clock" 
                size={14} 
                color={accentColor} 
              />
              <ThemedText 
                style={[
                  styles.detailText,
                  isChecked && styles.checkedText
                ]}
              >
                {formatTime(item.startTime)} • {formatDuration(item.duration)}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleDeleteAppointment(item.id, item.title)}
          style={styles.deleteButton}
        >
          <IconSymbol 
            name="trash" 
            size={18} 
            color={`${accentColor}80`} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f5f5f5' }
    ]}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton,
            filter === 'all' && { 
              backgroundColor: `${Colors[colorScheme || 'light'].tint}20`,
              borderColor: Colors[colorScheme || 'light'].tint
            }
          ]}
          onPress={() => setFilter('all')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'all' && { 
                color: Colors[colorScheme || 'light'].tint
              }
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'today' && styles.activeFilterButton,
            filter === 'today' && { 
              backgroundColor: `${Colors[colorScheme || 'light'].tint}20`,
              borderColor: Colors[colorScheme || 'light'].tint
            }
          ]}
          onPress={() => setFilter('today')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'today' && { 
                color: Colors[colorScheme || 'light'].tint
              }
            ]}
          >
            Today
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'upcoming' && styles.activeFilterButton,
            filter === 'upcoming' && { 
              backgroundColor: `${Colors[colorScheme || 'light'].tint}20`,
              borderColor: Colors[colorScheme || 'light'].tint
            }
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'upcoming' && { 
                color: Colors[colorScheme || 'light'].tint
              }
            ]}
          >
            Upcoming
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {sortedAppointments.length > 0 ? (
        <FlatList
          data={sortedAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <IconSymbol 
              name="calendar.badge.exclamationmark" 
              size={40} 
              color={Colors[colorScheme || 'light'].tint} 
            />
          </View>
          <ThemedText style={styles.emptyText}>No tasks found</ThemedText>
          <TouchableOpacity
            style={[
              styles.addButton,
              { 
                backgroundColor: Colors[colorScheme || 'light'].tint
              }
            ]}
            onPress={() => router.navigate("/(tabs)")}
          >
            <ThemedText style={styles.addButtonText}>Go to Calendar</ThemedText>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  appointmentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  checkboxContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentContent: {
    flex: 1,
    padding: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  todayBadge: {
    color: '#ff9500',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 24,
    opacity: 0.7,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 