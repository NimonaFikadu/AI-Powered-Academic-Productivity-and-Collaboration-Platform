import { API_ENDPOINTS } from '@/config/apiConfig';
import { authService } from '../auth/authService';

export interface SharedContent {
  id: string;
  type: 'topic' | 'quiz';
  title: string;
  description: string;
  url: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedContentResponse {
  success: boolean;
  data: {
    content: SharedContent[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface CreateSharedContentData {
  content_url: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CreateSharedContentResponse {
  success: boolean;
  message: string;
  data: SharedContent;
}

export interface Comment {
  id: string;
  comment: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  success: boolean;
  data: {
    comments: Comment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface AddCommentData {
  comment: string;
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
  data: {
    comment: Comment;
    commentsCount: number;
  };
}

export interface ToggleLikeResponse {
  success: boolean;
  message: string;
  data: {
    isLiked: boolean;
    likesCount: number;
  };
}

export interface GetContentParams {
  page?: number;
  limit?: number;
  type?: 'all' | 'topic' | 'quiz';
  sort?: 'recent' | 'popular' | 'comments';
  search?: string;
}

// Helper function to check if we're on the server
const isServer = () => typeof window === 'undefined';

export const collaborationService = {
  async getSharedContent(params: GetContentParams = {}): Promise<SharedContentResponse> {
    try {
      // Handle server-side rendering gracefully
      if (isServer()) {
        return {
          success: true,
          data: {
            content: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        };
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.search) queryParams.append('search', params.search);

      const url = `${API_ENDPOINTS.COLLABORATION.LIST_CONTENT}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch shared content');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error fetching shared content:', error);
      throw error;
    }
  },

  async createSharedContent(data: CreateSharedContentData): Promise<CreateSharedContentResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot create shared content on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.COLLABORATION.CREATE_CONTENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shared content');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error creating shared content:', error);
      throw error;
    }
  },

  async toggleLike(contentId: string): Promise<ToggleLikeResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot toggle like on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.COLLABORATION.TOGGLE_LIKE(contentId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle like');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error toggling like:', error);
      throw error;
    }
  },

  async getComments(contentId: string, page: number = 1, limit: number = 10): Promise<CommentsResponse> {
    try {
      if (isServer()) {
        return {
          success: true,
          data: {
            comments: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        };
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const url = `${API_ENDPOINTS.COLLABORATION.GET_COMMENTS(contentId)}?page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch comments');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error fetching comments:', error);
      throw error;
    }
  },

  async addComment(contentId: string, data: AddCommentData): Promise<AddCommentResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot add comment on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.COLLABORATION.ADD_COMMENT(contentId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error adding comment:', error);
      throw error;
    }
  },

  async deleteSharedContent(contentId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (isServer()) {
        throw new Error('Cannot delete shared content on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(API_ENDPOINTS.COLLABORATION.DELETE_CONTENT(contentId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete shared content');
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG collaboration] ========= Error deleting shared content:', error);
      throw error;
    }
  },
};