import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key-here') {
      throw new Error('API Key tidak valid. Silakan periksa Gemini API key di file .env');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Gunakan model Gemini terbaru yang tersedia
    // Berdasarkan model yang tersedia di API v1
    const modelName = 'gemini-2.0-flash';
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
    });
    console.log(`Menggunakan model Gemini: ${modelName}`);
  }

  async chat(message: string, history: Array<{ role: string; content: string }> = []): Promise<string> {
    try {
      // Konversi riwayat ke format Gemini
      const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Mulai chat dengan riwayat
      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Kirim pesan
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Tangani error spesifik
      if (error.status === 403 || error.message?.includes('unregistered callers')) {
        throw new Error('API Key tidak valid atau belum diaktifkan. Silakan periksa: 1) API key sudah benar di .env, 2) Gemini API sudah diaktifkan di Google Cloud Console, 3) Billing sudah diaktifkan (jika diperlukan)');
      } else if (error.message?.includes('API key')) {
        throw new Error('API Key tidak valid. Silakan periksa Gemini API key Anda.');
      } else if (error.message?.includes('quota')) {
        throw new Error('Kuota API terlampaui. Silakan coba lagi nanti.');
      } else if (error.message?.includes('safety')) {
        throw new Error('Konten diblokir oleh filter keamanan.');
      }
      
      throw new Error('Gagal mendapatkan respons dari Gemini AI. Silakan coba lagi.');
    }
  }

  async chatWithoutHistory(message: string): Promise<string> {
    try {
      const result = await this.model.generateContent(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error('Gagal mendapatkan respons dari Gemini AI.');
    }
  }
}

export default GeminiService;
