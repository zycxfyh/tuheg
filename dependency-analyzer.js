#!/usr/bin/env node

/**
 * 高效依赖分析工具 - 使用现代工具栈
 * High-Performance Dependency Analyzer - Modern Tool Stack
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class DependencyAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.cache = new Map()
  }

  /**
   * 使用 Nx 进行依赖分析
   */
  analyzeWithNx() {
    console.log('🔍 使用 Nx 进行依赖图分析...')

    try {
      const result = execSync('npx nx graph --file=dependency-graph.json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      if (fs.existsSync('dependency-graph.json')) {
        const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'))
        return this.analyzeNxGraph(graph)
      }
    } catch (error) {
      console.warn('⚠️  Nx 依赖分析失败:', error.message)
    }

    return null
  }

  /**
   * 使用 Rush 进行大规模依赖分析
   */
  analyzeWithRush() {
    console.log('🏭 使用 Rush 进行大规模依赖分析...')

    try {
      // 检查是否有 rush.json
      if (!fs.existsSync(path.join(this.projectRoot, 'rush.json'))) {
        console.log('📝 创建 Rush 配置...')
        this.createRushConfig()
      }

      const result = execSync('npx @microsoft/rush list --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      return JSON.parse(result)
    } catch (error) {
      console.warn('⚠️  Rush 分析失败:', error.message)
      return null
    }
  }

  /**
   * 使用 madge 进行代码级依赖分析
   */
  analyzeWithMadge() {
    console.log('🔗 使用 madge 进行代码级依赖分析...')

    try {
      execSync('npm install -g madge', { stdio: 'pipe' })

      const result = execSync('madge --json --extensions ts,js src/', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      return JSON.parse(result)
    } catch (error) {
      console.warn('⚠️  Madge 分析失败:', error.message)
      return null
    }
  }

  /**
   * 使用 dependency-cruiser 进行高级依赖分析
   */
  analyzeWithCruiser() {
    console.log('🚢 使用 dependency-cruiser 进行高级分析...')

    try {
      execSync('npm install -g dependency-cruiser', { stdio: 'pipe' })

      const result = execSync('depcruise --output-type json --do-not-follow "^node_modules"', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      return JSON.parse(result)
    } catch (error) {
      console.warn('⚠️  Dependency-cruiser 分析失败:', error.message)
      return null
    }
  }

  /**
   * 分析 Nx 依赖图
   */
  analyzeNxGraph(graph) {
    const issues = []

    for (const [project, deps] of Object.entries(graph.dependencies || {})) {
      const projectLayer = this.getLayer(project)

      for (const dep of deps) {
        const depLayer = this.getLayer(dep)

        if (!this.isValidDependency(projectLayer, depLayer)) {
          issues.push({
            type: 'architecture_violation',
            from: project,
            to: dep,
            fromLayer: projectLayer,
            toLayer: depLayer,
            severity: 'high'
          })
        }
      }
    }

    return { issues, graph }
  }

  /**
   * 获取包的架构层级
   */
  getLayer(packageName) {
    const layers = {
      foundation: ['shared-types', 'abstractions'],
      infrastructure: ['infrastructure', 'config-management', 'ai-providers'],
      precompiled: ['database', 'event-bus'],
      domain: ['ai-domain', 'narrative-domain', 'enterprise-domain', 'game-core'],
      application: ['backend-gateway', 'creation-agent', 'logic-agent', 'narrative-agent', 'frontend']
    }

    for (const [layer, packages] of Object.entries(layers)) {
      if (packages.includes(packageName.replace('@tuheg/', ''))) {
        return layer
      }
    }

    return 'unknown'
  }

  /**
   * 检查依赖是否符合架构
   */
  isValidDependency(fromLayer, toLayer) {
    const layerOrder = ['foundation', 'infrastructure', 'precompiled', 'domain', 'application']
    const fromIndex = layerOrder.indexOf(fromLayer)
    const toIndex = layerOrder.indexOf(toLayer)

    return fromIndex >= toIndex
  }

  /**
   * 创建 Rush 配置
   */
  createRushConfig() {
    const rushConfig = {
      "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush.schema.json",
      "rushVersion": "5.100.0",
      "pnpmVersion": "8.0.0",
      "nodeSupportedVersionRange": ">=16.13.0 <19.0.0",
      "suppressNodeLtsWarning": false,
      "ensureConsistentVersions": true,
      "projects": [
        {
          "packageName": "@tuheg/shared-types",
          "projectFolder": "packages/shared-types"
        },
        {
          "packageName": "@tuheg/abstractions",
          "projectFolder": "packages/abstractions"
        },
        {
          "packageName": "@tuheg/infrastructure",
          "projectFolder": "packages/infrastructure"
        },
        {
          "packageName": "@tuheg/config-management",
          "projectFolder": "packages/config-management"
        },
        {
          "packageName": "@tuheg/ai-providers",
          "projectFolder": "packages/ai-providers"
        },
        {
          "packageName": "@tuheg/database",
          "projectFolder": "packages/database"
        },
        {
          "packageName": "@tuheg/event-bus",
          "projectFolder": "packages/event-bus"
        },
        {
          "packageName": "@tuheg/ai-domain",
          "projectFolder": "packages/ai-domain"
        },
        {
          "packageName": "@tuheg/narrative-domain",
          "projectFolder": "packages/narrative-domain"
        },
        {
          "packageName": "@tuheg/enterprise-domain",
          "projectFolder": "packages/enterprise-domain"
        },
        {
          "packageName": "@tuheg/game-core",
          "projectFolder": "packages/game-core"
        },
        {
          "packageName": "@tuheg/backend-gateway",
          "projectFolder": "apps/backend-gateway"
        },
        {
          "packageName": "@tuheg/creation-agent",
          "projectFolder": "apps/creation-agent"
        },
        {
          "packageName": "@tuheg/logic-agent",
          "projectFolder": "apps/logic-agent"
        },
        {
          "packageName": "@tuheg/narrative-agent",
          "projectFolder": "apps/narrative-agent"
        },
        {
          "packageName": "@tuheg/frontend",
          "projectFolder": "apps/frontend"
        }
      ]
    }

    fs.writeFileSync(
      path.join(this.projectRoot, 'rush.json'),
      JSON.stringify(rushConfig, null, 2)
    )
  }

  /**
   * 生成分析报告
   */
  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      tools: Object.keys(results),
      summary: {},
      issues: [],
      recommendations: []
    }

    // 汇总结果
    for (const [tool, result] of Object.entries(results)) {
      if (result && result.issues) {
        report.issues.push(...result.issues.map(issue => ({ ...issue, tool })))
      }
    }

    // 生成建议
    if (report.issues.length > 0) {
      report.recommendations = [
        '🔧 使用 Nx migrations 修复依赖关系',
        '📦 考虑将循环依赖的模块合并',
        '🏗️ 实施依赖倒置原则',
        '📋 创建模块边界守护者'
      ]
    }

    report.summary = {
      totalIssues: report.issues.length,
      highSeverity: report.issues.filter(i => i.severity === 'high').length,
      mediumSeverity: report.issues.filter(i => i.severity === 'medium').length,
      lowSeverity: report.issues.filter(i => i.severity === 'low').length
    }

    return report
  }

  /**
   * 运行完整分析
   */
  async runFullAnalysis() {
    console.log('🚀 开始完整依赖分析...\n')

    const results = {}

    // 并行运行所有分析工具
    const analyses = [
      { name: 'nx', fn: () => this.analyzeWithNx() },
      { name: 'rush', fn: () => this.analyzeWithRush() },
      { name: 'madge', fn: () => this.analyzeWithMadge() },
      { name: 'cruiser', fn: () => this.analyzeWithCruiser() }
    ]

    for (const analysis of analyses) {
      try {
        results[analysis.name] = await analysis.fn()
      } catch (error) {
        console.warn(`⚠️  ${analysis.name} 分析出错:`, error.message)
        results[analysis.name] = null
      }
    }

    const report = this.generateReport(results)

    // 保存报告
    fs.writeFileSync(
      path.join(this.projectRoot, 'dependency-analysis-report.json'),
      JSON.stringify(report, null, 2)
    )

    // 打印报告
    this.printReport(report)

    return report
  }

  /**
   * 打印报告
   */
  printReport(report) {
    console.log('\n📊 依赖分析报告')
    console.log('='.repeat(50))
    console.log(`时间: ${report.timestamp}`)
    console.log(`工具: ${report.tools.join(', ')}`)
    console.log(`总问题数: ${report.summary.totalIssues}`)
    console.log(`高严重性: ${report.summary.highSeverity}`)
    console.log(`中严重性: ${report.summary.mediumSeverity}`)
    console.log(`低严重性: ${report.summary.lowSeverity}`)

    if (report.issues.length > 0) {
      console.log('\n🚨 发现的问题:')
      report.issues.slice(0, 10).forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.tool}] ${issue.from} -> ${issue.to} (${issue.type})`)
      })

      if (report.issues.length > 10) {
        console.log(`... 还有 ${report.issues.length - 10} 个问题`)
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:')
      report.recommendations.forEach(rec => console.log(`- ${rec}`))
    }

    console.log('\n📄 详细报告已保存到: dependency-analysis-report.json')
  }
}

// 主函数
async function main() {
  const analyzer = new DependencyAnalyzer(process.cwd())
  await analyzer.runFullAnalysis()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = DependencyAnalyzer
