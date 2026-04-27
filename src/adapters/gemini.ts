import type { GoogleGenAI } from '@google/genai';
import type { CompletionOptions, Message, ModelAdapter } from '../types.js';

interface GeminiAdapterOptions {
  client: GoogleGenAI;
  model: string;
  defaults?: CompletionOptions;
}

export function geminiAdapter({ client, model, defaults }: GeminiAdapterOptions): ModelAdapter {
  return {
    id: `gemini:${model}`,
    async complete(messages, options) {
      const merged: CompletionOptions = { ...defaults, ...options };

      const systemInstruction = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n\n');

      const contents = messages
        .filter((m) => m.role !== 'system')
        .map(toGeminiContent);

      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemInstruction.length > 0 ? systemInstruction : undefined,
          temperature: merged.temperature,
          maxOutputTokens: merged.maxTokens,
          responseMimeType: merged.responseFormat === 'json' ? 'application/json' : undefined
        }
      });

      return response.text ?? '';
    }
  };
}

function toGeminiContent(message: Message) {
  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  };
}
