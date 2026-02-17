import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatHistory from './components/ChatHistory';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { Message, ChatHistory as ChatHistoryType } from './types';
import apiService from './services/api';
import { downloadJSON } from './utils/helpers';
import { MessageSquare } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatHistoryType[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gulir ke bawah saat pesan berubah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Muat sesi saat komponen dimuat
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsInitializing(true);
      const { sessions: loadedSessions } = await apiService.getAllSessions();
      setSessions(loadedSessions);
      
      // Muat sesi terbaru jika tersedia
      if (loadedSessions.length > 0 && !currentSessionId) {
        const mostRecent = loadedSessions[0];
        setCurrentSessionId(mostRecent.sessionId);
        setMessages(mostRecent.messages);
      }
    } catch (err: any) {
      console.error('Gagal memuat sesi:', err);
      setError('Gagal memuat riwayat chat');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);

    // Buat session ID jika chat baru
    const sessionId = currentSessionId || uuidv4();
    
    // Tambahkan pesan pengguna segera
    const userMessage: Message = {
      sessionId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    try {
      // Kirim ke API
      const response = await apiService.sendMessage(content, sessionId);
      
      // Tambahkan respons asisten
      const assistantMessage: Message = {
        sessionId: response.sessionId,
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Muat ulang sesi untuk memperbarui sidebar
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pesan');
      
      // Hapus pesan pengguna jika gagal
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const { messages: sessionMessages } = await apiService.getHistory(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(sessionMessages);
      setError(null);
    } catch (err: any) {
      setError('Gagal memuat chat');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await apiService.deleteSession(sessionId);
      
      // Jika menghapus sesi saat ini, mulai chat baru
      if (sessionId === currentSessionId) {
        handleNewChat();
      }
      
      await loadSessions();
    } catch (err: any) {
      setError('Gagal menghapus chat');
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const { data } = await apiService.exportHistory(sessionId);
      downloadJSON(data, `chat-${sessionId}.json`);
    } catch (err: any) {
      setError('Gagal mengekspor chat');
    }
  };

  const handleExportAll = async () => {
    try {
      const { data } = await apiService.exportHistory();
      downloadJSON(data, `all-chats-${Date.now()}.json`);
    } catch (err: any) {
      setError('Gagal mengekspor semua chat');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await apiService.importHistory(data);
      await loadSessions();
      
      alert('Riwayat berhasil diimpor!');
    } catch (err: any) {
      setError('Gagal mengimpor riwayat. Pastikan format file benar.');
    }
    
    // Reset input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    try {
      await apiService.clearAllHistory();
      setSessions([]);
      handleNewChat();
    } catch (err: any) {
      setError('Gagal menghapus semua riwayat');
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Memuat aplikasi..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onExportAll={handleExportAll}
        onImport={handleImport}
        onClearAll={handleClearAll}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${
          isSidebarOpen ? 'block' : 'hidden'
        } lg:block absolute lg:relative inset-0 z-10 lg:z-0`}>
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onExportSession={handleExportSession}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Area Chat Utama */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Pesan */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Selamat Datang di Groq Chatbot
                </h2>
                <p className="text-gray-600 max-w-md">
                  Mulai percakapan dengan mengirim pesan di bawah. 
                  AI akan membantu menjawab pertanyaan Anda.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {error && <ErrorMessage message={error} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Input file tersembunyi untuk impor */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export default App;
