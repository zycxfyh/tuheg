import * as fs from 'node:fs'
import * as path from 'node:path'
import type { PluginSandboxService } from '@tuheg/ai-domain'
import chalk from 'chalk'
import ora from 'ora'

export interface DebugOptions {
  port?: number
  watch?: boolean
  sandbox?: boolean
}

/**
 * Plugin Debug Tool
 * 插件调试工具
 */
export class PluginDebugTool {
  private sandboxService: PluginSandboxService

  constructor() {
    // 初始化沙盒服务
    this.sandboxService = new PluginSandboxService(null as any)
  }

  /**
   * 调试插件
   */
  async debugPlugin(pluginPath: string, options: DebugOptions = {}) {
    console.log(chalk.blue.bold('\n🔍 Starting Plugin Debug Session\n'))

    const absolutePath = path.resolve(pluginPath)

    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Plugin file not found: ${absolutePath}`))
      process.exit(1)
    }

    console.log(chalk.gray(`📁 Plugin: ${absolutePath}`))
    console.log(chalk.gray(`🧪 Sandbox: ${options.sandbox ? 'Enabled' : 'Disabled'}`))
    console.log(chalk.gray(`👀 Watch: ${options.watch ? 'Enabled' : 'Disabled'}\n`))

    if (options.sandbox) {
      await this.runSandboxTest(absolutePath)
    }

    if (options.watch) {
      this.startWatchMode(absolutePath, options)
    } else {
      await this.runSingleTest(absolutePath)
    }
  }

  /**
   * 运行单次测试
   */
  private async runSingleTest(pluginPath: string) {
    const spinner = ora('Testing plugin activation...').start()

    try {
      const result = await this.sandboxService.testPluginActivation(pluginPath, {
        timeout: 10000,
        allowedModules: ['path', 'url', 'util', 'crypto'],
      })

      if (result.success) {
        spinner.succeed('Plugin activation successful')

        console.log(chalk.green('\n✅ Plugin Details:'))
        console.log(chalk.gray(`   ID: ${result.result?.manifest?.id}`))
        console.log(chalk.gray(`   Name: ${result.result?.manifest?.name}`))
        console.log(chalk.gray(`   Version: ${result.result?.manifest?.version}`))
        console.log(
          chalk.gray(`   Tools: ${result.result?.manifest?.contributes?.aiTools?.length || 0}`)
        )
        console.log(chalk.gray(`   Execution Time: ${result.executionTime}ms`))

        // 测试工具执行
        if (result.result?.manifest?.contributes?.aiTools?.length > 0) {
          console.log(chalk.blue('\n🔧 Testing Tools...'))

          for (const tool of result.result.manifest.contributes.aiTools) {
            const toolSpinner = ora(`Testing tool: ${tool.name}`).start()

            try {
              const toolResult = await this.sandboxService.testPluginTool(
                pluginPath,
                tool.id,
                { input: 'test input' },
                { timeout: 5000 }
              )

              if (toolResult.success) {
                toolSpinner.succeed(`${tool.name}: ${toolResult.result?.result || 'OK'}`)
              } else {
                toolSpinner.fail(`${tool.name}: ${toolResult.error}`)
              }
            } catch (error) {
              toolSpinner.fail(
                `${tool.name}: ${error instanceof Error ? error.message : String(error)}`
              )
            }
          }
        }
      } else {
        spinner.fail('Plugin activation failed')
        console.log(chalk.red(`❌ Error: ${result.error}`))
      }
    } catch (error) {
      spinner.fail('Test execution failed')
      console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  /**
   * 运行沙盒测试
   */
  private async runSandboxTest(pluginPath: string) {
    console.log(chalk.blue('🧪 Running Sandbox Tests...\n'))

    // 测试不同场景
    const testScenarios = [
      { name: 'Basic Activation', timeout: 5000 },
      { name: 'Tool Execution', timeout: 10000 },
      { name: 'Error Handling', timeout: 3000 },
      { name: 'Resource Limits', timeout: 2000, memoryLimit: 50 * 1024 * 1024 }, // 50MB
    ]

    for (const scenario of testScenarios) {
      const spinner = ora(`Testing: ${scenario.name}`).start()

      try {
        const options: any = {
          timeout: scenario.timeout,
          allowedModules: ['path', 'url', 'util'],
        }
        if (scenario.memoryLimit) {
          options.memoryLimit = scenario.memoryLimit
        }
        const result = await this.sandboxService.testPluginActivation(pluginPath, options)

        if (result.success) {
          spinner.succeed(`${scenario.name}: PASS (${result.executionTime}ms)`)
        } else {
          spinner.warn(`${scenario.name}: ${result.error}`)
        }
      } catch (error) {
        spinner.fail(`${scenario.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * 启动监听模式
   */
  private startWatchMode(pluginPath: string, _options: DebugOptions) {
    console.log(chalk.blue('👀 Starting watch mode...\n'))
    console.log(chalk.gray('Press Ctrl+C to exit\n'))

    let timeoutId: NodeJS.Timeout

    const runTest = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        this.runSingleTest(pluginPath)
      }, 300)
    }

    // 初始运行
    runTest()

    // 监听文件变化
    fs.watch(path.dirname(pluginPath), { recursive: true }, (_eventType, filename) => {
      if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
        console.log(chalk.yellow(`\n📝 File changed: ${filename}`))
        runTest()
      }
    })

    // 处理退出
    process.on('SIGINT', () => {
      console.log(chalk.blue('\n👋 Goodbye!\n'))
      process.exit(0)
    })
  }

  /**
   * 获取插件信息
   */
  async getPluginInfo(pluginPath: string) {
    try {
      const result = await this.sandboxService.testPluginActivation(pluginPath, {
        timeout: 5000,
      })

      if (result.success) {
        return {
          manifest: result.result?.manifest,
          tools: result.result?.manifest?.contributes?.aiTools || [],
          executionTime: result.executionTime,
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      throw new Error(
        `Failed to get plugin info: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

// CLI 导出
export async function debugCommand(pluginPath: string, options: DebugOptions) {
  const debugTool = new PluginDebugTool()
  await debugTool.debugPlugin(pluginPath, options)
}
