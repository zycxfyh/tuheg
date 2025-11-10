import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 环境变量加载器
 * 支持多个环境文件和变量扩展
 */
export function envLoader(): Record<string, any> {
  const envFiles = ['.env.local', '.env.development', '.env.test', '.env.production', '.env']

  // 确定当前环境
  const nodeEnv = process.env.NODE_ENV || 'development'

  // 加载环境文件
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile)
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath })
      if (result.error) {
        console.warn(`Failed to load ${envFile}:`, result.error.message)
      } else {
        dotenvExpand.expand(result)
        console.log(`Loaded environment file: ${envFile}`)
      }
    }
  }

  // 返回所有环境变量
  return process.env
}

/**
 * 验证必需的环境变量
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missingVars: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

/**
 * 获取环境变量，支持默认值和类型转换
 */
export function getEnvVar<T = string>(
  key: string,
  defaultValue?: T,
  type?: 'string' | 'number' | 'boolean'
): T | undefined {
  const value = process.env[key]

  if (value === undefined) {
    return defaultValue
  }

  if (type === 'number') {
    const numValue = parseFloat(value)
    return (isNaN(numValue) ? defaultValue : numValue) as T
  }

  if (type === 'boolean') {
    return (value.toLowerCase() === 'true') as T
  }

  return value as T
}
