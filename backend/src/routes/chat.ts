import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database';
import GroqService from '../services/groq';
import { ChatRequest } from '../types';

const router = Router();

// Inisialisasi layanan
const db = new DatabaseService();

// Inisialisasi lazy untuk layanan Groq
let groq: GroqService;
const getGroqService = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY tidak ditemukan di environment variables');
    }
    groq = new GroqService(apiKey);
  }
  return groq;
};

// POST /api/chat - Kirim pesan ke Gemini
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId: providedSessionId } = req.body as ChatRequest;

    // Validasi input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message tidak boleh kosong' });
    }

    if (message.length > 10000) {
      return res.status(400).json({ error: 'Message terlalu panjang (maksimal 10000 karakter)' });
    }

    // Buat atau gunakan session ID yang ada
    const sessionId = providedSessionId || uuidv4();
    const timestamp = new Date().toISOString();

    // Ambil riwayat percakapan
    let history;
    try {
      history = await db.getHistory(sessionId);
    } catch (dbError: any) {
      console.error('Database error when getting history:', dbError);
      return res.status(500).json({ error: 'Gagal mengambil riwayat percakapan' });
    }

    // Simpan pesan pengguna
    try {
      await db.saveMessage({
        sessionId,
        role: 'user',
        content: message,
        timestamp
      });
    } catch (dbError: any) {
      console.error('Database error when saving user message:', dbError);
      return res.status(500).json({ error: 'Gagal menyimpan pesan' });
    }

    // Dapatkan respons dari Groq
    const reply = await getGroqService().chat(message, history);

    // Validasi respons
    if (!reply || reply.trim().length === 0) {
      throw new Error('Respons dari AI kosong. Silakan coba lagi.');
    }

    // Simpan respons asisten
    const assistantTimestamp = new Date().toISOString();
    try {
      await db.saveMessage({
        sessionId,
        role: 'assistant',
        content: reply,
        timestamp: assistantTimestamp
      });
    } catch (dbError: any) {
      console.error('Database error when saving assistant message:', dbError);
      // Jangan gagalkan request jika save gagal - respons sudah diberikan
    }

    res.json({
      reply,
      sessionId,
      timestamp: assistantTimestamp
    });
  } catch (error: any) {
    console.error('Chat error:', error);

    // Tangani jenis error spesifik dengan pesan yang lebih informatif
    let errorMessage = 'Terjadi kesalahan saat memproses pesan';
    let statusCode = 500;

    if (error.message) {
      // Error terkait API key
      if (error.message.includes('API Key') || error.message.includes('API key')) {
        errorMessage = 'Konfigurasi API tidak valid. Silakan periksa GROQ_API_KEY di file .env';
        statusCode = 500;
      }
      // Error terkait kuota
      else if (error.message.includes('Kuota') || error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'Kuota API terlampaui. Silakan coba lagi dalam beberapa saat.';
        statusCode = 429;
      }
      // Error terkait jaringan
      else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Gagal terhubung ke server AI. Silakan periksa koneksi internet Anda.';
        statusCode = 503;
      }
      else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      error: errorMessage
    });
  }
});

// GET /api/history/:sessionId - Ambil riwayat chat untuk sesi
router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = await db.getHistory(sessionId);

    res.json({
      sessionId,
      messages: history
    });
  } catch (error: any) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
  }
});

// GET /api/sessions - Ambil semua sesi chat
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await db.getAllSessions();
    res.json({ sessions });
  } catch (error: any) {
    console.error('Sessions error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar sesi' });
  }
});

// DELETE /api/history/:sessionId - Hapus sesi chat
router.delete('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const success = await db.deleteSession(sessionId);

    if (success) {
      res.json({ message: 'Sesi berhasil dihapus' });
    } else {
      res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Gagal menghapus sesi' });
  }
});

// POST /api/export - Ekspor riwayat chat
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const history = await db.exportHistory(sessionId);

    res.json({
      data: history,
      exportedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Gagal mengekspor riwayat' });
  }
});

// POST /api/import - Impor riwayat chat
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }

    const success = await db.importHistory(data);

    if (success) {
      res.json({ message: 'Riwayat berhasil diimpor' });
    } else {
      res.status(500).json({ error: 'Gagal mengimpor riwayat' });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Gagal mengimpor riwayat' });
  }
});

// DELETE /api/clear - Hapus semua riwayat
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    await db.clearAllHistory();
    res.json({ message: 'Semua riwayat berhasil dihapus' });
  } catch (error: any) {
    console.error('Clear error:', error);
    res.status(500).json({ error: 'Gagal menghapus riwayat' });
  }
});

export default router;
