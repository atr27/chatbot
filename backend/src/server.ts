import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import chatRouter from './routes/chat';
import path from 'path';
import fs from 'fs';

// Muat variabel environment
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Pastikan direktori data ada
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Pembatasan laju permintaan
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maksimal 100 permintaan per windowMs
  message: { error: 'Terlalu banyak permintaan, silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Pembatasan laju khusus chat (lebih ketat)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Maksimal 10 permintaan chat per menit
  message: { error: 'Terlalu banyak pesan chat, silakan tunggu sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
// Konfigurasi CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://frontend-chatbot-sooty.vercel.app',
  'https://api-chatbot.ahmadtaufikramdani.my.id'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Terapkan pembatasan laju
app.use('/api/', limiter);
app.use('/api/chat', chatLimiter);

// Pemeriksaan kesehatan
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Groq Chatbot API'
  });
});

// Rute
app.use('/api', chatRouter);

// Penanganan 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Penanganan error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Terjadi kesalahan internal server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Validasi API key saat startup
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey || apiKey === 'your-groq-api-key-here') {
  console.warn('⚠️  WARNING: GROQ_API_KEY tidak ditemukan atau belum dikonfigurasi!');
  console.warn('   Chat akan gagal jika API key tidak dikonfigurasi.');
  console.warn('   Silakan buat file .env dengan GROQ_API_KEY yang valid.');
} else {
  console.log('✅ GROQ API Key configured successfully');
}

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key configured: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}`);
});

// Penutupan yang aman
process.on('SIGINT', () => {
  console.log('\nMenutup server dengan aman...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nMenutup server dengan aman...');
  process.exit(0);
});

export default app;
