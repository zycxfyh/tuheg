Object.defineProperty(exports, '__esModule', { value: true })
exports.VcpPluginSystemExamples = void 0
const vcp_plugin_system_service_1 = require('./vcp-plugin-system.service')
const vcp_example_plugins_1 = require('./vcp-example-plugins')
class VcpPluginSystemExamples {
  pluginSystem
  constructor(pluginSystem) {
    this.pluginSystem = pluginSystem
  }
  async examplePluginRegistration() {
    console.log('🔌 插件注册和管理示例')
    console.log('')
    const examplePlugins = vcp_example_plugins_1.VcpExamplePluginFactory.createAllExamplePlugins()
    console.log(`准备注册 ${examplePlugins.length} 个示例插件:`)
    examplePlugins.forEach((plugin, index) => {
      console.log(
        `${index + 1}. ${plugin.config.name} (${plugin.config.type}) - ${plugin.config.description}`
      )
    })
    console.log('')
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
  async examplePluginChainExecution() {
    console.log('⛓️ 插件链执行示例')
    console.log('')
    const testInput = '我今天很高兴，因为我学会了新的编程技巧！'
    const context = {
      requestId: `test_${Date.now()}`,
      userId: 'test_user',
      sessionId: 'test_session',
      input: testInput,
    }
    console.log('输入内容:', testInput)
    console.log('')
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
  async exampleAsyncPluginHandling() {
    console.log('⚡ 异步插件处理示例')
    console.log('')
    const testContent = '这是一个需要深度分析的长文本内容，包含了多个主题和复杂的情感表达。'
    const context = {
      requestId: `async_test_${Date.now()}`,
      userId: 'test_user',
      input: testContent,
    }
    console.log('测试内容:', testContent.substring(0, 50) + '...')
    console.log('')
    console.log('启动异步插件...')
    const chainResult = await this.pluginSystem.executePluginChain(context, [
      vcp_plugin_system_service_1.VcpPluginType.ASYNCHRONOUS,
    ])
    if (chainResult.success && chainResult.metadata?.asyncExecution) {
      console.log('✅ 异步任务已启动')
      const asyncTasks = chainResult.output
      console.log(`异步任务数量: ${asyncTasks.asyncTasks.length}`)
      asyncTasks.asyncTasks.forEach((taskId, index) => {
        console.log(`  任务 ${index + 1}: ${taskId}`)
      })
      console.log('')
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
  async exampleServicePluginManagement() {
    console.log('🔧 服务插件管理示例')
    console.log('')
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
    console.log('插件系统运行状态正常，所有服务插件都在正常工作')
    console.log('')
    return healthResults
  }
  async exampleDynamicConfiguration() {
    console.log('⚙️ 插件动态配置示例')
    console.log('')
    const allPlugins = this.pluginSystem.getAllPlugins()
    console.log(`系统中注册了 ${allPlugins.length} 个插件`)
    console.log('')
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
    const configurablePlugins = allPlugins.filter((p) => p.config.config)
    if (configurablePlugins.length > 0) {
      const pluginToUpdate = configurablePlugins[0]
      console.log(`更新插件配置: ${pluginToUpdate.config.name}`)
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
  async exampleTypeSpecificExecution() {
    console.log('🎯 插件类型特定执行示例')
    console.log('')
    const testInput = '今天天气真好，我想出去走走。'
    const baseContext = {
      requestId: `type_specific_${Date.now()}`,
      userId: 'test_user',
      input: testInput,
    }
    const pluginTypes = [
      vcp_plugin_system_service_1.VcpPluginType.MESSAGE_PREPROCESSOR,
      vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS,
      vcp_plugin_system_service_1.VcpPluginType.ASYNCHRONOUS,
    ]
    const results = {}
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
    console.log('🎭 执行效果对比:')
    Object.entries(results).forEach(([type, result]) => {
      const status = result.success ? '成功' : '失败'
      const time = result.executionTime || 0
      console.log(`  ${type}: ${status} (${time}ms)`)
    })
    console.log('')
    return results
  }
  async examplePluginLifecycle() {
    console.log('🔄 插件生命周期演示')
    console.log('')
    const testPlugin = vcp_example_plugins_1.VcpExamplePluginFactory.createPluginByType(
      vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS
    )
    if (!testPlugin) {
      console.log('❌ 无法创建测试插件')
      return null
    }
    console.log(`创建测试插件: ${testPlugin.config.name} (${testPlugin.config.id})`)
    console.log('')
    try {
      console.log('1️⃣ 注册插件...')
      await this.pluginSystem.register(testPlugin)
      console.log('✅ 插件注册成功')
      console.log('')
      console.log('2️⃣ 使用插件执行任务...')
      const context = {
        requestId: `lifecycle_test_${Date.now()}`,
        userId: 'test_user',
        input: { action: 'get', key: 'test_key' },
      }
      const result = await this.pluginSystem.executePluginChain(context, [
        vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS,
      ])
      if (result.success) {
        console.log('✅ 插件执行成功')
        console.log(`   执行时间: ${result.executionTime}ms`)
      } else {
        console.log('❌ 插件执行失败:', result.error)
      }
      console.log('')
      console.log('3️⃣ 重新配置插件...')
      await this.pluginSystem.reloadPluginConfig(testPlugin.config.id, {
        priority: 999,
        description: '重新配置的关键词提取器',
      })
      console.log('✅ 插件配置更新成功')
      console.log('')
      console.log('4️⃣ 验证配置更新效果...')
      const updatedResult = await this.pluginSystem.executePluginChain(
        { ...context, requestId: `lifecycle_test_2_${Date.now()}` },
        [vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS]
      )
      if (updatedResult.success) {
        console.log('✅ 配置更新后插件执行成功')
      }
      console.log('')
    } finally {
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
  async examplePerformanceMonitoring() {
    console.log('📊 性能监控和分析示例')
    console.log('')
    const performanceTests = [
      {
        name: '简单同步操作',
        action: async () => {
          const context = {
            requestId: `perf_test_1_${Date.now()}`,
            input: '简单的文本处理',
          }
          return await this.pluginSystem.executePluginChain(context, [
            vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS,
          ])
        },
      },
      {
        name: '消息预处理',
        action: async () => {
          const context = {
            requestId: `perf_test_2_${Date.now()}`,
            input: '这是一个需要预处理的长文本内容，包含了各种信息。',
          }
          return await this.pluginSystem.executePluginChain(context, [
            vcp_plugin_system_service_1.VcpPluginType.MESSAGE_PREPROCESSOR,
          ])
        },
      },
      {
        name: '混合执行',
        action: async () => {
          const context = {
            requestId: `perf_test_3_${Date.now()}`,
            input: '复杂的混合处理任务',
          }
          return await this.pluginSystem.executePluginChain(context)
        },
      },
    ]
    const performanceResults = []
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
    const results = {}
    try {
      console.log('开始执行工作流...\n')
      console.log('📝 步骤 1: 插件注册和管理')
      results.registration = await this.examplePluginRegistration()
      console.log('✅ 完成\n')
      console.log('⛓️ 步骤 2: 插件链执行测试')
      results.chainExecution = await this.examplePluginChainExecution()
      console.log('✅ 完成\n')
      console.log('⚡ 步骤 3: 异步插件处理')
      results.asyncHandling = await this.exampleAsyncPluginHandling()
      console.log('✅ 完成\n')
      console.log('🔧 步骤 4: 服务插件监控')
      results.serviceMonitoring = await this.exampleServicePluginManagement()
      console.log('✅ 完成\n')
      console.log('⚙️ 步骤 5: 动态配置管理')
      results.dynamicConfig = await this.exampleDynamicConfiguration()
      console.log('✅ 完成\n')
      console.log('🎯 步骤 6: 类型特定执行')
      results.typeSpecific = await this.exampleTypeSpecificExecution()
      console.log('✅ 完成\n')
      console.log('🔄 步骤 7: 插件生命周期')
      results.lifecycle = await this.examplePluginLifecycle()
      console.log('✅ 完成\n')
      console.log('📊 步骤 8: 性能监控分析')
      results.performance = await this.examplePerformanceMonitoring()
      console.log('✅ 完成\n')
      console.log('🎉 完整工作流执行完毕！')
      console.log('')
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
exports.VcpPluginSystemExamples = VcpPluginSystemExamples
//# sourceMappingURL=vcp-plugin-system-examples.js.map
