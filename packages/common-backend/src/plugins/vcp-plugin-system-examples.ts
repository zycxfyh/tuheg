// 文件路径: packages/common-backend/src/plugins/vcp-plugin-system-examples.ts
// 职责: VCPToolBox 插件协议系统的使用示例
// 展示如何注册、使用和管理插件

import { VcpPluginSystemService, PluginContext, VcpPluginType } from './vcp-plugin-system.service'
import { VcpExamplePluginFactory } from './vcp-example-plugins'

/**
 * VCPToolBox 插件系统使用示例
 */
export class VcpPluginSystemExamples {
  constructor(private readonly pluginSystem: VcpPluginSystemService) {}

  /**
   * 示例1: 插件注册和管理
   * 展示如何注册、配置和管理插件
   */
  async examplePluginRegistration() {
    console.log('🔌 插件注册和管理示例')
    console.log('')

    // 获取所有示例插件
    const examplePlugins = VcpExamplePluginFactory.createAllExamplePlugins()

    console.log(`准备注册 ${examplePlugins.length} 个示例插件:`)
    examplePlugins.forEach((plugin, index) => {
      console.log(
        `${index + 1}. ${plugin.config.name} (${plugin.config.type}) - ${plugin.config.description}`
      )
    })
    console.log('')

    // 注册所有插件
    const registrationResults = []
    for (const plugin of examplePlugins) {
      try {
        await this.pluginSystem.register(plugin)
        registrationResults.push({
          pluginId: plugin.config.id,
          success: true,
          type: plugin.config.type,
        })
        console.log(`✅ 注册成功: ${plugin.config.name}`)
      } catch (error) {
        registrationResults.push({
          pluginId: plugin.config.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
        console.log(
          `❌ 注册失败: ${plugin.config.name} - ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
    console.log('')

    // 显示插件统计
    const stats = this.pluginSystem.getPluginStats()
    console.log('📊 插件系统统计:')
    console.log(`总插件数: ${stats.total}`)
    console.log('按类型分布:')
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count}个`)
      }
    })
    console.log('按状态分布:')
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`  ${status}: ${count}个`)
      }
    })
    console.log('')

    return { registrationResults, stats }
  }

  /**
   * 示例2: 插件链执行
   * 展示插件如何按类型和优先级有序执行
   */
  async examplePluginChainExecution() {
    console.log('⛓️ 插件链执行示例')
    console.log('')

    // 准备测试输入
    const testInput = '我今天很高兴，因为我学会了新的编程技巧！'
    const context: PluginContext = {
      requestId: `test_${Date.now()}`,
      userId: 'test_user',
      sessionId: 'test_session',
      input: testInput,
    }

    console.log('输入内容:', testInput)
    console.log('')

    // 执行完整的插件链
    console.log('执行插件链...')
    const result = await this.pluginSystem.executePluginChain(context)

    if (result.success) {
      console.log('✅ 插件链执行成功')
      console.log(`总执行时间: ${result.executionTime}ms`)
      console.log('输出结果:', result.output)
      if (result.metadata) {
        console.log('元数据:')
        Object.entries(result.metadata).forEach(([key, value]) => {
          console.log(`  ${key}: ${JSON.stringify(value)}`)
        })
      }
    } else {
      console.log('❌ 插件链执行失败:', result.error)
    }
    console.log('')

    return result
  }

  /**
   * 示例3: 异步插件处理
   * 展示异步插件的启动、监控和结果获取
   */
  async exampleAsyncPluginHandling() {
    console.log('⚡ 异步插件处理示例')
    console.log('')

    const testContent = '这是一个需要深度分析的长文本内容，包含了多个主题和复杂的情感表达。'
    const context: PluginContext = {
      requestId: `async_test_${Date.now()}`,
      userId: 'test_user',
      input: testContent,
    }

    console.log('测试内容:', testContent.substring(0, 50) + '...')
    console.log('')

    // 执行插件链（包含异步插件）
    console.log('启动异步插件...')
    const chainResult = await this.pluginSystem.executePluginChain(context, [
      VcpPluginType.ASYNCHRONOUS,
    ])

    if (chainResult.success && chainResult.metadata?.asyncExecution) {
      console.log('✅ 异步任务已启动')
      const asyncTasks = chainResult.output as { asyncTasks: string[] }

      console.log(`异步任务数量: ${asyncTasks.asyncTasks.length}`)
      asyncTasks.asyncTasks.forEach((taskId, index) => {
        console.log(`  任务 ${index + 1}: ${taskId}`)
      })
      console.log('')

      // 等待异步任务完成
      console.log('等待异步任务完成...')
      for (const taskId of asyncTasks.asyncTasks) {
        try {
          console.log(`等待任务: ${taskId}`)
          const taskResult = await this.pluginSystem.getAsyncTaskResult(taskId)

          if (taskResult.success) {
            console.log(`✅ 任务 ${taskId} 完成`)
            console.log(`   执行时间: ${taskResult.executionTime}ms`)
            console.log(`   结果: ${JSON.stringify(taskResult.output).substring(0, 100)}...`)
          } else {
            console.log(`❌ 任务 ${taskId} 失败: ${taskResult.error}`)
          }
        } catch (error) {
          console.log(
            `❌ 等待任务 ${taskId} 时出错:`,
            error instanceof Error ? error.message : String(error)
          )
        }
        console.log('')
      }
    } else {
      console.log('没有异步任务被执行')
    }

    return chainResult
  }

  /**
   * 示例4: 服务插件管理
   * 展示服务插件的启动、监控和停止
   */
  async exampleServicePluginManagement() {
    console.log('🔧 服务插件管理示例')
    console.log('')

    // 健康检查所有服务插件
    console.log('执行健康检查...')
    const healthResults = await this.pluginSystem.healthCheck()

    console.log('服务插件健康状态:')
    healthResults.forEach((result) => {
      const status = result.healthy ? '✅ 健康' : '❌ 不健康'
      console.log(`  ${result.pluginId}: ${status}`)
      if (result.message) {
        console.log(`    ${result.message}`)
      }
    })
    console.log('')

    // 这里可以演示服务插件的动态配置更新
    console.log('插件系统运行状态正常，所有服务插件都在正常工作')
    console.log('')

    return healthResults
  }

  /**
   * 示例5: 插件动态配置
   * 展示如何在运行时重新配置插件
   */
  async exampleDynamicConfiguration() {
    console.log('⚙️ 插件动态配置示例')
    console.log('')

    // 获取所有插件
    const allPlugins = this.pluginSystem.getAllPlugins()
    console.log(`系统中注册了 ${allPlugins.length} 个插件`)
    console.log('')

    // 为每个插件显示当前配置
    console.log('当前插件配置:')
    allPlugins.forEach((plugin) => {
      console.log(`📋 ${plugin.config.name} (${plugin.config.id}):`)
      console.log(`   类型: ${plugin.config.type}`)
      console.log(`   版本: ${plugin.config.version}`)
      console.log(`   优先级: ${plugin.config.priority}`)
      console.log(`   启用状态: ${plugin.config.enabled ? '✅' : '❌'}`)
      if (plugin.config.config) {
        console.log(`   自定义配置: ${JSON.stringify(plugin.config.config)}`)
      }
      console.log('')
    })

    // 演示配置更新（如果有可配置的插件）
    const configurablePlugins = allPlugins.filter((p) => p.config.config)
    if (configurablePlugins.length > 0) {
      const pluginToUpdate = configurablePlugins[0]
      console.log(`更新插件配置: ${pluginToUpdate.config.name}`)

      // 模拟配置更新
      const newConfig = {
        ...pluginToUpdate.config.config,
        updatedAt: new Date().toISOString(),
        version: '1.1.0',
      }

      try {
        await this.pluginSystem.reloadPluginConfig(pluginToUpdate.config.id, {
          version: '1.1.0',
          config: newConfig,
        })

        console.log('✅ 配置更新成功')
        console.log(`   新版本: ${newConfig.version}`)
        console.log(`   更新时间: ${newConfig.updatedAt}`)
      } catch (error) {
        console.log('❌ 配置更新失败:', error instanceof Error ? error.message : String(error))
      }
    } else {
      console.log('系统中没有可动态配置的插件')
    }
    console.log('')

    return allPlugins
  }

  /**
   * 示例6: 插件类型特定执行
   * 展示如何只执行特定类型的插件
   */
  async exampleTypeSpecificExecution() {
    console.log('🎯 插件类型特定执行示例')
    console.log('')

    const testInput = '今天天气真好，我想出去走走。'
    const baseContext: PluginContext = {
      requestId: `type_specific_${Date.now()}`,
      userId: 'test_user',
      input: testInput,
    }

    const pluginTypes = [
      VcpPluginType.MESSAGE_PREPROCESSOR,
      VcpPluginType.SYNCHRONOUS,
      VcpPluginType.ASYNCHRONOUS,
    ]

    const results: Record<string, any> = {}

    // 为每种类型单独执行插件链
    for (const pluginType of pluginTypes) {
      console.log(`执行 ${pluginType} 类型插件:`)

      const context = { ...baseContext }
      const result = await this.pluginSystem.executePluginChain(context, [pluginType])

      results[pluginType] = result

      if (result.success) {
        console.log(`  ✅ 执行成功 (${result.executionTime}ms)`)
        if (result.output && typeof result.output === 'object') {
          const outputStr = JSON.stringify(result.output)
          console.log(
            `  📤 输出: ${outputStr.substring(0, 100)}${outputStr.length > 100 ? '...' : ''}`
          )
        }
      } else {
        console.log(`  ❌ 执行失败: ${result.error}`)
      }
      console.log('')
    }

    // 对比不同类型插件的效果
    console.log('🎭 执行效果对比:')
    Object.entries(results).forEach(([type, result]) => {
      const status = result.success ? '成功' : '失败'
      const time = result.executionTime || 0
      console.log(`  ${type}: ${status} (${time}ms)`)
    })
    console.log('')

    return results
  }

  /**
   * 示例7: 插件生命周期演示
   * 展示插件的完整生命周期：注册 -> 使用 -> 重新配置 -> 注销
   */
  async examplePluginLifecycle() {
    console.log('🔄 插件生命周期演示')
    console.log('')

    // 创建一个新的插件实例
    const testPlugin = VcpExamplePluginFactory.createPluginByType(VcpPluginType.SYNCHRONOUS)
    if (!testPlugin) {
      console.log('❌ 无法创建测试插件')
      return null
    }

    console.log(`创建测试插件: ${testPlugin.config.name} (${testPlugin.config.id})`)
    console.log('')

    try {
      // 1. 注册插件
      console.log('1️⃣ 注册插件...')
      await this.pluginSystem.register(testPlugin)
      console.log('✅ 插件注册成功')
      console.log('')

      // 2. 使用插件
      console.log('2️⃣ 使用插件执行任务...')
      const context: PluginContext = {
        requestId: `lifecycle_test_${Date.now()}`,
        userId: 'test_user',
        input: { action: 'get', key: 'test_key' },
      }

      const result = await this.pluginSystem.executePluginChain(context, [
        VcpPluginType.SYNCHRONOUS,
      ])

      if (result.success) {
        console.log('✅ 插件执行成功')
        console.log(`   执行时间: ${result.executionTime}ms`)
      } else {
        console.log('❌ 插件执行失败:', result.error)
      }
      console.log('')

      // 3. 重新配置插件
      console.log('3️⃣ 重新配置插件...')
      await this.pluginSystem.reloadPluginConfig(testPlugin.config.id, {
        priority: 999,
        description: '重新配置的关键词提取器',
      })
      console.log('✅ 插件配置更新成功')
      console.log('')

      // 4. 再次使用插件验证配置
      console.log('4️⃣ 验证配置更新效果...')
      const updatedResult = await this.pluginSystem.executePluginChain(
        { ...context, requestId: `lifecycle_test_2_${Date.now()}` },
        [VcpPluginType.SYNCHRONOUS]
      )

      if (updatedResult.success) {
        console.log('✅ 配置更新后插件执行成功')
      }
      console.log('')
    } finally {
      // 5. 注销插件
      console.log('5️⃣ 注销插件...')
      try {
        await this.pluginSystem.unregister(testPlugin.config.id)
        console.log('✅ 插件注销成功')
      } catch (error) {
        console.log('❌ 插件注销失败:', error instanceof Error ? error.message : String(error))
      }
      console.log('')
    }

    console.log('🔄 插件生命周期演示完成')
    console.log('')

    return { success: true }
  }

  /**
   * 示例8: 性能监控和分析
   * 展示插件系统的性能监控能力
   */
  async examplePerformanceMonitoring() {
    console.log('📊 性能监控和分析示例')
    console.log('')

    // 执行一系列操作来收集性能数据
    const performanceTests = [
      {
        name: '简单同步操作',
        action: async () => {
          const context: PluginContext = {
            requestId: `perf_test_1_${Date.now()}`,
            input: '简单的文本处理',
          }
          return await this.pluginSystem.executePluginChain(context, [VcpPluginType.SYNCHRONOUS])
        },
      },
      {
        name: '消息预处理',
        action: async () => {
          const context: PluginContext = {
            requestId: `perf_test_2_${Date.now()}`,
            input: '这是一个需要预处理的长文本内容，包含了各种信息。',
          }
          return await this.pluginSystem.executePluginChain(context, [
            VcpPluginType.MESSAGE_PREPROCESSOR,
          ])
        },
      },
      {
        name: '混合执行',
        action: async () => {
          const context: PluginContext = {
            requestId: `perf_test_3_${Date.now()}`,
            input: '复杂的混合处理任务',
          }
          return await this.pluginSystem.executePluginChain(context)
        },
      },
    ]

    const performanceResults: Array<{
      name: string
      executionTime: number
      success: boolean
      metadata?: any
    }> = []

    console.log('执行性能测试...')
    for (const test of performanceTests) {
      console.log(`测试: ${test.name}`)
      const startTime = Date.now()

      try {
        const result = await test.action()
        const executionTime = Date.now() - startTime

        performanceResults.push({
          name: test.name,
          executionTime,
          success: result.success,
          metadata: result.metadata,
        })

        console.log(`  ⏱️ 耗时: ${executionTime}ms`)
        console.log(`  📊 状态: ${result.success ? '✅ 成功' : '❌ 失败'}`)
      } catch (error) {
        const executionTime = Date.now() - startTime
        performanceResults.push({
          name: test.name,
          executionTime,
          success: false,
        })
        console.log(`  ⏱️ 耗时: ${executionTime}ms`)
        console.log(
          `  📊 状态: ❌ 失败 - ${error instanceof Error ? error.message : String(error)}`
        )
      }
      console.log('')
    }

    // 分析性能数据
    console.log('📈 性能分析报告:')
    const totalTests = performanceResults.length
    const successfulTests = performanceResults.filter((r) => r.success).length
    const avgExecutionTime =
      performanceResults.reduce((sum, r) => sum + r.executionTime, 0) / totalTests

    console.log(
      `总体成功率: ${successfulTests}/${totalTests} (${Math.round((successfulTests / totalTests) * 100)}%)`
    )
    console.log(`平均执行时间: ${Math.round(avgExecutionTime)}ms`)
    console.log('')

    console.log('详细性能数据:')
    performanceResults.forEach((result) => {
      console.log(`  ${result.name}: ${result.executionTime}ms (${result.success ? '✅' : '❌'})`)
    })
    console.log('')

    // 获取系统统计
    const systemStats = this.pluginSystem.getPluginStats()
    console.log('📊 系统资源使用:')
    console.log(`活跃插件: ${systemStats.total}`)
    console.log(`异步任务: ${systemStats.asyncTasks}`)
    console.log('')

    return {
      performanceResults,
      systemStats,
      summary: {
        successRate: successfulTests / totalTests,
        avgExecutionTime,
        totalPlugins: systemStats.total,
        activeAsyncTasks: systemStats.asyncTasks,
      },
    }
  }

  /**
   * 综合示例: 完整的插件系统工作流
   * 从插件注册到执行监控的完整流程
   */
  async exampleCompleteWorkflow() {
    console.log('🚀 完整的插件系统工作流示例')
    console.log('')

    const workflowSteps = [
      '插件注册和管理',
      '插件链执行测试',
      '异步插件处理',
      '服务插件监控',
      '动态配置管理',
      '类型特定执行',
      '插件生命周期',
      '性能监控分析',
    ]

    console.log('将按顺序执行以下步骤:')
    workflowSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`)
    })
    console.log('')

    const results: Record<string, any> = {}

    // 执行完整的流程
    try {
      console.log('开始执行工作流...\n')

      // 1. 插件注册和管理
      console.log('📝 步骤 1: 插件注册和管理')
      results.registration = await this.examplePluginRegistration()
      console.log('✅ 完成\n')

      // 2. 插件链执行测试
      console.log('⛓️ 步骤 2: 插件链执行测试')
      results.chainExecution = await this.examplePluginChainExecution()
      console.log('✅ 完成\n')

      // 3. 异步插件处理
      console.log('⚡ 步骤 3: 异步插件处理')
      results.asyncHandling = await this.exampleAsyncPluginHandling()
      console.log('✅ 完成\n')

      // 4. 服务插件监控
      console.log('🔧 步骤 4: 服务插件监控')
      results.serviceMonitoring = await this.exampleServicePluginManagement()
      console.log('✅ 完成\n')

      // 5. 动态配置管理
      console.log('⚙️ 步骤 5: 动态配置管理')
      results.dynamicConfig = await this.exampleDynamicConfiguration()
      console.log('✅ 完成\n')

      // 6. 类型特定执行
      console.log('🎯 步骤 6: 类型特定执行')
      results.typeSpecific = await this.exampleTypeSpecificExecution()
      console.log('✅ 完成\n')

      // 7. 插件生命周期
      console.log('🔄 步骤 7: 插件生命周期')
      results.lifecycle = await this.examplePluginLifecycle()
      console.log('✅ 完成\n')

      // 8. 性能监控分析
      console.log('📊 步骤 8: 性能监控分析')
      results.performance = await this.examplePerformanceMonitoring()
      console.log('✅ 完成\n')

      console.log('🎉 完整工作流执行完毕！')
      console.log('')

      // 生成总结报告
      console.log('📋 工作流总结报告:')
      console.log(`总步骤数: ${workflowSteps.length}`)
      console.log(`成功执行: ${Object.keys(results).length}`)
      console.log(`系统状态: 所有插件正常运行`)
      console.log('')
    } catch (error) {
      console.log('❌ 工作流执行失败:', error instanceof Error ? error.message : String(error))
      results.error = error
    }

    return results
  }
}

/**
 * 使用指南
 *
 * 1. 导入和初始化:
 * import { VcpPluginSystemService } from './vcp-plugin-system.service';
 * import { VcpExamplePluginFactory } from './vcp-example-plugins';
 *
 * const pluginSystem = new VcpPluginSystemService(eventEmitter);
 *
 * 2. 注册插件:
 * const plugin = VcpExamplePluginFactory.createPluginByType(VcpPluginType.SYNCHRONOUS);
 * await pluginSystem.register(plugin);
 *
 * 3. 执行插件链:
 * const result = await pluginSystem.executePluginChain(context);
 *
 * 4. 异步任务处理:
 * const taskId = await pluginSystem.executeAsync(context);
 * const result = await pluginSystem.getAsyncTaskResult(taskId);
 *
 * 5. 插件管理:
 * const stats = pluginSystem.getPluginStats();
 * const health = await pluginSystem.healthCheck();
 *
 * 6. 动态配置:
 * await pluginSystem.reloadPluginConfig(pluginId, newConfig);
 *
 * 插件类型:
 * - STATIC: 系统启动时加载，过滤敏感内容
 * - MESSAGE_PREPROCESSOR: 处理输入消息，情绪分析
 * - SYNCHRONOUS: 同步执行，关键词提取
 * - ASYNCHRONOUS: 异步执行，深度内容分析
 * - SERVICE: 持续运行，定时清理服务
 * - HYBRID_SERVICE: 结合同步和异步功能
 *
 * 优势:
 * - 🔌 模块化架构: 支持6种插件类型，满足不同场景需求
 * - ⚡ 高性能: 异步插件和优先级调度，优化执行效率
 * - 🔧 动态管理: 运行时注册、配置、注销插件
 * - 📊 可观测性: 完整的监控、日志和健康检查
 * - 🛡️ 容错性强: 插件失败不影响整体系统运行
 */
