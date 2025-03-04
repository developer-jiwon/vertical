import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Appointment interface
export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
}

// Define the context type
interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  editAppointment: (id: string, updatedAppointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
}

// Storage key for appointments
const STORAGE_KEY = 'vertical_calendar_appointments';

// Create the context with default values
const AppointmentsContext = createContext<AppointmentsContextType>({
  appointments: [],
  addAppointment: () => {},
  editAppointment: () => {},
  deleteAppointment: () => {},
});

// Create a provider component
export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load appointments from storage on mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const storedAppointments = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedAppointments) {
          setAppointments(JSON.parse(storedAppointments));
        }
      } catch (error) {
        console.error('Failed to load appointments from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Save appointments to storage whenever they change
  useEffect(() => {
    const saveAppointments = async () => {
      if (!isLoading) { // Only save after initial load is complete
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
        } catch (error) {
          console.error('Failed to save appointments to storage:', error);
        }
      }
    };

    saveAppointments();
  }, [appointments, isLoading]);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };

  const editAppointment = (id: string, updatedAppointment: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === id 
          ? { ...appointment, ...updatedAppointment } 
          : appointment
      )
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  };

  return (
    <AppointmentsContext.Provider 
      value={{ 
        appointments, 
        addAppointment, 
        editAppointment, 
        deleteAppointment 
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

// Create a hook to use the context
export function useAppointments() {
  return useContext(AppointmentsContext);
} 