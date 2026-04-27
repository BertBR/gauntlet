import type OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { CompletionOptions, Message, ModelAdapter } from '../types.js';

interface OpenAIAdapterOptions {
  client: OpenAI;
  model: string;
  defaults?: CompletionOptions;
}

export function openaiAdapter({ client, model, defaults }: OpenAIAdapterOptions): ModelAdapter {
  return {
    id: `openai:${model}`,
    async complete(messages, options) {
      const merged: CompletionOptions = { ...defaults, ...options };
      const completion = await client.chat.completions.create({
        model,
        messages: messages.map(toOpenAIMessage),
        temperature: merged.temperature,
        max_tokens: merged.maxTokens,
        response_format:
          merged.responseFormat === 'json' ? { type: 'json_object' } : undefined
      });
      return completion.choices[0]?.message?.content ?? '';
    }
  };
}

function toOpenAIMessage(message: Message): ChatCompletionMessageParam {
  return { role: message.role, content: message.content };
}
