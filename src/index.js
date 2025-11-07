import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

//Context Json Import
const CONTEXT_PATH = './context.json';
const context = fs.existsSync(CONTEXT_PATH)
  ? fs.readFileSync(CONTEXT_PATH, 'utf-8')
  : '';


app.post('/api/generate', async (req, res) => {
  try {
    const { messages } = req.body;
    const promptWithContext = [
      { role: 'user', content: context },
      ...messages,
    ];
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:1b',
        messages: promptWithContext,
        // stream: false,
        stream: true,
      }),
    });


    // Prepare headers for live text output
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Stream data directly from Ollama to client
    for await (const chunk of ollamaRes.body) {
      res.write(chunk);
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.listen(3001, () => console.log('Backend running on port 3001'));