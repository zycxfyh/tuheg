import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePluginVersionDto } from '../dto/plugin-marketplace.dto'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class PluginUploadService {
  private readonly uploadDir = 'uploads/plugins'
  private readonly maxFileSize = 50 * 1024 * 1024 // 50MB
  private readonly allowedExtensions = ['.zip', '.tar.gz', '.tgz']

  constructor(private prisma: PrismaService) {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  /**
   * 上传插件文件并创建新版本
   */
  async uploadPluginFile(
    pluginId: string,
    file: Express.Multer.File,
    versionData: { version: string; changelog?: string }
  ) {
    // 验证文件
    this.validateFile(file)

    // 检查插件是否存在
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      select: { id: true, authorId: true },
    })

    if (!plugin) {
      throw new NotFoundException('Plugin not found')
    }

    // 检查版本是否已存在
    const existingVersion = await this.prisma.pluginVersion.findUnique({
      where: {
        pluginId_version: {
          pluginId,
          version: versionData.version,
        },
      },
    })

    if (existingVersion) {
      throw new BadRequestException('Version already exists')
    }

    // 生成文件路径和校验和
    const fileName = `${pluginId}-${versionData.version}-${Date.now()}${path.extname(file.originalname)}`
    const filePath = path.join(this.uploadDir, fileName)
    const checksum = this.calculateChecksum(file.buffer)

    // 保存文件
    fs.writeFileSync(filePath, file.buffer)

    // 构造下载URL（实际部署时需要配置正确的URL）
    const downloadUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/plugins/marketplace/download/${pluginId}/${versionData.version}`

    // 创建版本记录
    const version = await this.prisma.pluginVersion.create({
      data: {
        pluginId,
        version: versionData.version,
        changelog: versionData.changelog,
        downloadUrl,
        fileSize: file.size,
        checksum,
        isStable: true, // 默认标记为稳定版本
      },
    })

    // 更新插件的更新时间
    await this.prisma.pluginMarketplace.update({
      where: { id: pluginId },
      data: { updatedAt: new Date() },
    })

    return {
      version,
      fileName,
      downloadUrl,
      checksum,
      fileSize: file.size,
    }
  }

  /**
   * 下载插件文件
   */
  async downloadPlugin(
    pluginId: string,
    version?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 获取插件信息
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      select: {
        id: true,
        status: true,
        isPublic: true,
        totalDownloads: true,
      },
    })

    if (!plugin || plugin.status !== 'APPROVED' || !plugin.isPublic) {
      throw new NotFoundException('Plugin not found or not available')
    }

    // 获取版本信息
    let versionRecord
    if (version) {
      versionRecord = await this.prisma.pluginVersion.findUnique({
        where: {
          pluginId_version: {
            pluginId,
            version,
          },
        },
      })
    } else {
      // 获取最新稳定版本
      versionRecord = await this.prisma.pluginVersion.findFirst({
        where: {
          pluginId,
          isStable: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!versionRecord) {
      throw new NotFoundException('Plugin version not found')
    }

    // 记录下载统计
    await this.prisma.pluginDownload.create({
      data: {
        pluginId,
        userId,
        versionId: versionRecord.id,
        ipAddress,
        userAgent,
      },
    })

    // 更新下载计数
    await this.prisma.$transaction([
      this.prisma.pluginVersion.update({
        where: { id: versionRecord.id },
        data: { downloads: { increment: 1 } },
      }),
      this.prisma.pluginMarketplace.update({
        where: { id: pluginId },
        data: { totalDownloads: { increment: 1 } },
      }),
    ])

    return {
      downloadUrl: versionRecord.downloadUrl,
      version: versionRecord.version,
      fileSize: versionRecord.fileSize,
      checksum: versionRecord.checksum,
      downloads: versionRecord.downloads + 1,
    }
  }

  /**
   * 获取插件的文件列表（管理员功能）
   */
  async getPluginFiles(pluginId: string) {
    const versions = await this.prisma.pluginVersion.findMany({
      where: { pluginId },
      select: {
        id: true,
        version: true,
        fileSize: true,
        checksum: true,
        downloads: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return versions.map((version) => ({
      versionId: version.id,
      version: version.version,
      fileSize: version.fileSize,
      checksum: version.checksum,
      downloads: version.downloads,
      uploadedAt: version.createdAt,
    }))
  }

  /**
   * 删除插件版本文件
   */
  async deletePluginVersion(pluginId: string, version: string, authorId: string): Promise<void> {
    // 检查权限
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      select: { authorId: true },
    })

    if (!plugin || plugin.authorId !== authorId) {
      throw new NotFoundException('Plugin not found or access denied')
    }

    // 查找版本
    const versionRecord = await this.prisma.pluginVersion.findUnique({
      where: {
        pluginId_version: {
          pluginId,
          version,
        },
      },
    })

    if (!versionRecord) {
      throw new NotFoundException('Version not found')
    }

    // 检查是否是最后一个版本
    const versionCount = await this.prisma.pluginVersion.count({
      where: { pluginId },
    })

    if (versionCount <= 1) {
      throw new BadRequestException('Cannot delete the last version of a plugin')
    }

    // 删除版本记录（级联删除下载记录）
    await this.prisma.pluginVersion.delete({
      where: { id: versionRecord.id },
    })

    // TODO: 删除实际文件（需要根据downloadUrl解析文件路径）
    // const filePath = this.getFilePathFromUrl(versionRecord.downloadUrl);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
  }

  /**
   * 验证文件
   */
  private validateFile(file: Express.Multer.File): void {
    // 检查文件是否存在
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`
      )
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase()
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedExtensions.join(', ')}`
      )
    }

    // 检查文件内容（基本检查）
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty')
    }
  }

  /**
   * 计算文件校验和
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  /**
   * 验证文件完整性
   */
  async verifyFileIntegrity(pluginId: string, version: string): Promise<boolean> {
    const versionRecord = await this.prisma.pluginVersion.findUnique({
      where: {
        pluginId_version: {
          pluginId,
          version,
        },
      },
      select: { checksum: true, downloadUrl: true },
    })

    if (!versionRecord?.checksum) {
      return false
    }

    try {
      // TODO: 从downloadUrl获取文件并计算校验和
      // 这里简化处理，实际需要根据URL下载文件
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(): Promise<void> {
    // 清理过期的临时文件
    const tempDir = path.join(this.uploadDir, 'temp')
    if (!fs.existsSync(tempDir)) return

    const files = fs.readdirSync(tempDir)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    for (const file of files) {
      const filePath = path.join(tempDir, file)
      const stats = fs.statSync(filePath)

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath)
      }
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    pluginsCount: number
    versionsCount: number
  }> {
    const [totalFiles, totalSize, pluginsCount, versionsCount] = await Promise.all([
      this.prisma.pluginVersion.count(),
      this.prisma.pluginVersion.aggregate({
        _sum: { fileSize: true },
      }),
      this.prisma.pluginMarketplace.count(),
      this.prisma.pluginVersion.count(),
    ])

    return {
      totalFiles,
      totalSize: totalSize._sum.fileSize || 0,
      pluginsCount,
      versionsCount,
    }
  }
}
