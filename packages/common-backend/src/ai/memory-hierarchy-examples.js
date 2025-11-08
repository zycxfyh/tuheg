Object.defineProperty(exports, '__esModule', { value: true })
exports.MemoryRecallExamples = void 0
const memory_hierarchy_service_1 = require('./memory-hierarchy.service')
class MemoryRecallExamples {
  memoryService
  constructor(memoryService) {
    this.memoryService = memoryService
  }
  async exampleFullTextRecall(gameId) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: memory_hierarchy_service_1.MemoryRecallMode.FULL_TEXT,
      limit: 10,
    })
    console.log('📖 无条件全文注入结果:')
    console.log(`总记忆数: ${result.stats.totalMemories}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('记忆内容:', result.memories)
    return result
  }
  async exampleRAGRecall(gameId, currentContext) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: memory_hierarchy_service_1.MemoryRecallMode.RAG_FRAGMENT,
      contextText: currentContext,
      limit: 3,
    })
    console.log('🔍 RAG片段检索结果:')
    console.log(`平均相似度: ${result.stats.averageSimilarity?.toFixed(3)}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('相关记忆:', result.memories)
    return result
  }
  async exampleThresholdFullRecall(gameId, currentContext) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: memory_hierarchy_service_1.MemoryRecallMode.THRESHOLD_FULL,
      contextText: currentContext,
      similarityThreshold: 0.8,
      limit: 5,
    })
    console.log('🎯 阈值全文注入结果:')
    console.log(`相似度阈值: 0.8`)
    if (result.memories.length > 0) {
      console.log('✅ 找到高度相关记忆，注入全文')
      console.log(`返回条数: ${result.stats.returnedCount}`)
    } else {
      console.log('❌ 未找到足够相关的记忆，跳过注入')
    }
    return result
  }
  async exampleThresholdRAGRecall(gameId, currentContext) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: memory_hierarchy_service_1.MemoryRecallMode.THRESHOLD_RAG,
      contextText: currentContext,
      similarityThreshold: 0.6,
      limit: 3,
    })
    console.log('🎪 阈值RAG片段检索结果:')
    console.log(`相似度阈值: 0.6`)
    console.log(`平均相似度: ${result.stats.averageSimilarity?.toFixed(3)}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('相关记忆片段:', result.memories)
    return result
  }
  async exampleSmartInjection(gameId, currentContext) {
    const result = await this.memoryService.smartMemoryInjection(gameId, currentContext, {
      maxMemories: 3,
      similarityThreshold: 0.7,
    })
    console.log('🤖 智能记忆注入结果:')
    console.log(`选择策略: ${result.strategy}`)
    console.log(`统计信息:`, result.stats)
    console.log('注入内容:', result.content)
    return result
  }
  async exampleMemorySyntaxParsing(gameId, currentContext) {
    const aiGeneratedText = `
    基于角色的过往经历{{角色日记本}}，我注意到他在之前的冒险中总是很谨慎。

    当面对类似的情况时[[角色日记本]]，他通常会选择保守策略。

    只有在真正重要的时候<<角色日记本>>才会全力以赴。

    在日常决策中《《角色日记本》》，他更倾向于稳健的选择。
    `
    console.log('📝 原始AI文本:')
    console.log(aiGeneratedText)
    console.log('')
    const parsedText = await this.memoryService.parseMemorySyntax(
      aiGeneratedText,
      gameId,
      currentContext
    )
    console.log('🔄 解析后文本:')
    console.log(parsedText)
    return parsedText
  }
  async narrativeAIExample(gameId, playerAction) {
    console.log('🎭 叙事AI记忆增强示例')
    console.log('玩家行动:', playerAction)
    console.log('')
    const contextAnalysis = await this.memoryService.smartMemoryInjection(gameId, playerAction, {
      maxMemories: 2,
      similarityThreshold: 0.7,
    })
    console.log('📊 上下文分析结果:')
    console.log(`策略: ${contextAnalysis.strategy}`)
    console.log(`相关记忆: ${contextAnalysis.stats.returnedCount}条`)
    console.log('')
    const enhancedPrompt = `
角色背景信息:
${contextAnalysis.content}

玩家当前行动: ${playerAction}

请基于角色的记忆和过往经历，生成生动而连贯的叙事回应。
保持角色的个性和行为模式的一致性。
    `.trim()
    console.log('✨ 增强后的AI提示词:')
    console.log(enhancedPrompt)
    console.log('')
    return {
      contextAnalysis,
      enhancedPrompt,
    }
  }
}
exports.MemoryRecallExamples = MemoryRecallExamples
//# sourceMappingURL=memory-hierarchy-examples.js.map
