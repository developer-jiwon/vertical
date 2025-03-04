import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { router } from 'expo-router';

export default function ListScreen() {
  const colorScheme = useColorScheme();
  const { appointments, deleteAppointment } = useAppointments();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

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

  // Render appointment item
  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const isToday = item.date === today;
    const backgroundColor = colorScheme === 'dark' ? '#1c1c1e' : '#ffffff';
    
    return (
      <TouchableOpacity
        style={[
          styles.appointmentItem,
          { backgroundColor }
        ]}
        onPress={() => handleAppointmentPress(item)}
      >
        <View style={styles.appointmentHeader}>
          <ThemedText style={styles.appointmentTitle}>{item.title}</ThemedText>
          <TouchableOpacity
            onPress={() => handleDeleteAppointment(item.id, item.title)}
            style={styles.deleteButton}
          >
            <IconSymbol name="trash" size={18} color={Colors[colorScheme || 'light'].tint} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="calendar" size={16} color={Colors[colorScheme || 'light'].text} />
            <ThemedText style={styles.detailText}>
              {formatDate(item.date)} {isToday && <ThemedText style={styles.todayBadge}>(Today)</ThemedText>}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <IconSymbol name="clock" size={16} color={Colors[colorScheme || 'light'].text} />
            <ThemedText style={styles.detailText}>{formatTime(item.startTime)}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <IconSymbol name="hourglass" size={16} color={Colors[colorScheme || 'light'].text} />
            <ThemedText style={styles.detailText}>{formatDuration(item.duration)}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Appointments</ThemedText>
      </ThemedView>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton,
            filter === 'all' && { backgroundColor: Colors[colorScheme || 'light'].tint }
          ]}
          onPress={() => setFilter('all')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
              filter === 'all' && { color: '#fff' }
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'today' && styles.activeFilterButton,
            filter === 'today' && { backgroundColor: Colors[colorScheme || 'light'].tint }
          ]}
          onPress={() => setFilter('today')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'today' && styles.activeFilterText,
              filter === 'today' && { color: '#fff' }
            ]}
          >
            Today
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'upcoming' && styles.activeFilterButton,
            filter === 'upcoming' && { backgroundColor: Colors[colorScheme || 'light'].tint }
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filter === 'upcoming' && styles.activeFilterText,
              filter === 'upcoming' && { color: '#fff' }
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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <IconSymbol name="calendar.badge.exclamationmark" size={50} color={Colors[colorScheme || 'light'].text} />
          <ThemedText style={styles.emptyText}>No appointments found</ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colors[colorScheme || 'light'].tint }]}
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
  },
  activeFilterText: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
  },
  appointmentItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  appointmentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  todayBadge: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 