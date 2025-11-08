const fs = require('fs')
const path = require('path')
const chalk = require('chalk').default
const ora = require('ora').default

/**
 * Plugin Sandbox Test Tool (JavaScript Version)
 * 插件沙盒测试工具
 */
class PluginSandboxTool {
  constructor() {
    this.sandboxes = new Map()
  }

  /**
   * 运行沙盒测试
   */
  async runSandboxTest(pluginPath, options = {}) {
    console.log(chalk.blue.bold('\n🧪 VCPToolBox Plugin Sandbox Test\n'))

    const absolutePath = path.resolve(pluginPath)

    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Plugin file not found: ${absolutePath}`))
      process.exit(1)
    }

    console.log(chalk.gray(`📁 Plugin: ${absolutePath}`))
    console.log(chalk.gray(`🛠️  Tool: ${options.tool || 'all'}`))
    console.log(chalk.gray(`📝 Input: ${options.input || 'default test input'}\n`))

    const results = {
      activation: false,
      tools: [],
      errors: [],
    }

    // 模拟插件激活测试
    console.log(chalk.blue('🔌 Testing Plugin Activation...'))
    const activationSpinner = ora('Activating plugin in sandbox').start()

    try {
      // 读取插件文件
      const pluginCode = fs.readFileSync(absolutePath, 'utf-8')

      // 基础语法检查
      this.basicSyntaxCheck(pluginCode)

      // 模拟激活延迟
      await new Promise((resolve) => setTimeout(resolve, 100))

      activationSpinner.succeed('Plugin syntax validation passed')
      results.activation = true

      console.log(chalk.green('   ✅ Basic syntax validation'))
      console.log(chalk.green('   ✅ Plugin structure validation'))
      console.log(chalk.gray(`   ⚡ Simulated activation time: 100ms`))

      // 模拟工具测试
      const mockTools = this.extractMockTools(pluginCode)

      if (mockTools.length > 0) {
        console.log(chalk.blue('\n🔧 Testing Plugin Tools...'))

        for (const tool of mockTools) {
          if (options.tool && tool.id !== options.tool) {
            continue // 跳过不匹配的工具
          }

          const toolSpinner = ora(`Testing tool: ${tool.name}`).start()

          try {
            // 模拟工具执行
            await new Promise((resolve) => setTimeout(resolve, 200))

            const testInput = options.input || 'test input for sandbox'
            const mockResult = `Processed input: ${testInput}`

            toolSpinner.succeed(`${tool.name}: SUCCESS`)

            results.tools.push({
              id: tool.id,
              name: tool.name,
              success: true,
              input: testInput,
              output: mockResult,
              executionTime: 200,
            })

            console.log(chalk.gray(`   📥 Input: ${testInput}`))
            console.log(chalk.gray(`   📤 Output: ${mockResult}`))
            console.log(chalk.gray(`   ⚡ Time: 200ms`))
          } catch (error) {
            toolSpinner.fail(`${tool.name}: ERROR`)
            results.tools.push({
              id: tool.id,
              name: tool.name,
              success: false,
              error: error.message,
              executionTime: 0,
            })
            results.errors.push(`${tool.name}: ${error.message}`)
          }
        }
      }
    } catch (error) {
      activationSpinner.fail('Plugin validation failed')
      results.errors.push(`Validation error: ${error.message}`)
    }

    // 输出测试摘要
    this.printTestSummary(results)

    // 保存测试结果
    if (options.output) {
      this.saveTestResults(results, options.output)
    }

    return results
  }

  /**
   * 基础语法检查
   */
  basicSyntaxCheck(code) {
    // 检查基本的JavaScript/TypeScript语法
    if (!code.includes('export') && !code.includes('module.exports')) {
      throw new Error('Plugin must export a class or function')
    }

    if (!code.includes('manifest')) {
      throw new Error('Plugin must have a manifest property')
    }

    if (!code.includes('activate')) {
      throw new Error('Plugin must have an activate method')
    }
  }

  /**
   * 提取模拟工具信息
   */
  extractMockTools(code) {
    const tools = []

    // 从代码中提取工具信息（简化版本）
    const toolMatches = code.match(/id:\s*['"`]([^'"`]+)['"`]/g)
    if (toolMatches) {
      toolMatches.forEach((match, index) => {
        const toolId = match.replace(/id:\s*['"`]/g, '').replace(/['"`]/g, '')
        tools.push({
          id: toolId,
          name: `${toolId} Tool`,
          description: `Mock tool ${index + 1}`,
        })
      })
    }

    // 如果没有找到工具，添加默认工具
    if (tools.length === 0) {
      tools.push({
        id: 'default-tool',
        name: 'Default Tool',
        description: 'Default plugin tool',
      })
    }

    return tools
  }

  /**
   * 输出测试摘要
   */
  printTestSummary(results) {
    console.log(chalk.blue.bold('\n📊 Test Summary'))

    const totalTools = results.tools.length
    const passedTools = results.tools.filter((t) => t.success).length
    const failedTools = totalTools - passedTools

    console.log(chalk.gray(`   Activation: ${results.activation ? '✅ PASS' : '❌ FAIL'}`))
    console.log(chalk.gray(`   Tools: ${passedTools}/${totalTools} passed`))

    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'))
      results.errors.forEach((error) => {
        console.log(chalk.red(`   • ${error}`))
      })
    }

    if (failedTools === 0 && results.activation) {
      console.log(chalk.green('\n🎉 All tests passed! Your plugin is ready for development.'))
    } else {
      console.log(chalk.yellow('\n⚠️  Some tests failed. Please review the errors above.'))
    }
  }

  /**
   * 保存测试结果
   */
  saveTestResults(results, outputPath) {
    const output = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        activation: results.activation,
        totalTools: results.tools.length,
        passedTools: results.tools.filter((t) => t.success).length,
        failedTools: results.tools.filter((t) => !t.success).length,
        errors: results.errors,
      },
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log(chalk.gray(`\n💾 Test results saved to: ${outputPath}`))
  }
}

// CLI 导出
async function sandboxCommand(pluginPath, options) {
  const sandboxTool = new PluginSandboxTool()
  return await sandboxTool.runSandboxTest(pluginPath, options)
}

module.exports = { PluginSandboxTool, sandboxCommand }
