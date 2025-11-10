#!/usr/bin/env node

/**
 * 可量化依赖分析工具 - 透明进度追踪
 * Quantified Dependency Analyzer - Transparent Progress Tracking
 */

const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(execSync)

class QuantifiedDependencyAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.startTime = Date.now()
    this.progress = {
      current: 0,
      total: 100,
      stage: '初始化',
      details: '',
    }
    this.cache = new Map()
    this.results = {}
  }

  /**
   * 更新进度
   */
  updateProgress(increment, stage, details = '') {
    this.progress.current += increment
    this.progress.stage = stage
    this.progress.details = details

    const percent = Math.min(100, Math.round((this.progress.current / this.progress.total) * 100))
    const elapsed = Date.now() - this.startTime
    const eta =
      this.progress.current > 0
        ? Math.round(
            (elapsed / this.progress.current) * (this.progress.total - this.progress.current)
          )
        : 0

    process.stdout.write(
      `\r[${'█'.repeat(Math.floor(percent / 2))}${'░'.repeat(50 - Math.floor(percent / 2))}] ${percent}% | ${stage} | ${details} | 耗时: ${Math.round(elapsed / 1000)}s | 预计剩余: ${Math.round(eta / 1000)}s`
    )
  }

  /**
   * 完成进度
   */
  completeProgress() {
    this.progress.current = this.progress.total
    this.updateProgress(0, '完成', '所有分析已完成')
    console.log('\n')
  }

  /**
   * 执行带超时的命令
   */
  async execWithTimeout(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const child = spawn(command, {
        shell: true,
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        const duration = Date.now() - startTime
        resolve({ code, stdout, stderr, duration })
      })

      child.on('error', (error) => {
        reject(error)
      })

      // 设置超时
      setTimeout(() => {
        child.kill()
        reject(new Error(`命令超时: ${command}`))
      }, timeout)
    })
  }

  /**
   * 阶段1: 项目结构分析
   */
  async analyzeProjectStructure() {
    this.updateProgress(5, '项目结构分析', '扫描包和应用')

    const packages = []
    const apps = []

    try {
      // 扫描 packages
      const packagesDir = path.join(this.projectRoot, 'packages')
      if (fsSync.existsSync(packagesDir)) {
        const items = await fs.readdir(packagesDir)
        for (const item of items) {
          const itemPath = path.join(packagesDir, item)
          const stat = await fs.stat(itemPath)
          if (stat.isDirectory()) {
            const packageJsonPath = path.join(itemPath, 'package.json')
            if (fsSync.existsSync(packageJsonPath)) {
              packages.push(item)
            }
          }
        }
      }

      // 扫描 apps
      const appsDir = path.join(this.projectRoot, 'apps')
      if (fsSync.existsSync(appsDir)) {
        const items = await fs.readdir(appsDir)
        for (const item of items) {
          const itemPath = path.join(appsDir, item)
          const stat = await fs.stat(itemPath)
          if (stat.isDirectory()) {
            const packageJsonPath = path.join(itemPath, 'package.json')
            if (fsSync.existsSync(packageJsonPath)) {
              apps.push(item)
            }
          }
        }
      }

      this.results.structure = { packages, apps, total: packages.length + apps.length }
      console.log(`  📦 发现 ${packages.length} 个包，${apps.length} 个应用`)
    } catch (error) {
      console.error(`  ❌ 项目结构分析失败:`, error.message)
      this.results.structure = { error: error.message }
    }
  }

  /**
   * 阶段2: 依赖关系扫描
   */
  async scanDependencies() {
    this.updateProgress(15, '依赖关系扫描', '分析 package.json 文件')

    const dependencies = {
      internal: new Map(),
      external: new Map(),
      devDependencies: new Map(),
    }

    const allModules = [
      ...(this.results.structure?.packages || []).map((p) => `packages/${p}`),
      ...(this.results.structure?.apps || []).map((a) => `apps/${a}`),
    ]

    for (const module of allModules) {
      const packageJsonPath = path.join(this.projectRoot, module, 'package.json')
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
        const moduleName = packageJson.name

        // 分析依赖
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        }

        for (const [dep, version] of Object.entries(allDeps)) {
          if (dep.startsWith('@tuheg/')) {
            // 内部依赖
            if (!dependencies.internal.has(moduleName)) {
              dependencies.internal.set(moduleName, [])
            }
            dependencies.internal.get(moduleName).push(dep)
          } else {
            // 外部依赖
            if (!dependencies.external.has(moduleName)) {
              dependencies.external.set(moduleName, [])
            }
            dependencies.external.get(moduleName).push(dep)
          }
        }
      } catch (error) {
        console.warn(`  ⚠️  无法分析 ${module}:`, error.message)
      }
    }

    this.results.dependencies = {
      internal: Object.fromEntries(dependencies.internal),
      externalCount: dependencies.external.size,
      totalInternalDeps: Array.from(dependencies.internal.values()).flat().length,
    }

    console.log(`  🔗 发现 ${this.results.dependencies.totalInternalDeps} 个内部依赖关系`)
  }

  /**
   * 阶段3: 架构合规性检查
   */
  async checkArchitectureCompliance() {
    this.updateProgress(20, '架构合规性检查', '验证依赖倒置和分层')

    const violations = []
    const layerOrder = ['foundation', 'infrastructure', 'precompiled', 'domain', 'application']

    const layerMap = {
      'shared-types': 'foundation',
      abstractions: 'foundation',
      infrastructure: 'infrastructure',
      'config-management': 'infrastructure',
      'ai-providers': 'infrastructure',
      database: 'precompiled',
      'event-bus': 'precompiled',
      'ai-domain': 'domain',
      'narrative-domain': 'domain',
      'enterprise-domain': 'domain',
      'game-core': 'domain',
      'backend-gateway': 'application',
      'creation-agent': 'application',
      'logic-agent': 'application',
      'narrative-agent': 'application',
      frontend: 'application',
    }

    for (const [from, deps] of Object.entries(this.results.dependencies.internal)) {
      const fromPackage = from.replace('@tuheg/', '')
      const fromLayer = layerMap[fromPackage]

      if (!fromLayer) continue

      for (const dep of deps) {
        const toPackage = dep.replace('@tuheg/', '')
        const toLayer = layerMap[toPackage]

        if (!toLayer) continue

        const fromIndex = layerOrder.indexOf(fromLayer)
        const toIndex = layerOrder.indexOf(toLayer)

        if (fromIndex < toIndex) {
          violations.push({
            from: fromPackage,
            to: toPackage,
            fromLayer,
            toLayer,
            severity: fromIndex < toIndex - 1 ? 'high' : 'medium',
            message: `${fromLayer} 层依赖 ${toLayer} 层`,
          })
        }
      }
    }

    this.results.architecture = {
      violations,
      compliance: violations.length === 0,
      violationCount: violations.length,
      highSeverityCount: violations.filter((v) => v.severity === 'high').length,
    }

    console.log(
      `  🏗️  发现 ${violations.length} 个架构违规 (${this.results.architecture.highSeverityCount} 个高严重性)`
    )
  }

  /**
   * 阶段4: 循环依赖检测
   */
  async detectCircularDependencies() {
    this.updateProgress(15, '循环依赖检测', '分析依赖图')

    const graph = new Map()
    const visited = new Set()
    const recStack = new Set()
    const cycles = []

    // 构建依赖图
    for (const [from, deps] of Object.entries(this.results.dependencies.internal)) {
      const fromPackage = from.replace('@tuheg/', '')
      graph.set(
        fromPackage,
        deps.map((d) => d.replace('@tuheg/', ''))
      )
    }

    // DFS 检测循环
    function dfs(node, path = []) {
      if (recStack.has(node)) {
        const cycleStart = path.indexOf(node)
        cycles.push([...path.slice(cycleStart), node])
        return
      }

      if (visited.has(node)) return

      visited.add(node)
      recStack.add(node)
      path.push(node)

      for (const neighbor of graph.get(node) || []) {
        dfs(neighbor, [...path])
      }

      path.pop()
      recStack.delete(node)
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node)
      }
    }

    this.results.cycles = {
      found: cycles.length > 0,
      count: cycles.length,
      cycles: cycles.slice(0, 5), // 只保留前5个循环
    }

    console.log(`  🔄  ${cycles.length > 0 ? '发现' : '未发现'}循环依赖`)
  }

  /**
   * 阶段5: 代码级依赖分析
   */
  async analyzeCodeDependencies() {
    this.updateProgress(20, '代码级依赖分析', '扫描 import 语句')

    const codeDeps = {
      totalImports: 0,
      internalImports: 0,
      externalImports: 0,
      filesAnalyzed: 0,
    }

    async function scanDirectory(dir, results) {
      try {
        const items = await fs.readdir(dir)

        for (const item of items) {
          const itemPath = path.join(dir, item)
          const stat = await fs.stat(itemPath)

          if (
            stat.isDirectory() &&
            !item.startsWith('.') &&
            item !== 'node_modules' &&
            item !== 'dist'
          ) {
            await scanDirectory(itemPath, results)
          } else if (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.vue')) {
            results.filesAnalyzed++
            try {
              const content = await fs.readFile(itemPath, 'utf8')
              const imports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || []

              for (const imp of imports) {
                results.totalImports++
                const match = imp.match(/from\s+['"]([^'"]+)['"]/)
                if (match) {
                  const modulePath = match[1]
                  if (modulePath.startsWith('@tuheg/')) {
                    results.internalImports++
                  } else if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
                    results.externalImports++
                  }
                }
              }
            } catch (error) {
              // 忽略读取错误
            }
          }
        }
      } catch (error) {
        // 忽略目录读取错误
      }
    }

    await scanDirectory(path.join(this.projectRoot, 'packages'), codeDeps)
    await scanDirectory(path.join(this.projectRoot, 'apps'), codeDeps)

    this.results.codeDeps = codeDeps
    console.log(
      `  📄  分析了 ${codeDeps.filesAnalyzed} 个文件，发现 ${codeDeps.totalImports} 个导入语句`
    )
  }

  /**
   * 阶段6: 生成报告
   */
  async generateReport() {
    this.updateProgress(15, '生成报告', '汇总分析结果')

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalModules:
          (this.results.structure?.packages?.length || 0) +
          (this.results.structure?.apps?.length || 0),
        totalInternalDeps: this.results.dependencies?.totalInternalDeps || 0,
        architectureViolations: this.results.architecture?.violationCount || 0,
        circularDependencies: this.results.cycles?.count || 0,
        filesAnalyzed: this.results.codeDeps?.filesAnalyzed || 0,
        totalImports: this.results.codeDeps?.totalImports || 0,
      },
      results: this.results,
      recommendations: this.generateRecommendations(),
      health: this.calculateHealthScore(),
    }

    await fs.writeFile(
      path.join(this.projectRoot, 'dependency-analysis-quantified.json'),
      JSON.stringify(report, null, 2)
    )

    this.results.report = report
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recs = []

    if (this.results.architecture?.violationCount > 0) {
      recs.push('🏗️ 重构架构违规的依赖关系')
    }

    if (this.results.cycles?.found) {
      recs.push('🔄 解决循环依赖问题')
    }

    if (this.results.codeDeps?.internalImports > this.results.dependencies?.totalInternalDeps) {
      recs.push('📦 同步 package.json 和代码导入')
    }

    recs.push('🧪 实施自动化依赖检测')
    recs.push('📚 创建依赖管理文档')

    return recs
  }

  /**
   * 计算健康分数
   */
  calculateHealthScore() {
    let score = 100

    // 架构违规扣分
    score -= (this.results.architecture?.violationCount || 0) * 10

    // 循环依赖严重扣分
    score -= (this.results.cycles?.count || 0) * 20

    // 依赖不一致扣分
    if (
      this.results.codeDeps?.internalImports >
      (this.results.dependencies?.totalInternalDeps || 0) * 1.5
    ) {
      score -= 15
    }

    return Math.max(0, score)
  }

  /**
   * 打印最终报告
   */
  printFinalReport() {
    const r = this.results.report
    console.log('\n🎯 依赖分析完成')
    console.log('='.repeat(60))
    console.log(`⏱️   总耗时: ${Math.round(r.duration / 1000)}秒`)
    console.log(`📦  模块数: ${r.summary.totalModules}`)
    console.log(`🔗  内部依赖: ${r.summary.totalInternalDeps}`)
    console.log(`🏗️   架构违规: ${r.summary.architectureViolations}`)
    console.log(`🔄  循环依赖: ${r.summary.circularDependencies}`)
    console.log(`📄  分析文件: ${r.summary.filesAnalyzed}`)
    console.log(`📥  导入语句: ${r.summary.totalImports}`)
    console.log(`❤️   健康分数: ${r.health}/100`)

    if (r.recommendations.length > 0) {
      console.log('\n💡 建议:')
      r.recommendations.forEach((rec) => console.log(`  • ${rec}`))
    }

    console.log(`\n📄 详细报告: dependency-analysis-quantified.json`)
  }

  /**
   * 运行完整分析
   */
  async run() {
    console.log('🚀 开始量化依赖分析...\n')
    this.updateProgress(0, '初始化', '准备分析环境')

    try {
      await this.analyzeProjectStructure()
      await this.scanDependencies()
      await this.checkArchitectureCompliance()
      await this.detectCircularDependencies()
      await this.analyzeCodeDependencies()
      await this.generateReport()

      this.completeProgress()
      this.printFinalReport()
    } catch (error) {
      console.error('\n❌ 分析过程中发生错误:', error.message)
      process.exit(1)
    }
  }
}

// 主函数
async function main() {
  const analyzer = new QuantifiedDependencyAnalyzer(process.cwd())
  await analyzer.run()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = QuantifiedDependencyAnalyzer
