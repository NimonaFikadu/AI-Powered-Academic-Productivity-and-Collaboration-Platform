import { API_ENDPOINTS } from '@/config/apiConfig';
import { authService } from '../auth/authService';

export interface Topic {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  is_public: number;
  created_at: string;
  updated_at: string;
  creator_name: string;
}

export interface TopicsResponse {
  topics: Topic[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface CreateTopicData {
  title: string;
  description: string;
  isPublic: boolean;
}

export interface CreateTopicResponse {
  message: string;
  topicId: string;
}

// Helper function to check if we're on the server
const isServer = () => typeof window === 'undefined';

export const topicsService = {
  async getTopics(page: number = 1, limit: number = 10): Promise<TopicsResponse> {
    try {
      // Handle server-side rendering gracefully
      if (isServer()) {
        return {
          topics: [],
          pagination: {
            total: 0,
            page: 1,
            totalPages: 0
          }
        };
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_ENDPOINTS.TOPICS.LIST}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch topics');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG topics] ========= Error fetching topics:', error);
      throw error;
    }
  },

  async getTopic(id: string): Promise<Topic> {
    try {
      if (isServer()) {
        throw new Error('Cannot fetch topic on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.TOPICS.GET(id), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch topic');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG topics] ========= Error fetching topic:', error);
      throw error;
    }
  },
  
  async createTopic(data: CreateTopicData): Promise<CreateTopicResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot create topic on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.TOPICS.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          isPublic: data.isPublic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create topic');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG topics] ========= Error creating topic:', error);
      throw error;
    }
  },
  
  async deleteTopic(id: string): Promise<{ message: string }> {
    try {
      if (isServer()) {
        throw new Error('Cannot delete topic on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.TOPICS.DELETE(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete topic');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG topics] ========= Error deleting topic:', error);
      throw error;
    }
  },
  
  async updateTopic(id: string, data: CreateTopicData): Promise<{ message: string }> {
    try {
      if (isServer()) {
        throw new Error('Cannot update topic on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.TOPICS.UPDATE(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          isPublic: data.isPublic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update topic');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG topics] ========= Error updating topic:', error);
      throw error;
    }
  },
}; 