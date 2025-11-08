// 文件路径: packages/common-backend/src/ai/vcp-meta-thinking-examples.ts
// 职责: VCPToolBox 元思考的使用示例
// 展示超动态递归思维链、词元组捕网系统、元逻辑模块库

import { VcpMetaThinkingService, VcpMetaThinkingConfig } from './vcp-meta-thinking.service'

/**
 * VCPToolBox 元思考使用示例
 */
export class VcpMetaThinkingExamples {
  constructor(private readonly metaThinking: VcpMetaThinkingService) {}

  /**
   * 示例1: 基础元思考推理
   * 场景: 对复杂问题进行深度递归推理
   */
  async exampleBasicMetaThinking(query: string) {
    console.log('🧠 基础元思考推理示例')
    console.log(`查询: "${query}"`)
    console.log('')

    const result = await this.metaThinking.performMetaThinking(query, {
      domain: 'general',
      complexity: 'high',
    })

    console.log(`推理结果:`)
    console.log(`结果: ${result.result}`)
    console.log(`置信度: ${(result.confidence * 100).toFixed(1)}%`)
    console.log('')

    console.log(`推理链 (${result.reasoning.length} 步):`)
    result.reasoning.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
    console.log('')

    console.log(`思维链统计:`)
    console.log(`- 节点数量: ${result.chain.nodes.size}`)
    console.log(`- 最大深度: ${result.chain.currentDepth}`)
    console.log(`- 状态: ${result.chain.status}`)
    console.log('')

    return result
  }

  /**
   * 示例2: 词元组捕网系统演示
   * 场景: 展示语义组的激活和学习过程
   */
  async exampleSemanticGroupsActivation(query: string) {
    console.log('🎯 词元组捕网系统演示')
    console.log(`输入查询: "${query}"`)
    console.log('')

    // 执行元思考（这会激活语义组）
    const result = await this.metaThinking.performMetaThinking(
      query,
      {},
      {
        semanticGroupsEnabled: true,
        maxRecursionDepth: 2,
      }
    )

    console.log('激活的推理过程:')
    result.reasoning.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
    console.log('')

    // 分析思维节点中的语义信息
    const semanticNodes = Array.from(result.chain.nodes.values()).filter(
      (node) => node.type === 'semantic'
    )

    console.log('语义节点分析:')
    semanticNodes.forEach((node) => {
      console.log(`- 节点 ${node.id}:`)
      console.log(`  内容: ${node.content}`)
      console.log(`  置信度: ${(node.confidence * 100).toFixed(1)}%`)
      console.log(`  标签: ${node.metadata.tags.join(', ')}`)
    })
    console.log('')

    return { result, semanticNodes }
  }

  /**
   * 示例3: 元逻辑模块库应用
   * 场景: 展示不同逻辑推理模块的应用效果
   */
  async exampleLogicModulesApplication(query: string) {
    console.log('🔧 元逻辑模块库应用示例')
    console.log(`推理任务: "${query}"`)
    console.log('')

    const result = await this.metaThinking.performMetaThinking(
      query,
      {},
      {
        logicModulesEnabled: true,
        maxRecursionDepth: 3,
        confidenceThreshold: 0.6,
      }
    )

    console.log('推理过程:')
    result.reasoning.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
    console.log('')

    // 分析使用的逻辑模块
    const logicNodes = Array.from(result.chain.nodes.values()).filter(
      (node) => node.metadata.context.logicModule
    )

    console.log('使用的逻辑模块:')
    logicNodes.forEach((node) => {
      const moduleId = node.metadata.context.logicModule as string
      console.log(`- 应用模块 ${moduleId} 到节点 ${node.id}`)
      console.log(`  推理结果: ${node.content}`)
    })
    console.log('')

    return { result, logicNodes }
  }

  /**
   * 示例4: 超动态递归融合
   * 场景: 展示多路径推理结果的融合过程
   */
  async exampleRecursiveFusion(query: string) {
    console.log('🔄 超动态递归融合示例')
    console.log(`复杂推理: "${query}"`)
    console.log('')

    const result = await this.metaThinking.performMetaThinking(
      query,
      {},
      {
        fusionEnabled: true,
        maxRecursionDepth: 4,
        semanticGroupsEnabled: true,
        logicModulesEnabled: true,
      }
    )

    console.log('完整推理树:')
    this.displayThinkingTree(result.chain)
    console.log('')

    console.log('融合结果:')
    console.log(`最终结论: ${result.result}`)
    console.log(`融合置信度: ${(result.confidence * 100).toFixed(1)}%`)
    console.log('')

    return result
  }

