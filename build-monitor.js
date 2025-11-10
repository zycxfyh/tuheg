#!/usr/bin/env node

/**
 * 量化构建监控工具 - 实时构建进度追踪
 * Quantified Build Monitor - Real-time Build Progress Tracking
 */

const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

class BuildMonitor {
  constructor() {
    this.startTime = Date.now()
    this.progress = {
      current: 0,
      total: 100,
      stage: '初始化',
      details: '',
      currentPackage: '',
      completedPackages: [],
      failedPackages: []
    }
    this.packages = [
      'shared-types',
      'abstractions',
      'infrastructure',
      'config-management',
      'ai-providers',
      'database',
      'event-bus',
      'ai-domain',
      'narrative-domain',
      'enterprise-domain',
      'game-core',
      'vcptoolbox-sdk',
      'backend-gateway',
      'creation-agent',
      'logic-agent',
      'narrative-agent',
      'frontend'
    ]
    this.packageProgress = {}
  }

  /**
   * 更新进度
   */
  updateProgress(increment, stage, details = '') {
    this.progress.current = Math.min(100, this.progress.current + increment)
    this.progress.stage = stage
    this.progress.details = details

    const percent = Math.round(this.progress.current)
    const elapsed = Date.now() - this.startTime
    const eta = this.progress.current > 0 ? Math.round((elapsed / this.progress.current) * (this.progress.total - this.progress.current)) : 0

    // 清除当前行并重写
    process.stdout.write('\r\x1b[K')
    process.stdout.write(`[${'█'.repeat(Math.floor(percent/2))}${'░'.repeat(50-Math.floor(percent/2))}] ${percent}% | ${stage} | ${details} | 耗时: ${Math.round(elapsed/1000)}s | 预计剩余: ${Math.round(eta/1000)}s`)
  }

  /**
   * 完成进度
   */
  completeProgress() {
    this.progress.current = 100
    this.updateProgress(0, '完成', `成功: ${this.progress.completedPackages.length}, 失败: ${this.progress.failedPackages.length}`)
    console.log('\n')
  }

  /**
   * 解析构建输出
   */
  parseBuildOutput(data, packageName) {
    const output = data.toString()

    // 检测构建阶段
    if (output.includes('Compiling TypeScript')) {
      this.updateProgress(0, `编译 ${packageName}`, 'TypeScript 编译中...')
    } else if (output.includes('Generating')) {
      this.updateProgress(0, `生成 ${packageName}`, '生成类型定义...')
    } else if (output.includes('Bundling')) {
      this.updateProgress(0, `打包 ${packageName}`, '打包输出文件...')
    } else if (output.includes('Successfully')) {
      this.updateProgress(0, `完成 ${packageName}`, '构建成功 ✓')
    }

    // 检测错误
    if (output.includes('error') || output.includes('Error') || output.includes('ERROR')) {
      console.log(`\n❌ ${packageName} 构建错误:`)
      console.log(output)
    }
  }

  /**
   * 构建单个包
   */
  async buildPackage(packageName) {
    return new Promise((resolve) => {
      this.progress.currentPackage = packageName
      this.updateProgress(0, `构建 ${packageName}`, '启动构建...')

      const startTime = Date.now()
      const child = spawn('npx', ['nx', 'build', packageName], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      child.stdout.on('data', (data) => {
        this.parseBuildOutput(data, packageName)
      })

      child.stderr.on('data', (data) => {
        this.parseBuildOutput(data, packageName)
      })

      child.on('close', (code) => {
        const duration = Date.now() - startTime

        if (code === 0) {
          this.progress.completedPackages.push(packageName)
          this.packageProgress[packageName] = {
            status: 'success',
            duration,
            size: this.getPackageSize(packageName)
          }
          this.updateProgress(100 / this.packages.length, `完成 ${packageName}`, `✓ ${Math.round(duration/1000)}s`)
        } else {
          this.progress.failedPackages.push(packageName)
          this.packageProgress[packageName] = {
            status: 'failed',
            duration,
            code
          }
          this.updateProgress(100 / this.packages.length, `失败 ${packageName}`, `✗ ${Math.round(duration/1000)}s`)
        }

        resolve({ packageName, code, duration })
      })

      child.on('error', (error) => {
        console.error(`\n💥 ${packageName} 构建异常:`, error.message)
        this.progress.failedPackages.push(packageName)
        this.packageProgress[packageName] = {
          status: 'error',
          duration: Date.now() - startTime,
          error: error.message
        }
        resolve({ packageName, code: -1, duration: Date.now() - startTime })
      })

      // 设置超时 (5分钟)
      setTimeout(() => {
        child.kill()
        console.error(`\n⏰ ${packageName} 构建超时 (5分钟)`)
        this.progress.failedPackages.push(packageName)
        this.packageProgress[packageName] = {
          status: 'timeout',
          duration: Date.now() - startTime
        }
        resolve({ packageName, code: -2, duration: Date.now() - startTime })
      }, 300000)
    })
  }

  /**
   * 获取包大小
   */
  getPackageSize(packageName) {
    try {
      const distPath = path.join(process.cwd(), 'dist', 'packages', packageName)
      let totalSize = 0

      function calculateSize(dir) {
        if (!fs.existsSync(dir)) return

        const items = fs.readdirSync(dir)
        for (const item of items) {
          const itemPath = path.join(dir, item)
          const stat = fs.statSync(itemPath)

          if (stat.isDirectory()) {
            calculateSize(itemPath)
          } else {
            totalSize += stat.size
          }
        }
      }

      calculateSize(distPath)
      return totalSize
    } catch (error) {
      return 0
    }
  }

  /**
   * 生成构建报告
   */
  async generateReport() {
    this.updateProgress(0, '生成报告', '汇总构建结果')

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalPackages: this.packages.length,
        successful: this.progress.completedPackages.length,
        failed: this.progress.failedPackages.length,
        successRate: Math.round((this.progress.completedPackages.length / this.packages.length) * 100)
      },
      packages: this.packageProgress,
      recommendations: this.generateRecommendations()
    }

