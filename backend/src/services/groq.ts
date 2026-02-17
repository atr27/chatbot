import Groq from 'groq-sdk';

class GroqService {
    private groq: Groq;
    private model: string;

    constructor(apiKey: string) {
        if (!apiKey || apiKey.trim() === '' || apiKey === 'your-groq-api-key-here') {
            throw new Error('API Key tidak valid. Silakan periksa Groq API key di file .env');
        }

        this.groq = new Groq({
            apiKey: apiKey,
        });

        // Gunakan model Llama 3.3 yang cepat dan gratis
        this.model = 'llama-3.3-70b-versatile';
        console.log(`Menggunakan model Groq: ${this.model}`);
    }

    async chat(message: string, history: Array<{ role: string; content: string }> = []): Promise<string> {
        try {
            // Konversi riwayat ke format Groq (OpenAI-compatible)
            const messages = [
                ...history.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
                    content: msg.content
                })),
                {
                    role: 'user' as const,
                    content: message
                }
            ];

            // Kirim pesan ke Groq
            const chatCompletion = await this.groq.chat.completions.create({
                messages: messages,
                model: this.model,
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                stream: false,
            });

            const response = chatCompletion.choices[0]?.message?.content || '';
            return response;
        } catch (error: any) {
            console.error('Groq API error:', error);

            // Tangani error spesifik
            if (error.status === 401 || error.message?.includes('authentication')) {
                throw new Error('API Key tidak valid. Silakan periksa Groq API key Anda di .env');
            } else if (error.status === 429 || error.message?.includes('rate limit')) {
                throw new Error('Rate limit terlampaui. Silakan coba lagi dalam beberapa detik.');
            } else if (error.message?.includes('model')) {
                throw new Error('Model tidak tersedia. Silakan periksa konfigurasi model.');
            }

            throw new Error('Gagal mendapatkan respons dari Groq AI. Silakan coba lagi.');
        }
    }

    async chatWithoutHistory(message: string): Promise<string> {
        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1000,
            });

            return chatCompletion.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error('Groq API error:', error);
            throw new Error('Gagal mendapatkan respons dari Groq AI.');
        }
    }
}

export default GroqService;