  /**
   * 示例5: 配置对比分析
   * 场景: 展示不同配置对推理效果的影响
   */
  async exampleConfigurationComparison(query: string) {
    console.log('⚙️ 配置对比分析示例')
    console.log(`测试查询: "${query}"`)
    console.log('')

    const configs: Array<{ name: string; config: Partial<VcpMetaThinkingConfig> }> = [
      {
        name: '基础模式',
        config: {
          semanticGroupsEnabled: false,
          logicModulesEnabled: false,
          fusionEnabled: false,
          maxRecursionDepth: 1,
        },
      },
      {
        name: '语义增强',
        config: {
          semanticGroupsEnabled: true,
          logicModulesEnabled: false,
          fusionEnabled: false,
          maxRecursionDepth: 2,
        },
      },
      {
        name: '逻辑推理',
        config: {
          semanticGroupsEnabled: false,
          logicModulesEnabled: true,
          fusionEnabled: false,
          maxRecursionDepth: 2,
        },
      },
      {
        name: '全功能模式',
        config: {
          semanticGroupsEnabled: true,
          logicModulesEnabled: true,
          fusionEnabled: true,
          maxRecursionDepth: 3,
        },
      },
    ]

    const results: Record<string, any> = {}

    for (const { name, config } of configs) {
      console.log(`测试配置: ${name}`)

      const startTime = Date.now()
      const result = await this.metaThinking.performMetaThinking(query, {}, config)
      const duration = Date.now() - startTime

      results[name] = {
        result: result.result,
        confidence: result.confidence,
        reasoningSteps: result.reasoning.length,
        duration,
        nodeCount: result.chain.nodes.size,
        maxDepth: result.chain.currentDepth,
      }

      console.log(`  ⏱️ 耗时: ${duration}ms`)
      console.log(`  🎯 置信度: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`  📊 推理步骤: ${result.reasoning.length}`)
      console.log(`  🌳 思维节点: ${result.chain.nodes.size}`)
      console.log(`  📏 最大深度: ${result.chain.currentDepth}`)
      console.log('')
    }

    console.log('对比总结:')
    const sortedResults = Object.entries(results).sort(
      ([, a], [, b]) => b.confidence - a.confidence
    )

    sortedResults.forEach(([name, stats], index) => {
      console.log(
        `${index + 1}. ${name}: 置信度 ${(stats.confidence * 100).toFixed(1)}%, 耗时 ${stats.duration}ms`
      )
    })
    console.log('')

    return results
  }

  /**
   * 示例6: 在AI对话中的应用
   * 场景: 元思考在复杂对话推理中的实际应用
   */
  async exampleInConversationalAI(userQuery: string, conversationHistory: string[]) {
    console.log('💬 对话AI中的元思考应用')
    console.log(`用户查询: "${userQuery}"`)
    console.log(`对话历史: ${conversationHistory.length} 条消息`)
    console.log('')

    // 构建上下文
    const context = {
      conversationHistory,
      userIntent: this.analyzeUserIntent(userQuery),
      domain: this.detectDomain(userQuery),
      complexity: this.assessComplexity(userQuery),
    }

    console.log('分析的上下文:')
    Object.entries(context).forEach(([key, value]) => {
      console.log(`  ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    })
    console.log('')

    // 执行元思考推理
    const result = await this.metaThinking.performMetaThinking(
      `基于对话历史和用户查询，生成合适的AI回应: ${userQuery}`,
      context,
      {
        maxRecursionDepth: 3,
        semanticGroupsEnabled: true,
        logicModulesEnabled: true,
        fusionEnabled: true,
        confidenceThreshold: 0.7,
      }
    )

    console.log('AI推理过程:')
    result.reasoning.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
    console.log('')

    console.log('最终AI回复:')
    console.log(result.result)
    console.log(`生成置信度: ${(result.confidence * 100).toFixed(1)}%`)
    console.log('')

    return { result, context }
  }

  /**
   * 示例7: 学习和适应过程
   * 场景: 展示元思考系统的学习和自我改进能力
   */
  async exampleLearningAndAdaptation() {
    console.log('📚 学习和适应过程演示')
    console.log('')

    const testQueries = [
      '如果今天下雨，我应该带伞吗？',
      '苹果为什么会从树上掉下来？',
      '如何更好地学习编程？',
      '气候变化对人类社会的影响是什么？',
    ]

    console.log('连续推理多个问题，观察学习效果...')
    console.log('')

    const learningProgress: Array<{
      query: string
      confidence: number
      reasoningSteps: number
      duration: number
    }> = []

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i]
      console.log(`推理 ${i + 1}/${testQueries.length}: "${query}"`)

