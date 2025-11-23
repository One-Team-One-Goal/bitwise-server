export const AI_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || "",
  modelName: "llama-3.3-70b-versatile",
  temperature: 0.3,
  topP: 0.9,
  maxRetries: 2,
};
