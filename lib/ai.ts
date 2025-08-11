/**
 * AI utilities wrapping GPT-5 via OpenAI client.
 * TODO: Set OPENAI_API_KEY in environment. Optionally configure API base for Azure/OpenAI-compatible providers.
 */
import OpenAI from 'openai';
import { z } from 'zod';
import { sha256 } from 'js-sha256';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // TODO: set in .env.local
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // Allow override; 'gpt-5' may not be available in all accounts
if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set. AI features will fail until configured.');
}

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const CONTRACT_ANALYSIS_SYSTEM = `You are an expert contract reviewer for small businesses. Return EXACTLY valid JSON arrays as described. Output ONLY JSON.`;
export const CONTRACT_ANALYSIS_USER = `<<CHUNK_TEXT>>
Instructions:
- Identify potential risk clauses; for each output:
  {
    "clause_title": string,
    "risk_level": "LOW"|"MEDIUM"|"HIGH",
    "summary": string (<=2 sentences),
    "clause_text": string,
    "start_index": integer,
    "end_index": integer,
    "confidence": number (0-1),
    "metadata": { "types": ["auto_renewal","termination","ip","payment", ...] }
  }
Return only a JSON array (possibly empty).`;

const RiskItemSchema = z.object({
  clause_title: z.string(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  clause_text: z.string(),
  start_index: z.number().int().nonnegative(),
  end_index: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
  metadata: z.object({ types: z.array(z.string()) }).optional().default({ types: [] })
});

export type RiskItem = z.infer<typeof RiskItemSchema>;

export async function callGPT5(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: options?.temperature ?? 0,
    max_tokens: options?.maxTokens ?? 1500,
    messages: [
      { role: 'system', content: CONTRACT_ANALYSIS_SYSTEM },
      { role: 'user', content: prompt }
    ]
  });
  const text = response.choices[0]?.message?.content ?? '';
  return text.trim();
}

export function chunkText(text: string, approxChars = 12000, overlap = 400): string[] {
  if (text.length <= approxChars) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + approxChars, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}

function validateOrRetryJSON(raw: string): RiskItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON');
  }
  const array = Array.isArray(parsed) ? parsed : [];
  return array.map((p) => RiskItemSchema.parse(p));
}

export async function analyzeContractText(contractId: string, textChunks: string[]): Promise<RiskItem[]> {
  if (process.env.AI_MOCK === '1') {
    const mock: RiskItem[] = [
      {
        clause_title: 'Auto-Renewal Clause',
        risk_level: 'MEDIUM',
        summary: 'The agreement auto-renews unless terminated 60 days before end of term.',
        clause_text: 'This Agreement shall automatically renew for successive one-year terms unless either party gives sixty (60) days prior written notice of non-renewal.',
        start_index: 0,
        end_index: 160,
        confidence: 0.9,
        metadata: { types: ['auto_renewal'] }
      }
    ];
    return mock;
  }
  const allItems: RiskItem[] = [];
  for (const chunk of textChunks) {
    const userPrompt = CONTRACT_ANALYSIS_USER.replace('<<CHUNK_TEXT>>', chunk);

    let attempt = 0;
    let validated: RiskItem[] | null = null;
    while (attempt < 3 && !validated) {
      const raw = await callGPT5(userPrompt, { temperature: 0 });
      try {
        validated = validateOrRetryJSON(raw);
      } catch (e) {
        attempt += 1;
        if (attempt >= 3) {
          console.warn(`GPT-5 returned invalid JSON after retries for contract ${contractId}:`, e);
          validated = [];
        } else {
          // Retry by nudging the model
          const retryPrompt = `${userPrompt}\n\nYou returned invalid JSON — return strictly JSON array with described fields.`;
          const retryRaw = await callGPT5(retryPrompt, { temperature: 0 });
          try {
            validated = validateOrRetryJSON(retryRaw);
          } catch {
            // loop continues
          }
        }
      }
    }
    if (validated) allItems.push(...validated);
  }

  // Merge & dedupe by hash of normalized clause_text
  const mostSevere: Record<string, RiskItem> = {};
  for (const item of allItems) {
    const normalized = item.clause_text.replace(/\s+/g, ' ').trim().toLowerCase();
    const key = sha256(normalized);
    const existing = mostSevere[key];
    if (!existing) {
      mostSevere[key] = item;
      continue;
    }
    const order = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
    mostSevere[key] = order[item.risk_level] >= order[existing.risk_level] ? item : existing;
  }
  return Object.values(mostSevere);
}