    await fs.writeFile(
      path.join(process.cwd(), 'build-report.json'),
      JSON.stringify(report, null, 2)
    )

    return report
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recs = []

    if (this.progress.failedPackages.length > 0) {
      recs.push(`🔧 修复失败的包: ${this.progress.failedPackages.join(', ')}`)
    }

    const avgDuration = Object.values(this.packageProgress)
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.duration, 0) / this.progress.completedPackages.length

    if (avgDuration > 30000) { // 30秒
      recs.push('⚡ 考虑优化构建性能 (平均构建时间过长)')
    }

    if (this.progress.completedPackages.length > 0) {
      recs.push('📦 考虑实施增量构建策略')
      recs.push('🔄 设置自动化 CI/CD 构建')
    }

    return recs
  }

  /**
   * 打印最终报告
   */
  printFinalReport(report) {
    console.log('\n🏗️  构建测试完成')
    console.log('='.repeat(60))
    console.log(`⏱️   总耗时: ${Math.round(report.duration / 1000)}秒`)
    console.log(`📦  包总数: ${report.summary.totalPackages}`)
    console.log(`✅  成功: ${report.summary.successful}`)
    console.log(`❌  失败: ${report.summary.failed}`)
    console.log(`📊  成功率: ${report.summary.successRate}%`)

    if (report.summary.successful > 0) {
      const avgDuration = Object.values(report.packages)
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.duration, 0) / report.summary.successful

      console.log(`⏱️   平均构建时间: ${Math.round(avgDuration / 1000)}秒`)

      const totalSize = Object.values(report.packages)
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + (p.size || 0), 0)

      console.log(`💾  输出大小: ${Math.round(totalSize / 1024)}KB`)
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:')
      report.recommendations.forEach(rec => console.log(`  • ${rec}`))
    }

    if (report.summary.failed > 0) {
      console.log('\n❌ 失败的包:')
      report.summary.failedPackages.forEach(pkg => console.log(`  • ${pkg}`))
    }

    console.log(`\n📄 详细报告: build-report.json`)
  }

  /**
   * 运行构建测试
   */
  async run() {
    console.log('🚀 开始量化构建测试...\n')
    this.updateProgress(0, '初始化', '准备构建环境')

    // 顺序构建包 (考虑依赖关系)
    const buildOrder = [
      // 基础层
      'shared-types',
      'abstractions',

      // 基础设施层
      'infrastructure',
      'config-management',
      'ai-providers',

      // 预编译层
      'database',
      'event-bus',

      // 领域层
      'ai-domain',
      'narrative-domain',
      'enterprise-domain',
      'game-core',

      // 应用层
      'vcptoolbox-sdk',
      'backend-gateway',
      'creation-agent',
      'logic-agent',
      'narrative-agent',
      'frontend'
    ]

    const results = []

    for (const packageName of buildOrder) {
      if (!this.packages.includes(packageName)) continue

      const result = await this.buildPackage(packageName)
      results.push(result)

      // 如果基础包失败，停止构建
      if ((packageName === 'shared-types' || packageName === 'abstractions') && result.code !== 0) {
        console.log(`\n🛑 基础包 ${packageName} 构建失败，停止后续构建`)
        break
      }
    }

    const report = await this.generateReport()
    this.completeProgress()
    this.printFinalReport(report)

    return report
  }
}

// 主函数
async function main() {
  const monitor = new BuildMonitor()
  const report = await monitor.run()

  // 设置退出码
  process.exit(report.summary.failed > 0 ? 1 : 0)
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = BuildMonitor
