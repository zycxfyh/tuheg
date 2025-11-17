import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface ApiVersion {
  major: number
  minor: number
  patch: number
  label?: string // 如 'beta', 'rc'
}

export interface VersionCompatibility {
  version: string
  supported: boolean
  deprecated: boolean
  sunsetDate?: Date
  alternatives?: string[]
}

@Injectable()
export class VersionManagementService {
  private readonly logger = new Logger(VersionManagementService.name)
  private readonly currentVersion: ApiVersion
  private readonly supportedVersions: Map<string, VersionCompatibility>

  constructor(private configService: ConfigService) {
    // 从环境变量或配置获取当前版本
    this.currentVersion = this.parseVersion(
      this.configService.get('API_VERSION', '1.0.0')
    )

    // 初始化支持的版本
    this.supportedVersions = new Map([
      ['1.0.0', { version: '1.0.0', supported: true, deprecated: false }],
      ['1.1.0', { version: '1.1.0', supported: true, deprecated: false }],
      ['2.0.0', { version: '2.0.0', supported: true, deprecated: false }],
      // 过时的版本
      ['0.9.0', {
        version: '0.9.0',
        supported: false,
        deprecated: true,
        sunsetDate: new Date('2025-12-31'),
        alternatives: ['1.0.0']
      }],
    ])
  }

  /**
   * 解析版本字符串
   */
  private parseVersion(versionStr: string): ApiVersion {
    const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/)
    if (!match) {
      throw new Error(`Invalid version format: ${versionStr}`)
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      label: match[4]
    }
  }

  /**
   * 格式化版本对象为字符串
   */
  private formatVersion(version: ApiVersion): string {
    let versionStr = `${version.major}.${version.minor}.${version.patch}`
    if (version.label) {
      versionStr += `-${version.label}`
    }
    return versionStr
  }

  /**
   * 获取当前API版本
   */
  getCurrentVersion(): string {
    return this.formatVersion(this.currentVersion)
  }

  /**
   * 检查版本兼容性
   */
  checkVersionCompatibility(requestedVersion?: string): VersionCompatibility {
    // 如果没有指定版本，使用当前版本
    const version = requestedVersion || this.getCurrentVersion()

    const compatibility = this.supportedVersions.get(version)

    if (!compatibility) {
      // 版本不存在
      return {
        version,
        supported: false,
        deprecated: false,
        alternatives: [this.getCurrentVersion()]
      }
    }

    // 检查是否已过期
    if (compatibility.sunsetDate && compatibility.sunsetDate < new Date()) {
      return {
        ...compatibility,
        supported: false,
        deprecated: true
      }
    }

    return compatibility
  }

  /**
   * 验证版本是否支持
   */
  validateVersion(version?: string): boolean {
    const compatibility = this.checkVersionCompatibility(version)
    return compatibility.supported
  }

  /**
   * 获取版本标头
   */
  getVersionHeaders(requestedVersion?: string) {
    const compatibility = this.checkVersionCompatibility(requestedVersion)

    const headers: Record<string, string> = {
      'X-API-Version': this.getCurrentVersion(),
      'X-API-Version-Requested': requestedVersion || 'latest'
    }

    if (!compatibility.supported) {
      headers['X-API-Version-Deprecated'] = 'true'
      if (compatibility.alternatives && compatibility.alternatives.length > 0) {
        headers['X-API-Version-Alternatives'] = compatibility.alternatives.join(', ')
      }
    }

    if (compatibility.sunsetDate) {
      headers['X-API-Version-Sunset'] = compatibility.sunsetDate.toISOString()
    }

    return headers
  }

  /**
   * 版本比较
   */
  compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1)
    const v2 = this.parseVersion(version2)

    if (v1.major !== v2.major) {
      return v1.major > v2.major ? 1 : -1
    }

    if (v1.minor !== v2.minor) {
      return v1.minor > v2.minor ? 1 : -1
    }

    if (v1.patch !== v2.patch) {
      return v1.patch > v2.patch ? 1 : -1
    }

    return 0
  }

  /**
   * 获取所有支持的版本
   */
  getSupportedVersions(): VersionCompatibility[] {
    return Array.from(this.supportedVersions.values())
  }

  /**
   * 版本路由解析
   */
  resolveVersionedRoute(route: string, version?: string): string {
    if (!version || version === this.getCurrentVersion()) {
      return route
    }

    // 为不同版本添加前缀
    const versionPrefix = `/v${version.split('.')[0]}`
    return route.startsWith(versionPrefix) ? route : `${versionPrefix}${route}`
  }

  /**
   * 版本迁移建议
   */
  getMigrationGuidance(fromVersion: string, toVersion?: string): {
    recommended: boolean
    breaking: boolean
    changes: string[]
    migrationGuide?: string
  } {
    const targetVersion = toVersion || this.getCurrentVersion()

    const from = this.parseVersion(fromVersion)
    const to = this.parseVersion(targetVersion)

    const breaking = from.major < to.major
    const changes: string[] = []

    if (breaking) {
      changes.push(`Breaking changes in v${to.major}.0.0`)
      changes.push('API contracts may have changed')
      changes.push('Client code updates required')
    } else if (from.minor < to.minor) {
      changes.push(`New features in v${to.major}.${to.minor}.0`)
      changes.push('Backward compatible')
    } else if (from.patch < to.patch) {
      changes.push(`Bug fixes and improvements in v${to.major}.${to.minor}.${to.patch}`)
      changes.push('Fully backward compatible')
    }

    return {
      recommended: true, // 总是推荐升级到最新版本
      breaking,
      changes,
      migrationGuide: breaking ? `/docs/migration/v${to.major}.0.0` : undefined
    }
  }
}
