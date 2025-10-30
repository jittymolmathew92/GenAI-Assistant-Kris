import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const USER_ROLE_PATH = './userRole.json';
const userRoles = fs.existsSync(USER_ROLE_PATH) 
  ? JSON.parse(fs.readFileSync(USER_ROLE_PATH, 'utf-8'))
  : {"system": "System"};

function getRoleContext(userPrompt) {  
  console.log('jit userPrompt', userPrompt);
  // Simple role detection (can be improved with NLP later)
  const prompt = userPrompt.length > 0 ? userPrompt[0]?.content?.toLowerCase() : '';

  console.log('jit prompt', prompt);

  if (prompt.includes("business analyst") || prompt.includes("ba")) return userRoles.ba;
  if (prompt.includes("as an architect") || prompt.includes("architect")) return userRoles.architect;
  if (prompt.includes("as a designer") || prompt.includes("designer")) return userRoles.designer;
  if (prompt.includes("as a developer") || prompt.includes("developer")) return userRoles.developer;

  // default to mixed role
  return userRoles.mixed;
}


//Context Json Import
const CONTEXT_PATH = './context.json';
const context = fs.existsSync(CONTEXT_PATH)
  ? fs.readFileSync(CONTEXT_PATH, 'utf-8')
  : '';


app.post('/api/generate', async (req, res) => {
  try {
    const { messages } = req.body;
    const userRoleVal = getRoleContext(messages);
    console.log('jit userRole', getRoleContext(messages));
    console.log('jit userRole val', userRoleVal);
    const promptWithContext = [
      { role: 'system', content: context },
      ...messages,
    ];
    console.log('promptWithContext', promptWithContext);
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: promptWithContext,
        stream: false,
      }),
    });
    const data = await ollamaRes.json();
    res.json({ message: data.message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.listen(3001, () => console.log('Backend running on port 3001'));