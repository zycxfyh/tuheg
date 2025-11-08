#!/usr/bin/env node
// 文件路径: tools/scripts/migrate-api-keys-to-encrypted.mjs
// 职责: 将现有数据库中的明文 API 密钥加密并存储到 apiKeyEncrypted 字段
//
// 使用方法:
//   pnpm tools:migrate-api-keys
//
// 前置条件:
//   1. 数据库迁移已完成（apiKeyEncrypted 字段已添加）
//   2. ENCRYPTION_KEY 环境变量已设置
//   3. DATABASE_URL 环境变量已设置

// 使用动态导入，因为 Prisma 客户端需要在运行时生成
// import { PrismaClient } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
const envPath = join(__dirname, '../../../.env')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  dotenv.config({ path: envPath })
} catch {
  // .env 文件不存在，使用系统环境变量
  dotenv.config()
}

// 延迟初始化 Prisma（在运行时）
let prisma = null

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient()
  }
  return prisma
}

// 加密函数（与 EncryptionService 保持一致）
function encrypt(plaintext, encryptionKey, useSalt = false) {
  if (useSalt) {
    const saltBuffer = randomBytes(16)
    const derivedKey = scryptSync(encryptionKey, saltBuffer, 32)
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', derivedKey, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: saltBuffer.toString('base64'),
    }
  } else {
    const keyBuffer = Buffer.from(encryptionKey, 'base64')
    if (keyBuffer.length !== 32) {
      throw new Error(
        'ENCRYPTION_KEY must be a base64 encoded 32-byte key when ENCRYPTION_USE_SALT=false'
      )
    }
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
}

async function main() {
  console.log('🚀 Starting API key migration...\n')

  // 检查环境变量
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    console.error('❌ Error: ENCRYPTION_KEY environment variable is not set.')
    console.error('   Please set ENCRYPTION_KEY in your .env file.')
    process.exit(1)
  }

  const useSalt =
    process.env.ENCRYPTION_USE_SALT === 'true' ||
    process.env.ENCRYPTION_USE_SALT === '1' ||
    process.env.ENCRYPTION_USE_SALT === 'yes'

  console.log(`📋 Configuration:`)
  console.log(`   - Using salt: ${useSalt}`)
  console.log(`   - Encryption key: ${encryptionKey.substring(0, 10)}...`)
  console.log('')

  const prismaInstance = await getPrisma()

  // 查找所有需要迁移的记录
  // 注意: Prisma 的 JSON 字段查询可能不支持 null 检查，所以我们先获取所有记录再过滤
  const allConfigs = await prismaInstance.aiConfiguration.findMany({
    where: {
      apiKey: { not: null },
    },
  })

  // 过滤出 apiKeyEncrypted 为空的记录
  const configsToMigrate = allConfigs.filter((config) => {
    const encrypted = config.apiKeyEncrypted
    return (
      !encrypted ||
      encrypted === null ||
      (typeof encrypted === 'object' && Object.keys(encrypted).length === 0)
    )
  })

  console.log(`📊 Found ${configsToMigrate.length} configuration(s) to migrate.\n`)

  if (configsToMigrate.length === 0) {
    console.log('✅ No configurations need migration. All API keys are already encrypted.')
    await prismaInstance.$disconnect()
    return
  }

  // 迁移每个配置
  let successCount = 0
  let errorCount = 0

  for (const config of configsToMigrate) {
    try {
      console.log(`🔐 Migrating config ${config.id} (${config.provider})...`)

      const encrypted = encrypt(config.apiKey, encryptionKey, useSalt)

      await prismaInstance.aiConfiguration.update({
        where: { id: config.id },
        data: {
          apiKeyEncrypted: encrypted,
          // 注意: 我们保留 apiKey 字段用于向后兼容（过渡期）
        },
      })

      console.log(`   ✅ Successfully encrypted API key for config ${config.id}`)
      successCount++
    } catch (error) {
      console.error(`   ❌ Failed to encrypt API key for config ${config.id}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📈 Migration Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📊 Total: ${configsToMigrate.length}`)

  if (errorCount > 0) {
    console.error('\n⚠️  Some configurations failed to migrate. Please check the errors above.')
    await prismaInstance.$disconnect()
    process.exit(1)
  }

  console.log('\n✅ Migration completed successfully!')
  console.log('   All API keys have been encrypted and stored in apiKeyEncrypted field.')
  console.log('   The plaintext apiKey field is retained for backward compatibility.')

  await prismaInstance.$disconnect()
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
