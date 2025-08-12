import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function openrouterLLMComplete(prompt: string, model = 'deepseek/deepseek-r1-0528:free'): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY in environment variables');

  const response = await axios.post(
    OPENROUTER_API_URL,
    {
      model,
      messages: [
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    }
  );

  // Response format: { choices: [{ message: { content: string } }] }
  if (response.data?.choices?.[0]?.message?.content) {
    return response.data.choices[0].message.content;
  }
  throw new Error('Unexpected response from OpenRouter API');
}

// Usage:
(async () => {
  const reply = await openrouterLLMComplete('Hello, how are you?');
  console.log('Model reply:', reply);
})();