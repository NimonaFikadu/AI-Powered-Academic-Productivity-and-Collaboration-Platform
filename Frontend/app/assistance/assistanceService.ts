import { API_ENDPOINTS } from '@/config/apiConfig';
import { authService } from '../auth/authService';
import { extractApiError } from '@/lib/apiError';
import { SendMessageRequest, SendMessageResponse } from './types';

// Helper function to check if we're on the server
const isServer = () => typeof window === 'undefined';

// --- AI Health Tracking ---
// Tracks consecutive failures so the UI can warn users before they even try
let aiFailureCount = 0;
let aiUnstableUntil = 0; // timestamp when the unstable window expires

const AI_UNSTABLE_THRESHOLD = 2;   // failures before marking unstable
const AI_UNSTABLE_DURATION_MS = 60_000; // 60 seconds cooldown

/**
 * Returns true if AI services are currently considered unstable
 * (too many recent failures and still within the cooldown window)
 */
export const isAiUnstable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return aiFailureCount >= AI_UNSTABLE_THRESHOLD && Date.now() < aiUnstableUntil;
};

/** Called after a successful AI response — resets the failure counter */
const recordAiSuccess = () => {
  aiFailureCount = 0;
  aiUnstableUntil = 0;
};

/** Called after an AI failure — increments counter and sets cooldown window */
const recordAiFailure = () => {
  aiFailureCount += 1;
  aiUnstableUntil = Date.now() + AI_UNSTABLE_DURATION_MS;
};

export const assistanceService = {
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot send message on server side');
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      let response: Response;
      try {
        // Call the RAG chat API endpoint
        response = await fetch(`${API_ENDPOINTS.RAG.CHAT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } catch (fetchErr: unknown) {
        // fetch() itself threw — network-level failure (ETIMEDOUT, ECONNRESET, etc.)
        recordAiFailure();
        const netErr = new Error('Network error — could not reach AI service') as Error & { status: number; errorClass: string };
        netErr.status = 0;
        netErr.errorClass = 'network';
        throw netErr;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = extractApiError(errorData, 'Failed to send message');
        const err = new Error(message) as Error & { status: number; errorClass: string };
        err.status = response.status;
        // Tag AI-level failures vs auth/validation errors
        if (response.status >= 500) {
          err.errorClass = 'ai_down';
          recordAiFailure();
        }
        throw err;
      }

      const responseData = await response.json();
      recordAiSuccess();
      
      // The API returns { message, topicId, topicTitle, timestamp }
      return {
        message: responseData.message || responseData.response || responseData.content || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[LOG assistance] ========= Error sending message:', error);
      throw error;
    }
  },
  
  async getTopicMaterialsCount(topicId: string): Promise<number> {
    try {
      if (isServer()) {
        return 0;
      }
      
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call the API to get materials for the topic
      const response = await fetch(API_ENDPOINTS.MATERIALS.BY_TOPIC(topicId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to get topic materials'));
      }

      // The response is an array of materials, so we count its length
      const materials = await response.json();
      return Array.isArray(materials) ? materials.length : 0;
    } catch (error) {
      console.error('[LOG assistance] ========= Error getting topic materials count:', error);
      // Return 0 as a fallback
      return 0;
    }
  }
};