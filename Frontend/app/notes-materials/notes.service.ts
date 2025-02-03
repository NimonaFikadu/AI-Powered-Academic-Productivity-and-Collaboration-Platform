import { API_ENDPOINTS } from '@/config/apiConfig';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  topic_id: string;
  is_private: number;
  topic_title?: string;
  creator_name?: string;
}

export interface NotesResponse {
  notes: Note[] | Note;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

// Helper function to safely get token - only runs client-side
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getAllNotes = async (): Promise<NotesResponse> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_ENDPOINTS.NOTES.LIST}?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch notes');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG notes_service] ========= Error fetching all notes:', error);
    throw error;
  }
};

export const getNotesByTopic = async (topicId: string): Promise<NotesResponse> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_ENDPOINTS.NOTES.LIST}?topic_id=${topicId}&page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch notes');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG notes_service] ========= Error fetching notes by topic:', error);
    throw error;
  }
};

export const getNote = async (noteId: string): Promise<Note> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(API_ENDPOINTS.NOTES.GET(noteId), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch note');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG notes_service] ========= Error fetching note:', error);
    throw error;
  }
};

export const createNote = async (noteData: Partial<Note>): Promise<Note> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(API_ENDPOINTS.NOTES.CREATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create note');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG notes_service] ========= Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (noteId: string, noteData: Partial<Note>): Promise<Note> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(API_ENDPOINTS.NOTES.UPDATE(noteId), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update note');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG notes_service] ========= Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(API_ENDPOINTS.NOTES.DELETE(noteId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete note');
    }
  } catch (error) {
    console.error('[LOG notes_service] ========= Error deleting note:', error);
    throw error;
  }
}; 