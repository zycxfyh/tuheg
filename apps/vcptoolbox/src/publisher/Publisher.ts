import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { VCPPlugin, PluginMetadata } from '../PluginFramework'
import { EventEmitter } from 'events'

// VCPToolBox 发布系统
// 处理插件的打包、分发和版本管理

export interface PluginPackage {
  id: string
  version: string
  name: string
  description: string
  author: string
  type: string
  compatibility: {
    minVersion: string
    maxVersion?: string
    platforms: string[]
  }
  files: PluginFile[]
  dependencies: string[]
  metadata: PluginMetadata
  checksum: string
  signature?: string
  createdAt: Date
  size: number
}

export interface PluginFile {
  path: string
  content: string
  executable?: boolean
  compressed?: boolean
}

export interface PublishOptions {
  target: 'local' | 'marketplace' | 'private'
  compress: boolean
  sign: boolean
  validate: boolean
  privateKey?: string
  registry?: string
}

export interface PublishResult {
  success: boolean
  packageId: string
  packagePath?: string
  registryUrl?: string
  checksum: string
  errors: string[]
  warnings: string[]
}

export interface VersionInfo {
  version: string
  changelog: string[]
  breaking: boolean
  releaseDate: Date
  downloads: number
}

export interface PluginRegistry {
  id: string
  name: string
  url: string
  type: 'public' | 'private'
  authRequired: boolean
  plugins: PluginPackage[]
}

// 发布系统类
export class Publisher extends EventEmitter {
  private registries: Map<string, PluginRegistry> = new Map()
  private publishedPackages: Map<string, PluginPackage> = new Map()

  constructor() {
    super()
    this.initializeDefaultRegistries()
  }

  // 初始化默认注册表
  private initializeDefaultRegistries() {
    // 官方插件市场
    this.registries.set('official', {
      id: 'official',
      name: '创世星环官方插件市场',
      url: 'https://marketplace.creationring.com',
      type: 'public',
      authRequired: false,
      plugins: []
    })

    // 开发者测试注册表
    this.registries.set('dev', {
      id: 'dev',
      name: '开发者测试环境',
      url: 'http://localhost:3001',
      type: 'private',
      authRequired: false,
      plugins: []
    })
  }

  // 打包插件
  async packagePlugin(
    plugin: VCPPlugin,
    sourcePath: string,
    options: PublishOptions = { target: 'local', compress: true, sign: false, validate: true }
  ): Promise<PluginPackage> {
    this.emit('packagingStarted', { pluginId: plugin.id })

    try {
      // 验证插件
      if (options.validate) {
        await this.validatePlugin(plugin, sourcePath)
      }

      // 收集文件
      const files = await this.collectPluginFiles(sourcePath, plugin)

      // 压缩文件（可选）
      const processedFiles = options.compress ?
        await this.compressFiles(files) : files

      // 生成校验和
      const checksum = this.generateChecksum(processedFiles)

      // 签名（可选）
      let signature: string | undefined
      if (options.sign && options.privateKey) {
        signature = this.signPackage(checksum, options.privateKey)
      }

      // 计算包大小
      const size = processedFiles.reduce((total, file) => total + file.content.length, 0)

      const packageData: PluginPackage = {
        id: plugin.id,
        version: plugin.version,
        name: plugin.name,
        description: plugin.description,
        author: plugin.author.name,
        type: plugin.type,
        compatibility: plugin.compatibility,
        files: processedFiles,
        dependencies: plugin.compatibility.requiredPlugins,
        metadata: plugin.metadata,
        checksum,
        signature,
        createdAt: new Date(),
        size
      }

      this.emit('packagingCompleted', { pluginId: plugin.id, package: packageData })

      return packageData

    } catch (error) {
      this.emit('packagingFailed', { pluginId: plugin.id, error })
      throw error
    }
  }

  // 发布插件
  async publishPlugin(
    pluginPackage: PluginPackage,
    options: PublishOptions
  ): Promise<PublishResult> {
    const result: PublishResult = {
      success: false,
      packageId: pluginPackage.id,
      checksum: pluginPackage.checksum,
      errors: [],
      warnings: []
    }

    this.emit('publishStarted', { packageId: pluginPackage.id, target: options.target })

    try {
      switch (options.target) {
        case 'local':
          result.packagePath = await this.publishToLocal(pluginPackage)
          break
        case 'marketplace':
          result.registryUrl = await this.publishToMarketplace(pluginPackage, options.registry)
          break
        case 'private':
          result.registryUrl = await this.publishToPrivateRegistry(pluginPackage, options.registry)
          break
      }

      result.success = true
      this.publishedPackages.set(pluginPackage.id, pluginPackage)

      this.emit('publishCompleted', { packageId: pluginPackage.id, result })

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
      this.emit('publishFailed', { packageId: pluginPackage.id, error })
    }

    return result
  }