      const startTime = Date.now()
      const result = await this.metaThinking.performMetaThinking(query, {
        learningEnabled: true,
        queryIndex: i,
      })
      const duration = Date.now() - startTime

      learningProgress.push({
        query,
        confidence: result.confidence,
        reasoningSteps: result.reasoning.length,
        duration,
      })

      console.log(`  ✅ 置信度: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`  📝 推理步骤: ${result.reasoning.length}`)
      console.log(`  ⏱️ 耗时: ${duration}ms`)
      console.log('')
    }

    console.log('学习进度分析:')
    console.log('| 查询 | 置信度 | 推理步骤 | 耗时 |')
    console.log('|------|--------|----------|------|')
    learningProgress.forEach((progress, index) => {
      console.log(
        `| ${index + 1} | ${(progress.confidence * 100).toFixed(1)}% | ${progress.reasoningSteps} | ${progress.duration}ms |`
      )
    })
    console.log('')

    // 计算学习趋势
    const avgConfidence =
      learningProgress.reduce((sum, p) => sum + p.confidence, 0) / learningProgress.length
    const confidenceTrend = learningProgress.map((p) => p.confidence)
    const isImproving = confidenceTrend.every(
      (conf, i) => i === 0 || conf >= confidenceTrend[i - 1] - 0.1 // 允许小幅波动
    )

    console.log('学习效果评估:')
    console.log(`平均置信度: ${(avgConfidence * 100).toFixed(1)}%`)
    console.log(`学习趋势: ${isImproving ? '🟢 逐渐提升' : '🟡 波动中'}`)
    console.log('通过连续推理，系统学习并适应了不同类型的推理任务')
    console.log('')

    return learningProgress
  }

  // ===== 辅助方法 =====

  private displayThinkingTree(chain: any): void {
    const nodes = Array.from(chain.nodes.values()).sort((a, b) => a.depth - b.depth)

    for (const node of nodes) {
      const indent = '  '.repeat(node.depth)
      const childrenInfo = node.children.length > 0 ? ` (${node.children.length} 子节点)` : ''
      console.log(`${indent}├── ${node.type}: ${node.content}${childrenInfo}`)
    }
  }

  private analyzeUserIntent(query: string): string {
    if (query.includes('为什么') || query.includes('怎么') || query.includes('如何')) {
      return 'explanatory'
    } else if (query.includes('如果') || query.includes('假设')) {
      return 'hypothetical'
    } else if (query.includes('比较') || query.includes('区别')) {
      return 'comparative'
    } else {
      return 'general'
    }
  }

  private detectDomain(query: string): string {
    const domains = {
      science: ['科学', '物理', '化学', '生物'],
      technology: ['技术', '编程', '软件', '互联网'],
      philosophy: ['哲学', '思考', '存在', '意义'],
      daily: ['生活', '日常', '天气', '食物'],
    }

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        return domain
      }
    }

    return 'general'
  }

  private assessComplexity(query: string): string {
    const wordCount = query.split(' ').length
    if (wordCount > 20) return 'high'
    if (wordCount > 10) return 'medium'
    return 'low'
  }
}

/**
 * 使用指南
 *
 * 1. 导入服务:
 * import { VcpMetaThinkingService } from './vcp-meta-thinking.service';
 *
 * 2. 基础推理:
 * const result = await metaThinking.performMetaThinking(query, context, config);
 *
 * 3. 配置选项:
 * - maxRecursionDepth: 最大递归深度
 * - semanticGroupsEnabled: 启用词元组捕网
 * - logicModulesEnabled: 启用元逻辑模块
 * - fusionEnabled: 启用递归融合
 * - confidenceThreshold: 置信度阈值
 *
 * 4. 推理结果:
 * - result: 最终推理结果
 * - confidence: 推理置信度
 * - reasoning: 推理步骤链
 * - chain: 完整的思维链对象
 *
 * 5. 应用场景:
 * - 复杂问题推理
 * - 多步骤决策分析
 * - 假设情景模拟
 * - 因果关系推断
 *
 * 优势:
 * - 🔄 递归思维: 深度探索复杂问题
 * - 🎯 语义捕网: 智能激活相关概念
 * - 🔧 逻辑模块: 复用推理模式
 * - 🧠 自适应学习: 持续改进推理质量
 */
