'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.CustomOpenAICompatibleProvider = void 0
const openai_1 = require('@langchain/openai')
class CustomOpenAICompatibleProvider {
  model
  constructor(apiKey, modelId, baseUrl, defaultOptions = {}) {
    this.model = new openai_1.ChatOpenAI({
      apiKey: apiKey,
      modelName: modelId,
      temperature: defaultOptions.temperature ?? 0.7,
      configuration: {
        baseURL: baseUrl || undefined,
      },
    })
  }
}
exports.CustomOpenAICompatibleProvider = CustomOpenAICompatibleProvider
//# sourceMappingURL=custom-openai-compatible.provider.js.map
