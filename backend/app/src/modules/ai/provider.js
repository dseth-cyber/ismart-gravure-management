"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAiProvider = createAiProvider;
class OpenAIProvider {
    apiKey;
    baseUrl;
    model;
    constructor(apiKey, baseUrl, model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl || 'https://api.openai.com/v1';
        this.model = model || 'gpt-4';
    }
    async chat(req) {
        const start = Date.now();
        const messages = [];
        if (req.systemPrompt)
            messages.push({ role: 'system', content: req.systemPrompt });
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
        const data = await res.json();
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
    calculateCost(inp, outp) {
        return (inp / 1000) * 0.03 + (outp / 1000) * 0.06;
    }
}
class AnthropicProvider {
    apiKey;
    baseUrl;
    model;
    constructor(apiKey, baseUrl, model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
        this.model = model || 'claude-3-opus-20240229';
    }
    async chat(req) {
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
        const data = await res.json();
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
class OllamaProvider {
    baseUrl;
    model;
    constructor(baseUrl, model) {
        this.baseUrl = baseUrl || 'http://ollama:11434';
        this.model = model || 'llama3';
    }
    async chat(req) {
        const start = Date.now();
        const messages = [];
        if (req.systemPrompt)
            messages.push({ role: 'system', content: req.systemPrompt });
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
        const data = await res.json();
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
function createAiProvider(provider) {
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