  // 验证插件
  private async validatePlugin(plugin: VCPPlugin, sourcePath: string): Promise<void> {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    if (!plugin.id) errors.push('插件ID不能为空')
    if (!plugin.name) errors.push('插件名称不能为空')
    if (!plugin.version) errors.push('插件版本不能为空')
    if (!plugin.type) errors.push('插件类型不能为空')

    // 检查兼容性
    if (!plugin.compatibility?.minVersion) {
      errors.push('必须指定最低兼容版本')
    }

    // 检查文件结构
    const requiredFiles = ['package.json', 'vcptoolbox.json']
    for (const file of requiredFiles) {
      const filePath = path.join(sourcePath, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`缺少必需文件: ${file}`)
      }
    }

    // 检查主入口文件
    const mainFile = this.getMainFile(plugin, sourcePath)
    if (!mainFile || !fs.existsSync(mainFile)) {
      errors.push('找不到插件主入口文件')
    }

    // 检查依赖
    for (const dep of plugin.compatibility?.requiredPlugins || []) {
      if (!this.isValidPluginId(dep)) {
        warnings.push(`依赖插件ID格式可能不正确: ${dep}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`插件验证失败:\n${errors.join('\n')}`)
    }

    if (warnings.length > 0) {
      console.warn('插件验证警告:', warnings.join('\n'))
    }
  }

  // 收集插件文件
  private async collectPluginFiles(sourcePath: string, plugin: VCPPlugin): Promise<PluginFile[]> {
    const files: PluginFile[] = []
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      '*.log',
      '.DS_Store',
      'coverage'
    ]

    const collectFiles = async (dir: string, relativePath = ''): Promise<void> => {
      const items = await fs.promises.readdir(dir, { withFileTypes: true })

      for (const item of items) {
        const itemPath = path.join(dir, item.name)
        const itemRelativePath = path.join(relativePath, item.name)

        // 检查是否应该排除
        if (excludePatterns.some(pattern =>
          item.name.includes(pattern.replace('*', '')) ||
          item.name.endsWith(pattern.replace('*', ''))
        )) {
          continue
        }

        if (item.isDirectory()) {
          await collectFiles(itemPath, itemRelativePath)
        } else if (item.isFile()) {
          const content = await fs.promises.readFile(itemPath, 'utf-8')
          const stat = await fs.promises.stat(itemPath)

          files.push({
            path: itemRelativePath.replace(/\\/g, '/'), // 统一路径分隔符
            content,
            executable: !!(stat.mode & parseInt('111', 8)) // 检查是否可执行
          })
        }
      }
    }

    await collectFiles(sourcePath)
    return files
  }

  // 压缩文件
  private async compressFiles(files: PluginFile[]): Promise<PluginFile[]> {
    // 简化版本：实际实现应该使用真实的压缩算法
    return files.map(file => ({
      ...file,
      compressed: true,
      content: Buffer.from(file.content).toString('base64') // 简单的base64编码
    }))
  }

  // 生成校验和
  private generateChecksum(files: PluginFile[]): string {
    const hash = crypto.createHash('sha256')

    // 对所有文件内容进行排序并哈希
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

    for (const file of sortedFiles) {
      hash.update(file.path)
      hash.update(file.content)
    }

    return hash.digest('hex')
  }

  // 签名包
  private signPackage(checksum: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256')
    sign.update(checksum)
    return sign.sign(privateKey, 'hex')
  }

  // 验证签名
  verifySignature(checksum: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256')
      verify.update(checksum)
      return verify.verify(publicKey, signature, 'hex')
    } catch {
      return false
    }
  }

  // 本地发布
  private async publishToLocal(pluginPackage: PluginPackage): Promise<string> {
    const publishDir = path.join(process.cwd(), 'dist', 'plugins')
    await fs.promises.mkdir(publishDir, { recursive: true })

    const packagePath = path.join(publishDir, `${pluginPackage.id}-${pluginPackage.version}.vcp`)
    const packageContent = JSON.stringify(pluginPackage, null, 2)

    await fs.promises.writeFile(packagePath, packageContent, 'utf-8')

    return packagePath
  }

  // 发布到官方市场
  private async publishToMarketplace(pluginPackage: PluginPackage, registryId?: string): Promise<string> {
    const registry = registryId ? this.registries.get(registryId) : this.registries.get('official')

    if (!registry) {
      throw new Error('未找到指定的注册表')
    }

    // 这里应该实现实际的API调用
    // 模拟API调用
    console.log(`Publishing ${pluginPackage.id} to ${registry.name}`)

    registry.plugins.push(pluginPackage)

    return `${registry.url}/plugins/${pluginPackage.id}/${pluginPackage.version}`
  }

  // 发布到私有注册表
  private async publishToPrivateRegistry(pluginPackage: PluginPackage, registryId?: string): Promise<string> {
    // 实现私有注册表发布逻辑
    return `private-registry://plugins/${pluginPackage.id}/${pluginPackage.version}`
  }

  // 获取主入口文件
  private getMainFile(plugin: VCPPlugin, sourcePath: string): string | null {
    // 尝试常见的主入口文件名
    const possibleMains = [
      'dist/index.js',
      'build/index.js',
      'lib/index.js',
      'src/index.ts',
      'src/index.js',
      'index.js'
    ]

    for (const mainFile of possibleMains) {
      const fullPath = path.join(sourcePath, mainFile)
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }

    return null
  }

  // 验证插件ID格式
  private isValidPluginId(id: string): boolean {
    // 简单的ID格式验证
    return /^[a-z0-9-]+$/i.test(id) && id.length >= 3 && id.length <= 50
  }

  // 版本管理
  bumpVersion(currentVersion: string, type: 'patch' | 'minor' | 'major'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number)

    switch (type) {
      case 'patch':
        return `${major}.${minor}.${patch + 1}`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'major':
        return `${major + 1}.0.0`
      default:
        return currentVersion
    }
  }

  // 创建版本标签
  createVersionTag(pluginId: string, version: string, changelog: string[]): VersionInfo {
    return {
      version,
      changelog,
      breaking: changelog.some(entry =>
        entry.toLowerCase().includes('breaking') ||
        entry.toLowerCase().includes('重大变更')
      ),
      releaseDate: new Date(),
      downloads: 0
    }
  }

  // 注册表管理
  addRegistry(registry: PluginRegistry): void {
    this.registries.set(registry.id, registry)
    this.emit('registryAdded', registry)
  }

  removeRegistry(registryId: string): boolean {
    const removed = this.registries.delete(registryId)
    if (removed) {
      this.emit('registryRemoved', registryId)
    }
    return removed
  }

  getRegistries(): PluginRegistry[] {
    return Array.from(this.registries.values())
  }

  getRegistry(registryId: string): PluginRegistry | null {
    return this.registries.get(registryId) || null
  }

  // 搜索已发布插件
  searchPublishedPlugins(query: string, registryId?: string): PluginPackage[] {
    const registry = registryId ? this.registries.get(registryId) : this.registries.get('official')
    if (!registry) return []

    const lowercaseQuery = query.toLowerCase()

    return registry.plugins.filter(plugin =>
      plugin.name.toLowerCase().includes(lowercaseQuery) ||
      plugin.description.toLowerCase().includes(lowercaseQuery) ||
      plugin.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  // 获取插件下载统计
  getDownloadStats(pluginId: string): { total: number; versions: Record<string, number> } {
    // 这里应该从实际的下载记录中获取数据
    // 简化实现
    return {
      total: 1250,
      versions: {
        '1.0.0': 800,
        '1.1.0': 300,
        '1.2.0': 150
      }
    }
  }
}

// 插件安装器类
export class PluginInstaller {
  async installPlugin(packagePath: string, targetPath: string): Promise<void> {
    // 读取插件包
    const packageContent = await fs.promises.readFile(packagePath, 'utf-8')
    const pluginPackage: PluginPackage = JSON.parse(packageContent)

    // 验证包完整性
    const calculatedChecksum = crypto.createHash('sha256')
      .update(JSON.stringify(pluginPackage.files))
      .digest('hex')

    if (calculatedChecksum !== pluginPackage.checksum) {
      throw new Error('插件包校验失败，可能已损坏')
    }

    // 创建安装目录
    const installPath = path.join(targetPath, pluginPackage.id)
    await fs.promises.mkdir(installPath, { recursive: true })

    // 解压并安装文件
    for (const file of pluginPackage.files) {
      const filePath = path.join(installPath, file.path)
      const fileDir = path.dirname(filePath)

      await fs.promises.mkdir(fileDir, { recursive: true })

      let content = file.content
      if (file.compressed) {
        // 解压缩
        content = Buffer.from(content, 'base64').toString('utf-8')
      }

      await fs.promises.writeFile(filePath, content, 'utf-8')

      if (file.executable) {
        await fs.promises.chmod(filePath, 0o755)
      }
    }
  }

  async uninstallPlugin(pluginId: string, targetPath: string): Promise<void> {
    const installPath = path.join(targetPath, pluginId)

    // 检查目录是否存在
    if (!fs.existsSync(installPath)) {
      throw new Error(`插件 ${pluginId} 未安装`)
    }

    // 删除插件目录
    await fs.promises.rm(installPath, { recursive: true, force: true })
  }

  async updatePlugin(packagePath: string, targetPath: string): Promise<void> {
    const packageContent = await fs.promises.readFile(packagePath, 'utf-8')
    const pluginPackage: PluginPackage = JSON.parse(packageContent)

    // 先卸载旧版本
    await this.uninstallPlugin(pluginPackage.id, targetPath)

    // 安装新版本
    await this.installPlugin(packagePath, targetPath)
  }
}

// 创建单例实例
export const publisher = new Publisher()
export const installer = new PluginInstaller()
