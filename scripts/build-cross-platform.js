#!/usr/bin/env node

/**
 * 跨平台构建脚本
 * 支持Web、PWA、Capacitor移动端、Tauri桌面端的构建
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 构建配置
const BUILD_CONFIGS = {
  web: {
    name: 'Web应用',
    command: 'npm run build',
    env: { PLATFORM: 'web' },
    output: 'dist/web',
  },
  pwa: {
    name: 'PWA应用',
    command: 'npm run build:pwa',
    env: { PLATFORM: 'web' },
    output: 'dist/pwa',
  },
  capacitor: {
    name: 'Capacitor移动端',
    command: 'npm run capacitor:build:android && npm run capacitor:build:ios',
    env: { PLATFORM: 'capacitor' },
    output: 'dist/capacitor',
    dependencies: ['capacitor:ios', 'capacitor:android'],
  },
  capacitor_android: {
    name: 'Capacitor Android',
    command: 'npm run capacitor:build:android',
    env: { PLATFORM: 'capacitor' },
    output: 'android/app/src/main/assets/public',
  },
  capacitor_ios: {
    name: 'Capacitor iOS',
    command: 'npm run capacitor:build:ios',
    env: { PLATFORM: 'capacitor' },
    output: 'ios/App/public',
  },
  tauri: {
    name: 'Tauri桌面端',
    command: 'npm run desktop:build',
    env: { PLATFORM: 'tauri' },
    output: 'src-tauri/target/release/bundle',
  },
}

// 命令行参数解析
const args = process.argv.slice(2)
const target = args[0] || 'all'
const options = {
  clean: args.includes('--clean'),
  verbose: args.includes('--verbose'),
  skipTests: args.includes('--skip-tests'),
}

// 日志工具
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  verbose: (msg) => options.verbose && console.log(`🔍 ${msg}`),
}

// 执行命令
function executeCommand(command, env = {}, cwd = null) {
  try {
    const envVars = { ...process.env, ...env }
    const options = {
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: envVars,
      cwd: cwd || process.cwd(),
    }

    logger.verbose(`执行命令: ${command}`)
    logger.verbose(`环境变量: ${JSON.stringify(env, null, 2)}`)

    execSync(command, options)
    return true
  } catch (error) {
    logger.error(`命令执行失败: ${command}`)
    if (options.verbose) {
      console.error(error.stdout?.toString())
      console.error(error.stderr?.toString())
    }
    return false
  }
}

// 清理构建目录
function cleanBuildDirs() {
  logger.info('清理构建目录...')

  const dirsToClean = ['dist', 'apps/frontend/dist', 'apps/desktop/src-tauri/target']

  dirsToClean.forEach((dir) => {
    const fullPath = path.resolve(dir)
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true })
      logger.verbose(`已清理: ${fullPath}`)
    }
  })
}

// 运行测试
function runTests() {
  if (options.skipTests) {
    logger.info('跳过测试...')
    return true
  }

  logger.info('运行测试...')
  return executeCommand('npm run test:run')
}

// 检查依赖
function checkDependencies(config) {
  if (!config.dependencies) return true

  logger.verbose(`检查依赖: ${config.dependencies.join(', ')}`)

  for (const dep of config.dependencies) {
    try {
      // 检查Capacitor平台是否已添加
      if (dep.startsWith('capacitor:')) {
        const platform = dep.split(':')[1]
        const capacitorConfigPath = `apps/frontend/capacitor.config.${platform}.json`
        if (!fs.existsSync(capacitorConfigPath)) {
          logger.warn(`${platform}平台未配置，请先运行: npm run capacitor:add:${platform}`)
          return false
        }
      }
    } catch (error) {
      logger.error(`依赖检查失败: ${dep}`)
      return false
    }
  }

  return true
}

// 构建单个目标
async function buildTarget(targetName, config) {
  logger.info(`开始构建 ${config.name}...`)

  // 检查依赖
  if (!checkDependencies(config)) {
    logger.error(`${config.name} 依赖检查失败`)
    return false
  }

  // 设置环境变量并执行构建
  const success = executeCommand(config.command, config.env, 'apps/frontend')

  if (success) {
    logger.success(`${config.name} 构建成功`)

    // 检查输出目录
    const outputPath = path.resolve('apps/frontend', config.output)
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath)
      if (stats.isDirectory()) {
        const files = fs.readdirSync(outputPath)
        logger.verbose(`输出文件数量: ${files.length}`)
      }
    }

    return true
  } else {
    logger.error(`${config.name} 构建失败`)
    return false
  }
}

// 构建所有目标
async function buildAll() {
  logger.info('开始全平台构建...')

  const results = []
  const targets = Object.keys(BUILD_CONFIGS)

  for (const targetName of targets) {
    const config = BUILD_CONFIGS[targetName]
    const success = await buildTarget(targetName, config)
    results.push({ target: targetName, success })

    // 如果是核心构建失败，继续其他构建但标记失败
    if (!success && ['web', 'pwa'].includes(targetName)) {
      logger.error('核心构建失败，可能影响其他平台构建')
    }
  }

  // 输出构建结果摘要
  logger.info('构建结果摘要:')
  results.forEach(({ target, success }) => {
    const status = success ? '✅ 成功' : '❌ 失败'
    console.log(`  ${target}: ${status}`)
  })

  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length

  if (successCount === totalCount) {
    logger.success(`所有平台构建完成！ (${successCount}/${totalCount})`)
    return true
  } else {
    logger.error(`部分平台构建失败！ (${successCount}/${totalCount})`)
    return false
  }
}

// 主函数
async function main() {
  console.log('🚀 创世星环 - 跨平台构建工具')
  console.log('================================')

  // 清理
  if (options.clean) {
    cleanBuildDirs()
  }

  // 运行测试
  if (!runTests()) {
    logger.error('测试失败，终止构建')
    process.exit(1)
  }

  // 执行构建
  let success = false

  if (target === 'all') {
    success = await buildAll()
  } else if (BUILD_CONFIGS[target]) {
    success = await buildTarget(target, BUILD_CONFIGS[target])
  } else {
    logger.error(`未知构建目标: ${target}`)
    logger.info('可用目标:')
    Object.keys(BUILD_CONFIGS).forEach((key) => {
      console.log(`  ${key}: ${BUILD_CONFIGS[key].name}`)
    })
    process.exit(1)
  }

  // 输出结果
  if (success) {
    logger.success('构建完成！')
    console.log('')
    console.log('📦 输出目录:')
    Object.entries(BUILD_CONFIGS).forEach(([key, config]) => {
      if (config.output) {
        console.log(`  ${key}: apps/frontend/${config.output}`)
      }
    })
  } else {
    logger.error('构建失败！')
    process.exit(1)
  }
}

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的错误: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`)
  process.exit(1)
})

// 执行主函数
main().catch((error) => {
  logger.error(`构建脚本执行失败: ${error.message}`)
  process.exit(1)
})
