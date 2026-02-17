import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { Message, ChatHistory } from '../types';

interface Database {
  messages: Message[];
}

class DatabaseService {
  private db: any;
  private dbPath: string;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/chatbot.json');
    // Start initialization immediately but don't await in constructor
    this.initPromise = this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    const defaultData: Database = { messages: [] };
    this.db = await JSONFilePreset<Database>(this.dbPath, defaultData);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      await this.initDatabase();
    }
  }

  async saveMessage(message: Omit<Message, 'id'>): Promise<number> {
    try {
      await this.ensureInitialized();
      
      const id = this.db.data.messages.length > 0 
        ? Math.max(...this.db.data.messages.map((m: Message) => m.id || 0)) + 1 
        : 1;
      
      const newMessage: Message = {
        ...message,
        id
      };
      
      this.db.data.messages.push(newMessage);
      await this.db.write();
      
      return id;
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message to database');
    }
  }

  async getHistory(sessionId: string): Promise<Message[]> {
    try {
      await this.ensureInitialized();
      
      return this.db.data.messages
        .filter((m: Message) => m.sessionId === sessionId)
        .sort((a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    } catch (error) {
      console.error('Error getting history:', error);
      throw new Error('Failed to get chat history');
    }
  }

  async getAllSessions(): Promise<ChatHistory[]> {
    try {
      await this.ensureInitialized();
      
      const sessionMap = new Map<string, Message[]>();
      
      for (const message of this.db.data.messages) {
        if (!sessionMap.has(message.sessionId)) {
          sessionMap.set(message.sessionId, []);
        }
        sessionMap.get(message.sessionId)!.push(message);
      }
      
      const sessions: ChatHistory[] = [];
      
      for (const [sessionId, messages] of sessionMap.entries()) {
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        sessions.push({
          sessionId,
          messages: sortedMessages,
          createdAt: sortedMessages[0].timestamp,
          updatedAt: sortedMessages[sortedMessages.length - 1].timestamp
        });
      }
      
      // Urutkan sesi berdasarkan updatedAt secara menurun
      return sessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw new Error('Failed to get sessions');
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const beforeLength = this.db.data.messages.length;
      this.db.data.messages = this.db.data.messages.filter(
        (m: Message) => m.sessionId !== sessionId
      );
      
      await this.db.write();
      return this.db.data.messages.length < beforeLength;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  async clearAllHistory(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      this.db.data.messages = [];
      await this.db.write();
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      throw new Error('Failed to clear history');
    }
  }

  async exportHistory(sessionId?: string): Promise<ChatHistory[]> {
    await this.ensureInitialized();
    
    if (sessionId) {
      const messages = await this.getHistory(sessionId);
      if (messages.length === 0) return [];
      
      return [{
        sessionId,
        messages,
        createdAt: messages[0].timestamp,
        updatedAt: messages[messages.length - 1].timestamp
      }];
    }
    
    return this.getAllSessions();
  }

  async importHistory(history: ChatHistory[]): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      for (const session of history) {
        for (const message of session.messages) {
          await this.saveMessage({
            sessionId: session.sessionId,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
}

export default DatabaseService;
