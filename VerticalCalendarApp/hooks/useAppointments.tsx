import { useState, useEffect, createContext, useContext } from 'react';

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

  // Load appointments from storage on mount
  useEffect(() => {
    // In a real app, you would load from AsyncStorage or a database
    // For now, we'll just use an empty array
  }, []);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
    // In a real app, you would save to AsyncStorage or a database
  };

  const editAppointment = (id: string, updatedAppointment: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === id 
          ? { ...appointment, ...updatedAppointment } 
          : appointment
      )
    );
    // In a real app, you would save to AsyncStorage or a database
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
    // In a real app, you would save to AsyncStorage or a database
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