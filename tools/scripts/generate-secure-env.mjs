#!/usr/bin/env node
// 文件路径: tools/scripts/generate-secure-env.mjs
// 职责: 生成安全的加密密钥和盐值，用于生产环境配置
//
// 使用方法:
//   pnpm tools:generate-env
//
// 输出:
//   - 32字节的ENCRYPTION_KEY (base64编码)
//   - 16字节的ENCRYPTION_SALT (base64编码)
//   - 32字节的JWT_SECRET

import { randomBytes } from 'node:crypto'

console.log('🔐 生成安全的加密密钥和配置')
console.log('='.repeat(50))
console.log('')

// 生成加密密钥 (32字节)
const encryptionKey = randomBytes(32)
const encryptionKeyBase64 = encryptionKey.toString('base64')

// 生成盐值 (16字节，推荐长度)
const salt = randomBytes(16)
const saltBase64 = salt.toString('base64')

// 生成JWT密钥 (32字节)
const jwtSecret = randomBytes(32)
const jwtSecretBase64 = jwtSecret.toString('base64')

console.log('📋 安全配置 (复制到你的 .env 文件):')
console.log('')
console.log('# 加密配置 (必需)')
console.log(`ENCRYPTION_KEY=${encryptionKeyBase64}`)
console.log(`ENCRYPTION_SALT=${saltBase64}`)
console.log('')
console.log('# JWT配置 (必需)')
console.log(`JWT_SECRET=${jwtSecretBase64}`)
console.log('')
console.log('⚠️  安全提醒:')
console.log('  - 妥善保管这些密钥，永远不要提交到版本控制')
console.log('  - 在生产环境中使用密码管理器或密钥管理系统')
console.log('  - 定期轮换密钥以增强安全性')
console.log('  - 备份密钥到安全位置，以防丢失')
console.log('')
console.log('🔍 验证:')
console.log(`  ENCRYPTION_KEY 长度: ${encryptionKey.length} 字节 ✓`)
console.log(`  ENCRYPTION_SALT 长度: ${salt.length} 字节 ✓`)
console.log(`  JWT_SECRET 长度: ${jwtSecret.length} 字节 ✓`)
console.log('')
console.log('✅ 生成完成！')
