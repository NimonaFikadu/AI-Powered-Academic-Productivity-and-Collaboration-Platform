export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  topicId: string;
  topicTitle?: string;
  messageHistory: Message[];
}

export interface SendMessageRequest {
  message: string;
  context: {
    topicId?: string;
    previousMessages: {
      role: 'user' | 'assistant';
      content: string;
    }[];
  };
}

export interface SendMessageResponse {
  message: string;
  timestamp: Date;
  response?: string;
} 