import { env } from '../../config/env';
import { prisma } from '../../config/database';

export interface AiChatRequest {
  providerId?: string;
  providerType?: string;
  model?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

export interface AiChatResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  durationMs: number;
  model: string;
  providerId: string;
}

export interface AiProviderInterface {
  chat(req: AiChatRequest): Promise<AiChatResponse>;
}

class OpenAIProvider implements AiProviderInterface {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.model = model || 'gpt-4';
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const start = Date.now();
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model || this.model,
        messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens || 2048,
      }),
    });

    const durationMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data: any = await res.json();
    const inTokens = data.usage?.prompt_tokens || 0;
    const outTokens = data.usage?.completion_tokens || 0;

    return {
      text: data.choices?.[0]?.message?.content || '',
      inputTokens: inTokens,
      outputTokens: outTokens,
      cost: this.calculateCost(inTokens, outTokens),
      durationMs,
      model: data.model || this.model,
      providerId: '',
    };
  }

  private calculateCost(inp: number, outp: number): number {
    return (inp / 1000) * 0.03 + (outp / 1000) * 0.06;
  }
}

class AnthropicProvider implements AiProviderInterface {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
    this.model = model || 'claude-3-opus-20240229';
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const start = Date.now();
    const system = req.systemPrompt;

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model || this.model,
        system,
        messages: [{ role: 'user', content: req.prompt }],
        max_tokens: req.maxTokens || 2048,
        temperature: req.temperature ?? 0.7,
      }),
    });

    const durationMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data: any = await res.json();
    const inTokens = data.usage?.input_tokens || 0;
    const outTokens = data.usage?.output_tokens || 0;

    return {
      text: data.content?.[0]?.text || '',
      inputTokens: inTokens,
      outputTokens: outTokens,
      cost: (inTokens / 1000) * 0.015 + (outTokens / 1000) * 0.075,
      durationMs,
      model: data.model || this.model,
      providerId: '',
    };
  }
}

class OllamaProvider implements AiProviderInterface {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl || 'http://ollama:11434';
    this.model = model || 'llama3';
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const start = Date.now();
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.model || this.model,
        messages,
        stream: false,
        options: { temperature: req.temperature ?? 0.7 },
      }),
    });

    const durationMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${err}`);
    }

    const data: any = await res.json();
    return {
      text: data.message?.content || '',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      durationMs,
      model: data.model || this.model,
      providerId: '',
    };
  }
}

export function createAiProvider(provider: { providerType: string; apiKey?: string; baseUrl?: string; modelName: string }): AiProviderInterface {
  switch (provider.providerType) {
    case 'openai':
      return new OpenAIProvider(provider.apiKey || '', provider.baseUrl || '', provider.modelName);
    case 'anthropic':
      return new AnthropicProvider(provider.apiKey || '', provider.baseUrl || '', provider.modelName);
    case 'ollama':
      return new OllamaProvider(provider.baseUrl || '', provider.modelName);
    default:
      throw new Error(`Unsupported AI provider type: ${provider.providerType}`);
  }
}
