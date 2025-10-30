export interface Message {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  timestamp: string;
}

export interface ChatHistory {
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
