#!/usr/bin/env node

/**
 * 测试配置验证脚本
 * 验证Jest配置、测试文件和依赖是否正确设置
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

// 使用assert进行简单检查

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(colors.green, `✅ ${description} 存在: ${path.relative(process.cwd(), filePath)}`)
    return true
  } else {
    log(colors.red, `❌ ${description} 不存在: ${path.relative(process.cwd(), filePath)}`)
    return false
  }
}

function checkJestConfig() {
  log(colors.blue, '\n🔍 检查Jest配置...')

  let success = true

  // 检查jest.config.js
  success &= checkFileExists('jest.config.js', 'Jest配置文件')

  // 检查tests目录
  success &= checkFileExists('tests/setup.ts', '测试设置文件')

  // 检查package.json中的Jest依赖
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const requiredDeps = ['jest', 'ts-jest', '@types/jest', 'jest-junit', 'jest-mock-extended']

    requiredDeps.forEach((dep) => {
      if (deps[dep]) {
        log(colors.green, `✅ Jest依赖存在: ${dep}@${deps[dep]}`)
      } else {
        log(colors.red, `❌ Jest依赖缺失: ${dep}`)
        success = false
      }
    })
  } catch (error) {
    log(colors.red, `❌ 无法读取package.json: ${error.message}`)
    success = false
  }

  return success
}

function checkTestFiles() {
  log(colors.blue, '\n🔍 检查测试文件...')

  let success = true
  let totalTestFiles = 0

  // 查找所有测试文件
  const testFiles = execSync(
    'find . -name "*.spec.ts" -o -name "*.test.ts" | grep -v node_modules | grep -v vcptoolbox-core',
    { encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .filter(Boolean)

  totalTestFiles = testFiles.length

  if (totalTestFiles === 0) {
    log(colors.yellow, '⚠️  未找到测试文件')
    return false
  }

  log(colors.green, `✅ 发现 ${totalTestFiles} 个测试文件`)

  // 检查测试文件质量
  testFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf8')

      // 检查是否包含基本的测试结构
      const hasDescribe = content.includes('describe(')
      const hasIt = content.includes('it(') || content.includes('test(')
      const hasExpect = content.includes('expect(')

      if (hasDescribe && hasIt && hasExpect) {
        log(colors.green, `✅ 测试文件结构完整: ${path.relative(process.cwd(), file)}`)
      } else {
        log(colors.yellow, `⚠️  测试文件结构不完整: ${path.relative(process.cwd(), file)}`)
        if (!hasDescribe) log(colors.yellow, `   - 缺少 describe 块`)
        if (!hasIt) log(colors.yellow, `   - 缺少 it/test 块`)
        if (!hasExpect) log(colors.yellow, `   - 缺少 expect 断言`)
      }
    } catch (_error) {
      log(colors.red, `❌ 无法读取测试文件: ${file}`)
      success = false
    }
  })

  return success
}

async function checkTestSetup() {
  log(colors.blue, '\n🔍 检查测试设置...')

  let success = true

  // 检查jest.config.js的设置
  try {
    // 动态导入ES模块
    const jestConfigModule = await import('../jest.config.js')
    const jestConfig = jestConfigModule.default

    // 检查关键配置
    const checks = [
      { key: 'setupFilesAfterEnv', expected: ['<rootDir>/tests/setup.ts'], type: 'array' },
      { key: 'testEnvironment', expected: 'node', type: 'string' },
      { key: 'bail', expected: true, type: 'boolean' },
      { key: 'collectCoverageFrom', expected: 'array', type: 'array' },
    ]

    checks.forEach(({ key, expected, type }) => {
      const actual = jestConfig[key]
      let isValid = false

      if (type === 'array') {
        isValid = Array.isArray(actual)
        if (expected !== 'array' && Array.isArray(expected)) {
          isValid = isValid && JSON.stringify(actual) === JSON.stringify(expected)
        }
      } else {
        isValid = actual === expected
      }

      if (isValid) {
        log(colors.green, `✅ Jest配置正确: ${key}`)
      } else {
        log(colors.red, `❌ Jest配置错误: ${key} (期望: ${expected}, 实际: ${actual})`)
        success = false
      }
    })
  } catch (error) {
    log(colors.red, `❌ 无法加载Jest配置: ${error.message}`)
    success = false
  }

  // 检查tests/setup.ts
  try {
    const setupContent = fs.readFileSync('tests/setup.ts', 'utf8')

    const requiredSetup = [
      'jest.setTimeout',
      'process.on',
      'afterEach',
      'afterAll',
      'expect.extend',
    ]

    requiredSetup.forEach((item) => {
      if (setupContent.includes(item)) {
        log(colors.green, `✅ 测试设置包含: ${item}`)
      } else {
        log(colors.yellow, `⚠️  测试设置缺少: ${item}`)
      }
    })
  } catch (error) {
    log(colors.red, `❌ 无法读取测试设置文件: ${error.message}`)
    success = false
  }

  return success
}

function checkTestRunner() {
  log(colors.blue, '\n🔍 检查测试运行器...')

  let success = true

  success &= checkFileExists('scripts/test-runner.js', '测试运行器脚本')

  // 检查是否可执行
  try {
    execSync('node scripts/test-runner.js', { stdio: 'pipe', timeout: 5000 })
    log(colors.green, '✅ 测试运行器可执行')
  } catch (error) {
    log(colors.red, `❌ 测试运行器执行失败: ${error.message}`)
    success = false
  }

  return success
}

function runDryTest() {
  log(colors.blue, '\n🔍 运行试运行测试...')

  try {
    // 运行一个简单的测试来验证设置
    execSync('npx jest --listTests --passWithNoTests | head -5', { stdio: 'pipe' })
    log(colors.green, '✅ Jest可以发现测试文件')
    return true
  } catch (error) {
    log(colors.red, `❌ Jest无法发现测试文件: ${error.message}`)
    return false
  }
}

async function main() {
  log(colors.cyan, '🧪 测试配置验证')

  let overallSuccess = true

  overallSuccess &= checkJestConfig()
  overallSuccess &= checkTestFiles()
  overallSuccess &= await checkTestSetup()
  overallSuccess &= checkTestRunner()
  overallSuccess &= runDryTest()

  console.log(`\n${'='.repeat(50)}`)

  if (overallSuccess) {
    log(colors.green, '🎉 所有测试配置验证通过！')
    log(colors.green, '💡 您可以使用以下命令运行测试：')
    console.log('  pnpm test              # 运行单元测试')
    console.log('  pnpm test:coverage     # 生成覆盖率报告')
    console.log('  pnpm test:fail-fast    # 快速失败测试')
    console.log('  pnpm test:ci          # 完整的CI测试套件')
    process.exit(0)
  } else {
    log(colors.red, '❌ 测试配置验证失败！')
    log(colors.yellow, '🔧 请修复上述问题，然后重新运行验证。')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
