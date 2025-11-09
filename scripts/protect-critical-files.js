#!/usr/bin/env node

// 🔒 Creation Ring - Critical Files Protection Script
// This script ensures that critical project files are not accidentally deleted or modified

const fs = require('node:fs')
const _path = require('node:path')

const CRITICAL_FILES = [
  'repomix-output.xml',
  'README.md',
  'SECURITY-ANALYSIS-REPORT.md',
  'REPOMIX-README.md',
  'package.json',
  'pnpm-lock.yaml',
  '.gitignore',
  '.gitattributes',
]

console.log('🔍 Checking critical files...')

const missingFiles = []
for (const file of CRITICAL_FILES) {
  if (!fs.existsSync(file)) {
    missingFiles.push(file)
  }
}

if (missingFiles.length > 0) {
  console.error('❌ ERROR: Critical files are missing!')
  console.error('Missing files:')
  missingFiles.forEach((file) => {
    console.error(`  - ${file}`)
  })
  console.error('')
  console.error('⚠️  These files are essential for the project. Please restore them immediately.')
  console.error('   If you accidentally deleted them, check git history:')
  console.error(`   git log --name-only --oneline | grep -E "(${CRITICAL_FILES.join('|')})"`)
  process.exit(1)
}

// Special check for repomix-output.xml size
const repomixFile = 'repomix-output.xml'
if (fs.existsSync(repomixFile)) {
  const stats = fs.statSync(repomixFile)
  const minSize = 1024 * 1024 // 1MB minimum

  if (stats.size < minSize) {
    console.warn(`⚠️  WARNING: ${repomixFile} seems too small (${stats.size} bytes)`)
    console.warn(`   Expected size: > ${minSize} bytes (1MB+)`)
    console.warn('   This file should contain the complete codebase. Please regenerate if needed.')
    console.warn('   Run: repomix . --output repomix-output.xml')
  } else {
    console.log(`✅ ${repomixFile} size check passed (${stats.size} bytes)`)
  }
}

console.log('✅ All critical files are present and accounted for.')
console.log('🛡️  Project integrity verified.')
