Object.defineProperty(exports, '__esModule', { value: true })
exports.AiProviderFactory = void 0
const custom_openai_compatible_provider_1 = require('./providers/custom-openai-compatible.provider')
class AiProviderFactory {
  createProvider(config) {
    switch (config.provider) {
      case 'OpenAI':
      case 'Anthropic':
      case 'Google':
      case 'xAI':
      case 'Mistral':
      case 'TogetherAI':
      case 'OpenRouter':
      case 'NVIDIA':
      case 'DeepSeek':
      case 'Groq':
      case 'Zhipu':
      case 'Baichuan':
      case 'Moonshot':
      case 'SiliconFlow':
      case 'Volcengine':
      case 'Tencent':
      case 'Aliyun':
      case 'Ollama':
      case 'CustomOpenAICompatible':
        return new custom_openai_compatible_provider_1.CustomOpenAICompatibleProvider(
          config.apiKey,
          config.modelId,
          config.baseUrl ?? null
        )
      default:
        throw new Error(
          `Unsupported AI provider type: "${config.provider}". Please check the configuration.`
        )
    }
  }
}
exports.AiProviderFactory = AiProviderFactory
//# sourceMappingURL=ai-provider.factory.js.map
