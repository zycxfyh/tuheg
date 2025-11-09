#!/usr/bin/env node

/**
 * 自动修复脚本 - 综合代码质量工具
 * 支持Biome、ESLint、Prettier等工具的自动修复
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const _path = require('node:path')

console.log('🔧 自动修复脚本启动...')

// 检查是否在Git仓库中
function isGitRepository() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// 获取staged的文件
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

// 运行Biome修复
function runBiomeFix(files = []) {
  console.log('🤖 运行Biome自动修复...')
  try {
    const cmd =
      files.length > 0
        ? `npx biome check --write --unsafe ${files.join(' ')}`
        : 'npx biome check --write --unsafe .'
    execSync(cmd, { stdio: 'inherit' })
    console.log('✅ Biome修复完成')
    return true
  } catch (error) {
    console.log('❌ Biome修复失败:', error.message)
    return false
  }
}

// 运行Biome格式化
function runBiomeFormat(files = []) {
  console.log('🎨 运行Biome格式化...')
  try {
    const cmd =
      files.length > 0
        ? `npx biome format --write ${files.join(' ')}`
        : 'npx biome format --write .'
    execSync(cmd, { stdio: 'inherit' })
    console.log('✅ Biome格式化完成')
    return true
  } catch (error) {
    console.log('❌ Biome格式化失败:', error.message)
    return false
  }
}

// 运行import排序
function runOrganizeImports(_files = []) {
  console.log('📦 运行import排序...')
  try {
    // 使用organize-imports命令而不是check的flag
    const cmd = 'npx biome check --write .'
    execSync(cmd, { stdio: 'inherit' })
    console.log('✅ Import排序完成')
    return true
  } catch (error) {
    console.log('❌ Import排序失败:', error.message)
    return false
  }
}

// 运行ESLint修复（如果存在）
function runEslintFix(files = []) {
  if (
    !fileExists('.eslintrc.js') &&
    !fileExists('.eslintrc.json') &&
    !fileExists('eslint.config.js')
  ) {
    console.log('ℹ️  未检测到ESLint配置，跳过ESLint修复')
    return true
  }

  console.log('🔧 运行ESLint自动修复...')
  try {
    const cmd = files.length > 0 ? `npx eslint --fix ${files.join(' ')}` : 'npx eslint --fix .'
    execSync(cmd, { stdio: 'inherit' })
    console.log('✅ ESLint修复完成')
    return true
  } catch (error) {
    console.log('❌ ESLint修复失败:', error.message)
    return false
  }
}

// 运行Prettier格式化（如果存在）
function runPrettierFormat(files = []) {
  if (
    !fileExists('.prettierrc') &&
    !fileExists('.prettierrc.js') &&
    !fileExists('prettier.config.js')
  ) {
    console.log('ℹ️  未检测到Prettier配置，使用Biome格式化')
    return runBiomeFormat(files)
  }

  console.log('💅 运行Prettier格式化...')
  try {
    const cmd =
      files.length > 0 ? `npx prettier --write ${files.join(' ')}` : 'npx prettier --write .'
    execSync(cmd, { stdio: 'inherit' })
    console.log('✅ Prettier格式化完成')
    return true
  } catch (error) {
    console.log('❌ Prettier格式化失败:', error.message)
    return false
  }
}

// 运行TypeScript类型检查
function runTypeCheck() {
  console.log('🔍 运行TypeScript类型检查...')
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
    console.log('✅ TypeScript类型检查通过')
    return true
  } catch (error) {
    console.log('❌ TypeScript类型检查失败:', error.message)
    return false
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const fixAll = args.includes('--all') || args.includes('-a')
  const checkOnly = args.includes('--check') || args.includes('-c')
  const stagedOnly = args.includes('--staged') || args.includes('-s')

  let files = []
  if (stagedOnly && isGitRepository()) {
    files = getStagedFiles()
    console.log(`📁 处理staged文件: ${files.length} 个文件`)
  }

  if (checkOnly) {
    console.log('🔍 仅检查模式 - 不进行修复')
    let allPassed = true

    // 运行各种检查
    if (!runBiomeFix([...files])) allPassed = false
    if (!runBiomeFormat([...files])) allPassed = false
    if (!runEslintFix([...files])) allPassed = false
    if (!runTypeCheck()) allPassed = false

    if (allPassed) {
      console.log('✅ 所有检查通过')
      process.exit(0)
    } else {
      console.log('❌ 发现问题需要修复')
      process.exit(1)
    }
  } else {
    console.log('🔧 自动修复模式')

    let successCount = 0
    let totalCount = 0

    // 运行修复
    totalCount++
    if (runOrganizeImports([...files])) successCount++

    totalCount++
    if (runBiomeFix([...files])) successCount++

    totalCount++
    if (runBiomeFormat([...files])) successCount++

    if (fixAll) {
      totalCount++
      if (runEslintFix([...files])) successCount++

      totalCount++
      if (runPrettierFormat([...files])) successCount++
    }

    console.log(`📊 修复完成: ${successCount}/${totalCount} 个工具成功运行`)

    if (successCount === totalCount) {
      console.log('🎉 所有修复工具运行成功！')
      process.exit(0)
    } else {
      console.log('⚠️  部分修复工具运行失败，请检查上述错误信息')
      process.exit(1)
    }
  }
}

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的错误:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('💥 未处理的Promise拒绝:', reason)
  process.exit(1)
})

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  main,
  runBiomeFix,
  runBiomeFormat,
  runOrganizeImports,
  runEslintFix,
  runPrettierFormat,
  runTypeCheck,
}
