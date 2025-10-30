import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database';
import GeminiService from '../services/gemini';
import { ChatRequest } from '../types';

const router = Router();

// Inisialisasi layanan
const db = new DatabaseService();

// Inisialisasi lazy untuk layanan Gemini
let gemini: GeminiService;
const getGeminiService = () => {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables');
    }
    gemini = new GeminiService(apiKey);
  }
  return gemini;
};

// POST /api/chat - Kirim pesan ke Gemini
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId: providedSessionId } = req.body as ChatRequest;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message tidak boleh kosong' });
    }

    // Buat atau gunakan session ID yang ada
    const sessionId = providedSessionId || uuidv4();
    const timestamp = new Date().toISOString();

    // Ambil riwayat percakapan
    const history = await db.getHistory(sessionId);

    // Simpan pesan pengguna
    await db.saveMessage({
      sessionId,
      role: 'user',
      content: message,
      timestamp
    });

    // Dapatkan respons dari Gemini
    const reply = await getGeminiService().chat(message, history);

    // Simpan respons asisten
    const assistantTimestamp = new Date().toISOString();
    await db.saveMessage({
      sessionId,
      role: 'assistant',
      content: reply,
      timestamp: assistantTimestamp
    });

    res.json({
      reply,
      sessionId,
      timestamp: assistantTimestamp
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses pesan' 
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
