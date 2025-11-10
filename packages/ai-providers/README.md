# @tuheg/ai-providers

AI providers abstraction and implementations for the Creation Ring system.

This package provides a unified interface for interacting with various AI providers (OpenAI, Anthropic, Google, etc.) and implements common patterns like retry logic, rate limiting, and provider failover.

## Features

- **Unified Interface**: Single interface for all AI providers
- **Provider Abstraction**: Easy to add new providers or switch between them
- **Error Handling**: Robust error handling and retry mechanisms
- **Rate Limiting**: Built-in rate limiting and quota management
- **Caching**: Response caching to reduce API calls
- **Monitoring**: Comprehensive logging and metrics

## Supported Providers

- OpenAI (GPT-3.5, GPT-4, etc.)
- Anthropic (Claude)
- Google (PaLM, Gemini)
- Azure OpenAI
- Custom providers (compatible with OpenAI API)

## Usage

```typescript
import { AiProviderFactory, AiProviderType } from '@tuheg/ai-providers';

// Create a provider instance
const factory = new AiProviderFactory();
const provider = factory.createProvider(AiProviderType.OPENAI, {
  apiKey: 'your-api-key'
});

// Generate text
const response = await provider.generateText({
  model: 'gpt-4',
  prompt: 'Hello, world!',
  maxTokens: 100
});

console.log(response.content);
```

## Architecture

```
AI Providers Package
├── interfaces/          # Provider interfaces
├── providers/           # Provider implementations
├── factory/             # Provider factory
├── middleware/          # Request/response middleware
├── cache/              # Response caching
├── retry/              # Retry strategies
└── monitoring/         # Metrics and logging
```

## Development

```bash
# Build
nx build ai-providers

# Test
nx test ai-providers

# Lint
nx lint ai-providers
```
