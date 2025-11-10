// 文件路径: packages/common-backend/src/ai/memory-hierarchy-examples.ts
// 职责: VCPToolBox 4种记忆召回模式的使用示例
// 展示如何在AI对话中使用智能记忆系统

import { type MemoryHierarchyService, MemoryRecallMode } from './memory-hierarchy.service'

/**
 * VCPToolBox 记忆召回模式使用示例
 */
export class MemoryRecallExamples {
  constructor(private readonly memoryService: MemoryHierarchyService) {}

  /**
   * 示例1: 无条件全文注入 {{角色日记本}}
   * 场景: 需要回顾所有历史记忆时使用
   */
  async exampleFullTextRecall(gameId: string) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: MemoryRecallMode.FULL_TEXT,
      limit: 10,
    })

    console.log('📖 无条件全文注入结果:')
    console.log(`总记忆数: ${result.stats.totalMemories}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('记忆内容:', result.memories)

    return result
  }

  /**
   * 示例2: RAG片段检索 [[角色日记本]]
   * 场景: 基于当前对话上下文智能检索相关记忆
   */
  async exampleRAGRecall(gameId: string, currentContext: string) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: MemoryRecallMode.RAG_FRAGMENT,
      contextText: currentContext,
      limit: 3,
    })

    console.log('🔍 RAG片段检索结果:')
    console.log(`平均相似度: ${result.stats.averageSimilarity?.toFixed(3)}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('相关记忆:', result.memories)

    return result
  }

  /**
   * 示例3: 阈值全文注入 <<角色日记本>>
   * 场景: 只有在高度相关时才注入所有记忆，否则保持简洁
   */
  async exampleThresholdFullRecall(gameId: string, currentContext: string) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: MemoryRecallMode.THRESHOLD_FULL,
      contextText: currentContext,
      similarityThreshold: 0.8, // 高相似度阈值
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

  /**
   * 示例4: 阈值RAG片段检索 《《角色日记本》》
   * 场景: 智能平衡精确度和信息量
   */
  async exampleThresholdRAGRecall(gameId: string, currentContext: string) {
    const result = await this.memoryService.recallMemories(gameId, {
      mode: MemoryRecallMode.THRESHOLD_RAG,
      contextText: currentContext,
      similarityThreshold: 0.6, // 中等相似度阈值
      limit: 3,
    })

    console.log('🎪 阈值RAG片段检索结果:')
    console.log(`相似度阈值: 0.6`)
    console.log(`平均相似度: ${result.stats.averageSimilarity?.toFixed(3)}`)
    console.log(`返回条数: ${result.stats.returnedCount}`)
    console.log('相关记忆片段:', result.memories)

    return result
  }

  /**
   * 示例5: 智能记忆注入
   * 场景: AI自动选择最合适的记忆召回策略
   */
  async exampleSmartInjection(gameId: string, currentContext: string) {
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

  /**
   * 示例6: 记忆语法解析
   * 场景: 在AI生成的文本中自动解析和替换记忆标记
   */
  async exampleMemorySyntaxParsing(gameId: string, currentContext: string) {
    // 模拟AI生成的文本，包含各种记忆召回标记
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

  /**
   * 综合示例: 在叙事AI中的应用
   */
  async narrativeAIExample(gameId: string, playerAction: string) {
    console.log('🎭 叙事AI记忆增强示例')
    console.log('玩家行动:', playerAction)
    console.log('')

    // 步骤1: 智能分析上下文并注入相关记忆
    const contextAnalysis = await this.memoryService.smartMemoryInjection(gameId, playerAction, {
      maxMemories: 2,
      similarityThreshold: 0.7,
    })

    console.log('📊 上下文分析结果:')
    console.log(`策略: ${contextAnalysis.strategy}`)
    console.log(`相关记忆: ${contextAnalysis.stats.returnedCount}条`)
    console.log('')

    // 步骤2: 生成增强的叙事提示词
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

    // 这里可以继续调用AI生成最终叙事
    // const narrative = await this.aiService.generateNarrative(enhancedPrompt);

    return {
      contextAnalysis,
      enhancedPrompt,
      // narrative,
    }
  }
}

/**
 * 使用指南
 *
 * 1. 导入服务:
 * import { MemoryHierarchyService, MemoryRecallMode } from './memory-hierarchy.service';
 *
 * 2. 基础使用:
 * const memoryService = new MemoryHierarchyService(prisma, vectorSearch);
 *
 * 3. 四种召回模式:
 * - FULL_TEXT: 无条件返回所有记忆，适合完整回顾
 * - RAG_FRAGMENT: 基于语义相似度检索，适合精准匹配
 * - THRESHOLD_FULL: 只有高度相关时才返回全文，适合节约token
 * - THRESHOLD_RAG: 基于阈值的RAG检索，平衡精确度和信息量
 *
 * 4. 在AI对话中的应用:
 * - 解析AI输出中的记忆标记: parseMemorySyntax()
 * - 智能上下文注入: smartMemoryInjection()
 * - 直接指定召回模式: recallMemories()
 *
 * 5. 性能优化:
 * - RAG模式最耗时但最精准
 * - THRESHOLD模式可以减少不必要的token消耗
 * - FULL_TEXT模式最快但信息量最大
 */
