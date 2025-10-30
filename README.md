# Quick Start Guide - Gemini Chatbot

Panduan cepat untuk menjalankan aplikasi chatbot Gemini AI.

### 1. Get API Key (2 menit)

1. Buka https://makersuite.google.com/app/apikey
2. Login dengan Google account
3. Klik "Create API Key"
4. Copy API key

### 2. Setup Backend (1 menit)

```bash
# Navigate ke folder backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
EOF

# IMPORTANT: Ganti 'your_api_key_here' dengan API key Anda!

# Start backend
npm run dev
```

Backend akan running di `http://localhost:3001`

### 3. Setup Frontend (1 menit)

Buka terminal baru:

```bash
# Navigate ke folder frontend
cd frontend

# Install dependencies (jika belum)
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

Frontend akan running di `http://localhost:5173`

### 4. Test (1 menit)

1. Buka browser: `http://localhost:5173`
2. Ketik pesan di chat input
3. Tekan Enter atau klik Send
4. Lihat response dari Gemini AI

### API Key Error (403)
- Check API key di `backend/.env`
- Verify API key valid di: https://makersuite.google.com/app/apikey

## Features to Try

1. **Multiple Sessions**: Klik "Chat Baru" untuk start conversation baru
2. **History**: Klik session di sidebar untuk load previous conversation
3. **Export**: Klik icon Download untuk export chat sebagai JSON
4. **Import**: Klik icon Upload untuk import chat history
5. **Delete**: Hover over session, klik Trash icon untuk delete

### Backend
```bash
cd backend

# Development
npm run dev              # Start dengan hot reload

# Build
npm run build           # Compile TypeScript

# Production
npm run start           # Run compiled version
```

### Frontend
```bash
cd frontend

# Development
npm run dev             # Start dev server

# Build
npm run build           # Create production build

# Preview
npm run preview         # Preview production build
```
