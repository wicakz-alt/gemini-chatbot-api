import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { extract } from './helper.js'
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));



app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
       if(!Array.isArray(messages)) throw new Error("messages must be an array");
       const contents = messages.map(msg=>({
        role:msg.role,
        parts:[{text : msg.content}]
       }))
       const resp = await ai.models.generateContent({
        model:GEMINI_MODEL,
        contents
       })

        res.json({
            result: extract(resp)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


