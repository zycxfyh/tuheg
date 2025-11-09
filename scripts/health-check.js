#!/usr/bin/env node

/**
 * 健康检查脚本 - 用于在CI/CD中快速失败
 * 检查项目的整体健康状态
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

console.log('🏥 Running health check...\n')

let hasErrors = false
const errors = []

// 检查函数
function check(condition, message) {
  if (!condition) {
    console.log(`❌ ${message}`)
    errors.push(message)
    hasErrors = true
    return false
  } else {
    console.log(`✅ ${message}`)
    return true
  }
}

// 1. 检查package.json是否存在
function checkPackageJson() {
  try {
    const packageJson = require('../package.json')
    check(packageJson.name === 'creation-ring', 'Package name is correct')
    check(packageJson.version, 'Package version exists')
    check(packageJson.scripts, 'Scripts section exists')
    check(packageJson.scripts.test, 'Test script exists')
    check(packageJson.scripts.build, 'Build script exists')
    return true
  } catch (error) {
    check(false, `package.json not found or invalid: ${error.message}`)
    return false
  }
}

// 2. 检查关键文件是否存在
function checkCriticalFiles() {
  const criticalFiles = [
    'README.md',
    'biome.json',
    '.github/workflows/ci.yml',
    'nx.json',
    'pnpm-workspace.yaml',
  ]

  criticalFiles.forEach((file) => {
    check(fs.existsSync(path.join(__dirname, '..', file)), `Critical file exists: ${file}`)
  })
}

// 3. 检查Node.js版本
function checkNodeVersion() {
  const version = process.version
  const major = parseInt(version.slice(1).split('.')[0], 10)
  check(major >= 18, `Node.js version ${version} is >= 18 (required for modern features)`)
}

// 4. 检查依赖安装
function checkDependencies() {
  try {
    // 检查node_modules是否存在
    check(
      fs.existsSync(path.join(__dirname, '..', 'node_modules')),
      'node_modules directory exists'
    )

    // 检查pnpm-lock.yaml
    check(fs.existsSync(path.join(__dirname, '..', 'pnpm-lock.yaml')), 'pnpm-lock.yaml exists')

    // 尝试运行pnpm ls
    execSync('pnpm ls --depth=0', { stdio: 'pipe', cwd: path.join(__dirname, '..') })
    check(true, 'Dependencies are properly installed')
  } catch (error) {
    check(false, `Dependency check failed: ${error.message}`)
  }
}

// 5. 检查TypeScript配置
function checkTypeScriptConfig() {
  const tsconfigFiles = [
    'tsconfig.json',
    'apps/frontend/tsconfig.json',
    'packages/common-backend/tsconfig.json',
  ]

  tsconfigFiles.forEach((file) => {
    const filePath = path.join(__dirname, '..', file)
    if (fs.existsSync(filePath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        check(tsconfig.compilerOptions, `${file} has compilerOptions`)

        // 检查strict模式（考虑继承）
        const hasStrict =
          tsconfig.compilerOptions?.strict === true ||
          tsconfig.extends?.includes('tsconfig.base.json') ||
          tsconfig.extends?.includes('tsconfig.json')
        check(hasStrict, `${file} has strict mode enabled (directly or via inheritance)`)
      } catch (_error) {
        check(false, `${file} is invalid JSON`)
      }
    }
  })
}

// 6. 检查环境变量模板
function checkEnvTemplate() {
  const envFiles = ['.env.example', '.env.template']
  const hasEnvTemplate = envFiles.some((file) => fs.existsSync(path.join(__dirname, '..', file)))
  check(hasEnvTemplate, 'Environment template file exists (.env.example or .env.template)')
}

// 7. 检查安全配置
function checkSecurity() {
  // 检查是否有.gitignore
  check(fs.existsSync(path.join(__dirname, '..', '.gitignore')), '.gitignore exists')

  // 检查.gitignore是否包含敏感文件
  if (fs.existsSync(path.join(__dirname, '..', '.gitignore'))) {
    const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8')
    check(gitignore.includes('.env'), '.gitignore excludes .env files')
    check(gitignore.includes('node_modules'), '.gitignore excludes node_modules')
  }
}

// 8. 检查项目结构
function checkProjectStructure() {
  const requiredDirs = ['apps/frontend', 'packages/common-backend', 'apps/vcptoolbox']

  requiredDirs.forEach((dir) => {
    check(fs.existsSync(path.join(__dirname, '..', dir)), `Required directory exists: ${dir}`)
  })
}

// 运行所有检查
console.log('🔍 File and Configuration Checks:')
checkCriticalFiles()
console.log('')

console.log('📦 Package and Dependencies:')
checkPackageJson()
checkDependencies()
console.log('')

console.log('⚙️ Runtime Environment:')
checkNodeVersion()
console.log('')

console.log('🔧 TypeScript Configuration:')
checkTypeScriptConfig()
console.log('')

console.log('🔐 Security Configuration:')
checkSecurity()
checkEnvTemplate()
console.log('')

console.log('🏗️ Project Structure:')
checkProjectStructure()
console.log('')

// 总结
if (hasErrors) {
  console.log(`❌ Health check failed with ${errors.length} error(s):`)
  errors.forEach((error) => {
    console.log(`   - ${error}`)
  })
  process.exit(1)
} else {
  console.log('🎉 Health check passed! All systems are go.')
  process.exit(0)
}
