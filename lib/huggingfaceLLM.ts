// Hugging Face Inference API utility for free-tier LLM completions
// Get your free API key at https://huggingface.co/settings/tokens

import axios from 'axios';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/Trelis/Llama-2-7b-chat-hf-hosted-inference-8bit';

export async function hfLLMComplete(prompt: string): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY in environment variables');

  const response = await axios.post(
    HUGGINGFACE_API_URL,
    { inputs: prompt },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000,
    }
  );

  // Response format: [{ generated_text: string }]
  if (Array.isArray(response.data) && response.data[0]?.generated_text) {
    return response.data[0].generated_text;
  }
  throw new Error('Unexpected response from Hugging Face API');
}

// Usage:
// await hfLLMComplete('Hello, how are you?');
