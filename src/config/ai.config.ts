import { createGroq } from '@ai-sdk/groq';

export const AI_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || "",
  modelName: "llama-3.1-8b-instant",
  temperature: 0.3,
  topP: 0.9,
  maxRetries: 2,
};

// Initialize Groq client
export const groq = createGroq({
  apiKey: AI_CONFIG.apiKey,
});
