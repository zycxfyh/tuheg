// ============================================================================
// Tar* 变量系统 - VCPToolBox 核心模块
// 实现动态配置、环境感知、模块化提示工程
// ============================================================================

export interface TarVariable {
  name: string
  value: any
  type: 'static' | 'dynamic' | 'computed'
  scope: 'global' | 'agent' | 'session' | 'task'
  dependencies: string[]
  updater?: (context: any) => any
  metadata: {
    description: string
    createdAt: Date
    updatedAt: Date
    author: string
    tags: string[]
  }
}

export interface VariableContext {
  agentId?: string
  sessionId?: string
  taskId?: string
  userId?: string
  environment: Record<string, any>
  timestamp: Date
}

export class TarVariableManager {
  private variables: Map<string, TarVariable> = new Map()
  private watchers: Map<string, Set<(variable: TarVariable) => void>> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()

  constructor() {
    this.initializeSystemVariables()
  }

  // ==================== 变量管理 ====================

  /**
   * 注册变量
   */
  registerVariable(variable: Omit<TarVariable, 'metadata'>): string {
    const fullVariable: TarVariable = {
      ...variable,
      metadata: {
        description: variable.metadata?.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: variable.metadata?.author || 'system',
        tags: variable.metadata?.tags || [],
      },
    }

    this.variables.set(variable.name, fullVariable)

    // 更新依赖图
    this.updateDependencyGraph(variable.name, variable.dependencies)

    // 设置监听器
    if (variable.type === 'dynamic' && variable.updater) {
      this.setupDynamicUpdate(variable.name, variable.updater)
    }

    return variable.name
  }

  /**
   * 获取变量值
   */
  async getVariableValue(
    name: string,
    context: VariableContext = { environment: {}, timestamp: new Date() }
  ): Promise<any> {
    const variable = this.variables.get(name)
    if (!variable) {
      throw new Error(`Variable ${name} not found`)
    }

    switch (variable.type) {
      case 'static':
        return variable.value

      case 'dynamic':
        if (variable.updater) {
          return await variable.updater(context)
        }
        return variable.value

      case 'computed':
        return await this.computeVariableValue(variable, context)

      default:
        return variable.value
    }
  }

  /**
   * 设置变量值
   */
  setVariableValue(name: string, value: any, context?: VariableContext): void {
    const variable = this.variables.get(name)
    if (!variable) {
      throw new Error(`Variable ${name} not found`)
    }

    variable.value = value
    variable.metadata.updatedAt = new Date()

    // 触发依赖更新
    this.triggerDependencyUpdate(name, context)

    // 通知观察者
    this.notifyWatchers(name, variable)
  }

  /**
   * 批量获取变量值
   */
  async getMultipleValues(
    names: string[],
    context?: VariableContext
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    for (const name of names) {
      results[name] = await this.getVariableValue(name, context)
    }

    return results
  }

  /**
   * 处理嵌套变量
   */
  async processNestedVariables(template: string, context?: VariableContext): Promise<string> {
    const variableRegex = /\{\{([^}]+)\}\}/g
    let result = template

    const matches = template.match(variableRegex)
    if (!matches) return template

    for (const match of matches) {
      const variableName = match.slice(2, -2).trim() // 移除 {{ }}
      try {
        const value = await this.getVariableValue(variableName, context)
        result = result.replace(
          new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          String(value)
        )
      } catch (error) {
        console.warn(`Failed to resolve variable ${variableName}:`, error)
        // 保留原样
      }
    }

