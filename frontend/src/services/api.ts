import { Message, ChatResponse, ChatHistory } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.fetchWithErrorHandling<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async getHistory(sessionId: string): Promise<{ sessionId: string; messages: Message[] }> {
    return this.fetchWithErrorHandling(`/api/history/${sessionId}`);
  }

  async getAllSessions(): Promise<{ sessions: ChatHistory[] }> {
    return this.fetchWithErrorHandling('/api/sessions');
  }

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    return this.fetchWithErrorHandling(`/api/history/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async exportHistory(sessionId?: string): Promise<{ data: ChatHistory[]; exportedAt: string }> {
    return this.fetchWithErrorHandling('/api/export', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async importHistory(data: ChatHistory[]): Promise<{ message: string }> {
    return this.fetchWithErrorHandling('/api/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async clearAllHistory(): Promise<{ message: string }> {
    return this.fetchWithErrorHandling('/api/clear', {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.fetchWithErrorHandling('/health');
  }
}

export default new ApiService();
