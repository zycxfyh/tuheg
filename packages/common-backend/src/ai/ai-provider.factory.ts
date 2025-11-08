// 文件路径: libs/common/src/ai/ai-provider.factory.ts

import type { AiConfiguration } from '@prisma/client'

// [核心修正] 放弃所有相对路径，统一使用 @tuheg/common-backend 绝对路径别名
// 我们从 @tuheg/common-backend 的总出口 (index.ts) 一次性导入所有需要的工具和类型
import type { AiProvider } from '../types/ai-providers.types'
import { CustomOpenAICompatibleProvider } from './providers/custom-openai-compatible.provider'
export class AiProviderFactory {
  public createProvider(config: AiConfiguration): AiProvider {
    // [注释] 我们将所有兼容OpenAI API的供应商，都导向同一条“生产线”
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
        return new CustomOpenAICompatibleProvider(
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
