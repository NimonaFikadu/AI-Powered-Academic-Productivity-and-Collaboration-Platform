import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/apiConfig';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'personal' | 'group';
  location: string;
  is_online: number;
  meeting_link: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  creator_name: string;
  participant_names: string[];
  participant_count: number;
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  fetchEvents: (type?: string) => Promise<void>;
  createEvent: (eventData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateEvent: (id: string, eventData: any) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
}

// Helper function to safely get token - only runs client-side
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const useCalendarEvents = (): UseCalendarEventsReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async (type?: string) => {
    const token = getToken();

    // If no token is found, silently return without fetching
    // This prevents errors for unauthenticated users
    if (!token) {
      setEvents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queryParams = type ? `?type=${type}` : '';

      const response = await fetch(`${API_ENDPOINTS.CALENDAR.GET_EVENTS}${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
      return data;
    } catch (err: any) {
      setError(err);
      console.error('[LOG fetch_events] ========= Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: any) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(API_ENDPOINTS.CALENDAR.CREATE_EVENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to create event' };
      }

      await fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err: any) {
      console.error('[LOG create_event] ========= Failed to create event:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEvent = async (id: string, eventData: any) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(API_ENDPOINTS.CALENDAR.UPDATE_EVENT(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to update event' };
      }

      await fetchEvents(); // Refresh events
      return { success: true };
    } catch (err: any) {
      console.error('[LOG update_event] ========= Failed to update event:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(API_ENDPOINTS.CALENDAR.DELETE_EVENT(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.message || 'Failed to delete event' };
      }

      await fetchEvents(); // Refresh events
      return { success: true };
    } catch (err: any) {
      console.error('[LOG delete_event] ========= Failed to delete event:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    // Only fetch events client-side
    if (typeof window !== 'undefined') {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};

export default useCalendarEvents; 