    return result
  }

  /**
   * 设置变量观察器
   */
  watchVariable(name: string, callback: (variable: TarVariable) => void): () => void {
    if (!this.watchers.has(name)) {
      this.watchers.set(name, new Set())
    }

    this.watchers.get(name)?.add(callback)

    // 返回取消观察的函数
    return () => {
      const watchers = this.watchers.get(name)
      if (watchers) {
        watchers.delete(callback)
        if (watchers.size === 0) {
          this.watchers.delete(name)
        }
      }
    }
  }

  // ==================== 动态更新 ====================

  /**
   * 设置动态更新
   */
  setupDynamicUpdate(name: string, updater: (context: any) => any): void {
    const variable = this.variables.get(name)
    if (!variable) return

    variable.updater = updater
    variable.type = 'dynamic'

    // 定期更新（简单的实现）
    setInterval(async () => {
      try {
        const context: VariableContext = {
          environment: {},
          timestamp: new Date(),
        }
        const newValue = await updater(context)
        this.setVariableValue(name, newValue, context)
      } catch (error) {
        console.error(`Failed to update dynamic variable ${name}:`, error)
      }
    }, 30000) // 每30秒更新一次
  }

  /**
   * 触发变量更新
   */
  triggerVariableUpdate(name: string, context?: VariableContext): void {
    const variable = this.variables.get(name)
    if (!variable || !variable.updater) return

    // 异步更新
    setImmediate(async () => {
      try {
        const newValue = await variable.updater?.(
          context || { environment: {}, timestamp: new Date() }
        )
        this.setVariableValue(name, newValue, context)
      } catch (error) {
        console.error(`Failed to trigger update for ${name}:`, error)
      }
    })
  }

  // ==================== 依赖管理 ====================

  /**
   * 更新依赖图
   */
  private updateDependencyGraph(name: string, dependencies: string[]): void {
    // 清除旧依赖
    for (const [_dep, dependents] of this.dependencyGraph) {
      dependents.delete(name)
    }

    // 添加新依赖
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set())
      }
      this.dependencyGraph.get(dep)?.add(name)
    }
  }

  /**
   * 触发依赖更新
   */
  private triggerDependencyUpdate(name: string, context?: VariableContext): void {
    const dependents = this.dependencyGraph.get(name)
    if (!dependents) return

    for (const dependent of dependents) {
      this.triggerVariableUpdate(dependent, context)
    }
  }

  // ==================== 计算变量 ====================

  /**
   * 计算变量值
   */
  private async computeVariableValue(
    variable: TarVariable,
    context: VariableContext
  ): Promise<any> {
    // 简单的计算逻辑，可以扩展支持更复杂的表达式
    if (typeof variable.value === 'string') {
      return await this.processNestedVariables(variable.value, context)
    }

    if (typeof variable.value === 'function') {
      return await variable.value(context)
    }

    return variable.value
  }

  // ==================== 观察者通知 ====================

  /**
   * 通知观察者
   */
  private notifyWatchers(name: string, variable: TarVariable): void {
    const watchers = this.watchers.get(name)
    if (!watchers) return

    for (const watcher of watchers) {
      try {
        watcher(variable)
      } catch (error) {
        console.error(`Watcher error for variable ${name}:`, error)
      }
    }
  }

  // ==================== 系统变量初始化 ====================

  /**
   * 初始化系统变量
   */
  private initializeSystemVariables(): void {
    // 时间相关变量
    this.registerVariable({
      name: 'VarTimeNow',
      value: () => new Date().toLocaleString('zh-CN'),
      type: 'dynamic',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: '当前时间',
        author: 'system',
        tags: ['time', 'system'],
      },
    })

    // 位置相关变量
    this.registerVariable({
      name: 'VarCity',
      value: '未知城市',
      type: 'dynamic',
      scope: 'global',
      dependencies: [],
      updater: async () => {
        // 实际实现中会调用地理位置API
        return '北京市'
      },
      metadata: {
        description: '当前城市',
        author: 'system',
        tags: ['location', 'system'],
      },
    })

    // 天气变量
    this.registerVariable({
      name: 'VCPWeatherInfo',
      value: '晴天',
      type: 'dynamic',
      scope: 'global',
      dependencies: ['VarCity'],
      updater: async (context) => {
        const city = await this.getVariableValue('VarCity', context)
        // 实际实现中会调用天气API
        return `${city} - 晴天，温度20°C`
      },
      metadata: {
        description: '天气信息',
        author: 'system',
        tags: ['weather', 'system'],
      },
    })

    // 表情包路径
    this.registerVariable({
      name: 'VarHttpUrl',
      value: 'http://localhost:5890',
      type: 'static',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: '表情包服务器地址',
        author: 'system',
        tags: ['media', 'system'],
      },
    })

    // 图片密钥
    this.registerVariable({
      name: 'Image_Key',
      value: 'default',
      type: 'static',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: '图片访问密钥',
        author: 'system',
        tags: ['security', 'media'],
      },
    })

    // 工具列表
    this.registerVariable({
      name: 'VarToolList',
      value:
        '文生图工具{{VCPFluxGen}},计算器工具{{VCPSciCalculator}},联网搜索工具{{VCPTavilySearch}}',
      type: 'computed',
      scope: 'agent',
      dependencies: ['VCPFluxGen', 'VCPSciCalculator', 'VCPTavilySearch'],
      metadata: {
        description: '可用工具列表',
        author: 'system',
        tags: ['tools', 'agent'],
      },
    })
  }

  // ==================== 导入导出 ====================

  /**
   * 导出变量配置
   */
  exportVariables(): Record<string, Omit<TarVariable, 'updater'>> {
    const exported: Record<string, Omit<TarVariable, 'updater'>> = {}

    for (const [name, variable] of this.variables) {
      exported[name] = {
        name: variable.name,
        value: variable.value,
        type: variable.type,
        scope: variable.scope,
        dependencies: variable.dependencies,
        metadata: variable.metadata,
      }
    }

    return exported
  }

  /**
   * 导入变量配置
   */
  importVariables(variables: Record<string, Omit<TarVariable, 'updater'>>): void {
    for (const [_name, variableData] of Object.entries(variables)) {
      this.registerVariable(variableData)
    }
  }
}

// 创建全局实例
export const tarVariableManager = new TarVariableManager()
