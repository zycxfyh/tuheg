import * as fs from 'node:fs'
import * as path from 'node:path'
import type { PluginSandboxService } from '@tuheg/ai-domain'
import chalk from 'chalk'
import ora from 'ora'

export interface SandboxTestOptions {
  input?: string
  tool?: string
  config?: string
  output?: string
}

/**
 * Plugin Sandbox Test Tool
 * 插件沙盒测试工具
 */
export class PluginSandboxTool {
  private sandboxService: PluginSandboxService

  constructor() {
    // 初始化沙盒服务
    this.sandboxService = new PluginSandboxService(null as any)
  }

  /**
   * 运行沙盒测试
   */
  async runSandboxTest(pluginPath: string, options: SandboxTestOptions = {}) {
    console.log(chalk.blue.bold('\n🧪 VCPToolBox Plugin Sandbox Test\n'))

    const absolutePath = path.resolve(pluginPath)

    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Plugin file not found: ${absolutePath}`))
      process.exit(1)
    }

    console.log(chalk.gray(`📁 Plugin: ${absolutePath}`))
    console.log(chalk.gray(`🛠️  Tool: ${options.tool || 'all'}`))
    console.log(chalk.gray(`📝 Input: ${options.input || 'default test input'}\n`))

    // 加载配置
    let _config = {}
    if (options.config) {
      try {
        _config = JSON.parse(fs.readFileSync(options.config, 'utf-8'))
        console.log(chalk.gray(`⚙️  Config loaded from: ${options.config}\n`))
      } catch (error) {
        console.warn(
          chalk.yellow(
            `⚠️  Failed to load config: ${error instanceof Error ? error.message : String(error)}`
          )
        )
      }
    }

    const results = {
      activation: false,
      tools: [] as any[],
      errors: [] as string[],
    }

    // 测试插件激活
    console.log(chalk.blue('🔌 Testing Plugin Activation...'))
    const activationSpinner = ora('Activating plugin in sandbox').start()

    try {
      const activationResult = await this.sandboxService.testPluginActivation(absolutePath, {
        timeout: 10000,
        allowedModules: ['path', 'url', 'util', 'crypto'],
      })

      if (activationResult.success) {
        activationSpinner.succeed('Plugin activated successfully')
        results.activation = true

        console.log(chalk.green('   ✅ Manifest validated'))
        console.log(chalk.gray(`   📦 ID: ${activationResult.result?.manifest?.id}`))
        console.log(chalk.gray(`   🏷️  Name: ${activationResult.result?.manifest?.name}`))
        console.log(
          chalk.gray(
            `   🔧 Tools: ${activationResult.result?.manifest?.contributes?.aiTools?.length || 0}`
          )
        )
        console.log(chalk.gray(`   ⚡ Time: ${activationResult.executionTime}ms`))

        const tools = activationResult.result?.manifest?.contributes?.aiTools || []

        if (tools.length > 0) {
          console.log(chalk.blue('\n🔧 Testing Plugin Tools...'))

          for (const tool of tools) {
            if (options.tool && tool.id !== options.tool) {
              continue // 跳过不匹配的工具
            }

            const toolSpinner = ora(`Testing tool: ${tool.name}`).start()

            try {
              const testInput = this.parseTestInput(options.input, tool)
              const toolResult = await this.sandboxService.testPluginTool(
                absolutePath,
                tool.id,
                testInput,
                {
                  timeout: 15000,
                  allowedModules: ['path', 'url', 'util', 'crypto'],
                }
              )

              if (toolResult.success) {
                toolSpinner.succeed(`${tool.name}: SUCCESS`)

                results.tools.push({
                  id: tool.id,
                  name: tool.name,
                  success: true,
                  input: testInput,
                  output: toolResult.result,
                  executionTime: toolResult.executionTime,
                })

                console.log(chalk.gray(`   📥 Input: ${JSON.stringify(testInput)}`))
                console.log(chalk.gray(`   📤 Output: ${JSON.stringify(toolResult.result)}`))
                console.log(chalk.gray(`   ⚡ Time: ${toolResult.executionTime}ms`))
              } else {
                toolSpinner.fail(`${tool.name}: FAILED`)
                results.tools.push({
                  id: tool.id,
                  name: tool.name,
                  success: false,
                  error: toolResult.error,
                  executionTime: toolResult.executionTime,
                })
                results.errors.push(`${tool.name}: ${toolResult.error}`)
              }
            } catch (error) {
              toolSpinner.fail(`${tool.name}: ERROR`)
              results.tools.push({
                id: tool.id,
                name: tool.name,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: 0,
              })
              results.errors.push(
                `${tool.name}: ${error instanceof Error ? error.message : String(error)}`
              )
            }
          }
        }
      } else {
        activationSpinner.fail('Plugin activation failed')
        results.errors.push(`Activation failed: ${activationResult.error}`)
      }
    } catch (error) {
      activationSpinner.fail('Activation test error')
      results.errors.push(
        `Activation error: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // 输出测试摘要
    this.printTestSummary(results)

    // 保存测试结果
    if (options.output) {
      this.saveTestResults(results, options.output)
    }

    // 返回测试结果
    return results
  }

  /**
   * 解析测试输入
   */
  private parseTestInput(input: string | undefined, tool: any): any {
    if (!input) {
      // 默认测试输入
      return { input: 'test input for sandbox' }
    }

    try {
      // 尝试解析为JSON
      return JSON.parse(input)
    } catch {
      // 如果不是JSON，按工具的输入Schema生成
      if (tool.inputSchema?.properties?.input) {
        return { input }
      } else {
        return { input }
      }
    }
  }

  /**
   * 输出测试摘要
   */
  private printTestSummary(results: any) {
    console.log(chalk.blue.bold('\n📊 Test Summary'))

    const totalTools = results.tools.length
    const passedTools = results.tools.filter((t: any) => t.success).length
    const failedTools = totalTools - passedTools

    console.log(chalk.gray(`   Activation: ${results.activation ? '✅ PASS' : '❌ FAIL'}`))
    console.log(chalk.gray(`   Tools: ${passedTools}/${totalTools} passed`))

    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'))
      results.errors.forEach((error: string) => {
        console.log(chalk.red(`   • ${error}`))
      })
    }

    if (failedTools === 0 && results.activation) {
      console.log(chalk.green('\n🎉 All tests passed! Your plugin is ready for production.'))
    } else {
      console.log(chalk.yellow('\n⚠️  Some tests failed. Please review the errors above.'))
    }
  }

  /**
   * 保存测试结果
   */
  private saveTestResults(results: any, outputPath: string) {
    const output = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        activation: results.activation,
        totalTools: results.tools.length,
        passedTools: results.tools.filter((t: any) => t.success).length,
        failedTools: results.tools.filter((t: any) => !t.success).length,
        errors: results.errors,
      },
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log(chalk.gray(`\n💾 Test results saved to: ${outputPath}`))
  }

  /**
   * 获取沙盒统计信息
   */
  getSandboxStats() {
    return this.sandboxService.getSandboxStats()
  }
}

// CLI 导出
export async function sandboxCommand(pluginPath: string, options: SandboxTestOptions) {
  const sandboxTool = new PluginSandboxTool()
  return await sandboxTool.runSandboxTest(pluginPath, options)
}
