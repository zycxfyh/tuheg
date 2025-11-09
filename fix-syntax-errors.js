#!/usr/bin/env node

/**
 * 修复批量脚本造成的语法错误
 */

const fs = require('node:fs')
const path = require('node:path')

// 递归遍历目录
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      walkDirectory(filePath, callback)
    } else if (stat.isFile() && file.endsWith('.ts')) {
      callback(filePath)
    }
  }
}

// 修复语法错误
function fixSyntaxErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const modified = false

  // 修复被破坏的变量声明
  content = content.replace(/let\s+undefined\s*:\s*(\w+)\s*\?\?\s*undefined/g, 'let $1 = 0')

  // 修复被破坏的接口属性
  content = content.replace(/undefined\s*:\s*(\w+)\s*\?\?\s*undefined/g, '$1: string')

  // 修复被破坏的函数参数类型
  content = content.replace(
    /(\w+)\s*:\s*([^,)\n}]+?)\s*\?\?\s*undefined\s*\?\?\s*undefined/g,
    '$1: $2'
  )

  // 修复重复的 ?? undefined ?? undefined
  content = content.replace(/\?\?\s*undefined\s*\?\?\s*undefined/g, '?? undefined')

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Fixed syntax errors in: ${filePath}`)
  }
}

// 主函数
function main() {
  const rootDir = process.argv[2] || '.'

  console.log('Starting to fix syntax errors...')
  walkDirectory(rootDir, fixSyntaxErrors)
  console.log('Done!')
}

if (require.main === module) {
  main()
}
