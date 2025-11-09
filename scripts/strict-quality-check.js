#!/usr/bin/env node

/**
 * 严格质量检查脚本
 * 执行完整的质量保证流程，包括所有严格测试
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

function execCommand(command, description, continueOnError = false) {
  try {
    log(colors.blue, `🔍 ${description}...`)
    const _result = execSync(command, {
      stdio: 'inherit',
      timeout: 600000, // 10分钟超时
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    log(colors.green, `✅ ${description} 通过`)
    return true
  } catch (error) {
    const message = continueOnError ? '⚠️' : '❌'
    log(continueOnError ? colors.yellow : colors.red, `${message} ${description} 失败`)
    if (!continueOnError) {
      console.error(error.message)
      process.exit(1)
    }
    return false
  }
}

function checkCoverage() {
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json')

  if (!fs.existsSync(coveragePath)) {
    log(colors.red, '❌ 覆盖率报告不存在')
    return false
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
    const { total } = coverage

    const thresholds = {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    }

    let allPassed = true
    const results = []

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const actual = Math.round(total[metric].pct)
      const passed = actual >= threshold
      const _status = passed ? colors.green : colors.red
      const icon = passed ? '✅' : '❌'

      results.push(`${icon} ${metric}: ${actual}% (阈值: ${threshold}%)`)

      if (!passed) {
        allPassed = false
      }
    })

    log(colors.cyan, '\n📊 覆盖率检查结果:')
    results.forEach((result) => {
      console.log(result)
    })

    return allPassed
  } catch (_error) {
    log(colors.red, '❌ 解析覆盖率报告失败')
    return false
  }
}

function generateQualityReport(results) {
  const reportPath = path.join(__dirname, '..', 'quality-report.json')

  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    qualityChecks: results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      overall: results.every((r) => r.passed),
    },
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(colors.green, `📊 质量报告已生成: ${reportPath}`)

  return report
}

function main() {
  log(colors.magenta, '🚀 开始严格质量检查...')

  const results = []

  // 1. 健康检查
  results.push({
    name: '健康检查',
    passed: execCommand('node scripts/health-check.js', '健康检查', true),
  })

  // 2. 依赖安装检查
  results.push({
    name: '依赖完整性',
    passed: execCommand('pnpm install --frozen-lockfile', '依赖安装'),
  })

  // 3. 严格代码检查
  results.push({
    name: '严格代码检查',
    passed: execCommand('pnpm lint:strict', 'Biome 严格检查'),
  })

  // 4. 代码格式检查
  results.push({
    name: '代码格式检查',
    passed: execCommand('pnpm format:check', '代码格式验证'),
  })

  // 5. 严格类型检查
  results.push({
    name: '严格类型检查',
    passed: execCommand('pnpm type-check:strict', 'TypeScript 严格检查'),
  })

  // 6. 单元测试 (带覆盖率)
  const testPassed = execCommand('pnpm test:unit', '单元测试 (带覆盖率)')
  results.push({
    name: '单元测试',
    passed: testPassed,
  })

  // 7. 覆盖率检查
  if (testPassed) {
    results.push({
      name: '测试覆盖率',
      passed: checkCoverage(),
    })
  }

  // 8. 安全审计
  results.push({
    name: '安全审计',
    passed: execCommand('pnpm audit --audit-level high', '安全漏洞检查', true),
  })

  // 9. 构建验证
  results.push({
    name: '构建验证',
    passed: execCommand('pnpm build:all', '全应用构建'),
  })

  // 生成质量报告
  const report = generateQualityReport(results)

  // 输出总结
  log(colors.cyan, '\n📋 质量检查总结:')
  results.forEach((result) => {
    const status = result.passed ? colors.green : colors.red
    const icon = result.passed ? '✅' : '❌'
    console.log(`${status}${icon} ${result.name}${colors.reset}`)
  })

  log(colors.cyan, `\n📈 总体结果: ${report.summary.passed}/${report.summary.total} 通过`)

  if (report.summary.overall) {
    log(colors.green, '\n🎉 所有质量检查通过！代码质量达标。')
    process.exit(0)
  } else {
    log(colors.red, '\n❌ 部分质量检查失败，请修复后再提交。')
    log(colors.yellow, '💡 查看 quality-report.json 获取详细结果')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
