'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var VcpMetaThinkingService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.VcpMetaThinkingService = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
let VcpMetaThinkingService = (VcpMetaThinkingService_1 = class VcpMetaThinkingService {
  configService
  logger = new common_1.Logger(VcpMetaThinkingService_1.name)
  thinkingNodes = new Map()
  semanticGroups = new Map()
  logicModules = new Map()
  activeChains = new Map()
  defaultConfig = {
    maxRecursionDepth: 5,
    semanticGroupsEnabled: true,
    logicModulesEnabled: true,
    fusionEnabled: true,
    confidenceThreshold: 0.7,
    adaptiveLearning: true,
  }
  constructor(configService) {
    this.configService = configService
    this.initializeDefaultComponents()
  }
  async performMetaThinking(query, context = {}, config) {
    const thinkingConfig = { ...this.defaultConfig, ...config }
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.logger.debug(`Starting VCP meta-thinking for query: "${query}"`)
    try {
      const chain = {
        id: chainId,
        rootNodeId: '',
        currentDepth: 0,
        maxDepth: thinkingConfig.maxRecursionDepth,
        nodes: new Map(),
        status: 'active',
        confidence: 1.0,
      }
      this.activeChains.set(chainId, chain)
      const activatedGroups = thinkingConfig.semanticGroupsEnabled
        ? this.activateSemanticGroups(query)
        : []
      const rootNode = await this.createInitialThinkingNode(query, context, activatedGroups)
      chain.rootNodeId = rootNode.id
      chain.nodes.set(rootNode.id, rootNode)
      const result = await this.recursiveThinkingExpansion(chain, rootNode, thinkingConfig, context)
      const finalResult = thinkingConfig.fusionEnabled
        ? await this.performRecursiveFusion(chain, thinkingConfig)
        : result
      chain.status = 'completed'
      chain.result = finalResult
      chain.confidence = this.calculateChainConfidence(chain)
      if (thinkingConfig.adaptiveLearning) {
        await this.adaptiveLearning(chain, activatedGroups)
      }
      const reasoning = this.extractReasoningChain(chain)
      this.logger.debug(`Meta-thinking completed with confidence: ${chain.confidence}`)
      return {
        result: finalResult,
        chain,
        confidence: chain.confidence,
        reasoning,
      }
    } catch (error) {
      this.logger.error('Meta-thinking failed:', error)
      const chain = this.activeChains.get(chainId)
      if (chain) {
        chain.status = 'failed'
      }
      throw error
    } finally {
      setTimeout(() => {
        this.activeChains.delete(chainId)
      }, 300000)
    }
  }
  activateSemanticGroups(query) {
    const activatedGroups = []
    for (const group of this.semanticGroups.values()) {
      let activationScore = 0
      let matchedKeywords = 0
      for (const keyword of group.keywords) {
        if (query.toLowerCase().includes(keyword.toLowerCase())) {
          activationScore += 1
          matchedKeywords++
        }
      }
      for (const concept of group.relatedConcepts) {
        if (query.toLowerCase().includes(concept.toLowerCase())) {
          activationScore += 0.5
        }
      }
      const normalizedScore = Math.min(
        activationScore / (group.keywords.length + group.relatedConcepts.length),
        1
      )
      if (normalizedScore >= group.activationThreshold) {
        group.activationCount++
        group.lastActivated = new Date()
        group.strength = Math.min(group.strength + 0.1, 1)
        activatedGroups.push(group)
        this.logger.debug(
          `Activated semantic group: ${group.id} (score: ${normalizedScore.toFixed(3)})`
        )
      }
    }
    return activatedGroups.sort((a, b) => b.strength - a.strength)
  }
  async createInitialThinkingNode(query, context, activatedGroups) {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const semanticContext = activatedGroups
      .map((group) => `${group.keywords.join(', ')}: ${group.relatedConcepts.join(', ')}`)
      .join('; ')
    const node = {
      id: nodeId,
      type: 'semantic',
      content: `分析查询: "${query}"${semanticContext ? ` (相关概念: ${semanticContext})` : ''}`,
      confidence: 0.8,
      depth: 0,
      children: [],
      metadata: {
        createdAt: new Date(),
        activatedCount: 1,
        lastActivated: new Date(),
        tags: activatedGroups.map((g) => g.id),
        context: { ...context, semanticGroups: activatedGroups.map((g) => g.id) },
      },
    }
    this.thinkingNodes.set(nodeId, node)
    return node
  }
  async recursiveThinkingExpansion(chain, currentNode, config, context) {
    if (chain.currentDepth >= config.maxRecursionDepth) {
      return currentNode.content
    }
    chain.currentDepth++
    const logicResult = config.logicModulesEnabled
      ? await this.applyLogicModules(currentNode, context)
      : null
    const childNodes = await this.generateChildThinkingNodes(
      currentNode,
      logicResult,
      config,
      context
    )
    const childResults = []
    for (const childNode of childNodes) {
      chain.nodes.set(childNode.id, childNode)
      currentNode.children.push(childNode.id)
      const childResult = await this.recursiveThinkingExpansion(chain, childNode, config, {
        ...context,
        parentResult: logicResult,
      })
      childResults.push(childResult)
    }
    const fusedResult =
      childResults.length > 0
        ? await this.fuseThinkingResults(childResults, currentNode)
        : currentNode.content
    return fusedResult
  }
  async applyLogicModules(node, context) {
    const applicableModules = Array.from(this.logicModules.values())
      .filter((module) => this.isModuleApplicable(module, node, context))
      .sort((a, b) => b.successRate - a.successRate)
    for (const module of applicableModules.slice(0, 3)) {
      try {
        const result = await this.executeLogicModule(module, node, context)
        module.usageCount++
        module.lastUsed = new Date()
        module.successRate = (module.successRate * (module.usageCount - 1) + 1) / module.usageCount
        return result
      } catch (error) {
        module.successRate = (module.successRate * (module.usageCount - 1) + 0) / module.usageCount
        this.logger.warn(`Logic module ${module.id} failed:`, error)
      }
    }
    return null
  }
  async generateChildThinkingNodes(parentNode, logicResult, config, context) {
    const childNodes = []
    const strategies = ['decomposition', 'analogy', 'counterfactual', 'abstraction']
    for (const strategy of strategies.slice(0, 2)) {
      const childNode = await this.createChildThinkingNode(
        parentNode,
        strategy,
        logicResult,
        config,
        context
      )
      if (childNode.confidence >= config.confidenceThreshold) {
        childNodes.push(childNode)
      }
    }
    return childNodes
  }
  async performRecursiveFusion(chain, config) {
    const nodes = Array.from(chain.nodes.values())
    let totalWeight = 0
    let weightedSum = 0
    for (const node of nodes) {
      const weight = node.confidence * Math.exp(-node.depth * 0.5)
      totalWeight += weight
      weightedSum += weight * this.contentToValue(node.content)
    }
    const fusedValue = totalWeight > 0 ? weightedSum / totalWeight : 0
    return this.valueToContent(fusedValue, chain)
  }
  calculateChainConfidence(chain) {
    const nodes = Array.from(chain.nodes.values())
    if (nodes.length === 0) return 0
    const avgConfidence = nodes.reduce((sum, node) => sum + node.confidence, 0) / nodes.length
    const depthPenalty = Math.exp(-chain.currentDepth * 0.2)
    return avgConfidence * depthPenalty
  }
  extractReasoningChain(chain) {
    const reasoning = []
    const nodes = Array.from(chain.nodes.values()).sort((a, b) => a.depth - b.depth)
    for (const node of nodes) {
      reasoning.push(
        `[${node.type}] ${node.content} (置信度: ${(node.confidence * 100).toFixed(1)}%)`
      )
    }
    return reasoning
  }
  async adaptiveLearning(chain, activatedGroups) {
    const successRate = chain.confidence
    for (const group of activatedGroups) {
      if (successRate > 0.8) {
        group.strength = Math.min(group.strength + 0.05, 1)
      } else if (successRate < 0.5) {
        group.strength = Math.max(group.strength - 0.02, 0.1)
      }
    }
    const successfulModules = Array.from(this.logicModules.values()).filter((module) =>
      chain.nodes.some((node) => node.metadata.tags.includes(module.id) && node.confidence > 0.8)
    )
    for (const module of successfulModules) {
      module.successRate = Math.min(module.successRate + 0.05, 1)
    }
  }
  initializeDefaultComponents() {
    this.initializeDefaultSemanticGroups()
    this.initializeDefaultLogicModules()
  }
  initializeDefaultSemanticGroups() {
    const defaultGroups = [
      {
        id: 'causality',
        keywords: ['因为', '所以', '导致', '原因', '结果'],
        relatedConcepts: ['因果关系', '逻辑推理', '事件链'],
        activationThreshold: 0.3,
      },
      {
        id: 'comparison',
        keywords: ['比', '更', '最', '相似', '不同'],
        relatedConcepts: ['比较推理', '类比思维', '相对关系'],
        activationThreshold: 0.3,
      },
      {
        id: 'hypothesis',
        keywords: ['如果', '假设', '可能', '也许', '假如'],
        relatedConcepts: ['假设推理', '条件判断', '可能性分析'],
        activationThreshold: 0.4,
      },
      {
        id: 'sequence',
        keywords: ['然后', '接着', '之后', '顺序', '步骤'],
        relatedConcepts: ['时间序列', '过程推理', '阶段分析'],
        activationThreshold: 0.3,
      },
    ]
    for (const group of defaultGroups) {
      this.semanticGroups.set(group.id, {
        ...group,
        activationCount: 0,
        lastActivated: new Date(0),
        strength: 0.5,
      })
    }
  }
  initializeDefaultLogicModules() {
    const defaultModules = [
      {
        id: 'deductive_reasoning',
        name: '演绎推理',
        description: '从一般原理推导出具体结论',
        logicPattern: 'if A implies B and A is true, then B is true',
        parameters: { certainty: 0.9 },
      },
      {
        id: 'inductive_reasoning',
        name: '归纳推理',
        description: '从具体实例推导出一般规律',
        logicPattern: 'if multiple A lead to B, then A generally leads to B',
        parameters: { sampleSize: 5, confidence: 0.7 },
      },
      {
        id: 'analogical_reasoning',
        name: '类比推理',
        description: '基于相似性进行推理',
        logicPattern:
          'if A is similar to B in relevant ways, then conclusions about A may apply to B',
        parameters: { similarityThreshold: 0.6 },
      },
      {
        id: 'abductive_reasoning',
        name: '溯因推理',
        description: '寻找最可能的解释',
        logicPattern: 'given observation C, find hypothesis H that best explains C',
        parameters: { maxHypotheses: 3 },
      },
    ]
    for (const module of defaultModules) {
      this.logicModules.set(module.id, {
        ...module,
        usageCount: 0,
        lastUsed: new Date(0),
        successRate: 0.5,
      })
    }
  }
  isModuleApplicable(module, node, context) {
    const content = node.content.toLowerCase()
    switch (module.id) {
      case 'deductive_reasoning':
        return content.includes('if') || content.includes('then') || content.includes('implies')
      case 'inductive_reasoning':
        return (
          content.includes('multiple') ||
          content.includes('generally') ||
          content.includes('usually')
        )
      case 'analogical_reasoning':
        return (
          content.includes('similar') || content.includes('like') || content.includes('compare')
        )
      case 'abductive_reasoning':
        return content.includes('explain') || content.includes('why') || content.includes('reason')
      default:
        return false
    }
  }
  async executeLogicModule(module, node, context) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return {
      moduleId: module.id,
      result: `应用${module.name}到: ${node.content}`,
      confidence: module.successRate,
    }
  }
  async createChildThinkingNode(parentNode, strategy, logicResult, config, context) {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    let content = ''
    let confidence = 0.7
    switch (strategy) {
      case 'decomposition':
        content = `分解问题: ${parentNode.content} 可以拆分为哪些子问题？`
        confidence = 0.8
        break
      case 'analogy':
        content = `类比推理: ${parentNode.content} 与什么类似的情况？`
        confidence = 0.6
        break
      case 'counterfactual':
        content = `反事实推理: 如果${parentNode.content}的情况相反，会怎么样？`
        confidence = 0.5
        break
      case 'abstraction':
        content = `抽象提升: ${parentNode.content} 的本质规律是什么？`
        confidence = 0.7
        break
    }
    const node = {
      id: nodeId,
      type: 'recursive',
      content,
      confidence,
      depth: parentNode.depth + 1,
      parentId: parentNode.id,
      children: [],
      metadata: {
        createdAt: new Date(),
        activatedCount: 0,
        lastActivated: new Date(),
        tags: [...parentNode.metadata.tags, strategy],
        context: { ...context, strategy },
      },
    }
    this.thinkingNodes.set(nodeId, node)
    return node
  }
  async fuseThinkingResults(results, parentNode) {
    const fusedContent = results.join('; ')
    return `融合结果: ${fusedContent}`
  }
  contentToValue(content) {
    const words = content.split(' ').length
    const confidenceIndicators = (content.match(/(confident|certain|sure)/gi) || []).length
    return words * 0.1 + confidenceIndicators * 0.2
  }
  valueToContent(value, chain) {
    const confidence =
      chain.confidence > 0.8
        ? '高度自信'
        : chain.confidence > 0.6
          ? ' moderately confident'
          : '不太确定'
    return `经过深度思考得出的结论 (融合分数: ${value.toFixed(2)}, ${confidence})`
  }
})
exports.VcpMetaThinkingService = VcpMetaThinkingService
exports.VcpMetaThinkingService =
  VcpMetaThinkingService =
  VcpMetaThinkingService_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [config_1.ConfigService])],
      VcpMetaThinkingService
    )
//# sourceMappingURL=vcp-meta-thinking.service.js.map
