import { Controller, Get, Header, Query, HttpStatus, HttpCode } from '@nestjs/common'
import { VersionManagementService, VersionCompatibility } from './version-management.service'
import { RateLimitMiddleware } from './rate-limit.middleware'

@Controller('api')
export class ApiGatewayController {
  constructor(
    private readonly versionService: VersionManagementService,
    private readonly rateLimitMiddleware: RateLimitMiddleware
  ) {}

  /**
   * 获取API版本信息
   */
  @Get('version')
  @HttpCode(HttpStatus.OK)
  getVersionInfo(@Query('version') requestedVersion?: string) {
    const currentVersion = this.versionService.getCurrentVersion()
    const compatibility = this.versionService.checkVersionCompatibility(requestedVersion)

    return {
      success: true,
      data: {
        current: currentVersion,
        requested: requestedVersion || 'latest',
        compatibility,
        supportedVersions: this.versionService.getSupportedVersions()
      }
    }
  }

  /**
   * 获取API状态和限流信息
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getApiStatus() {
    return {
      success: true,
      data: {
        status: 'operational',
        version: this.versionService.getCurrentVersion(),
        timestamp: new Date().toISOString(),
        services: {
          graphql: 'available',
          rest: 'available',
          websocket: 'available'
        }
      }
    }
  }

  /**
   * 获取迁移指导
   */
  @Get('migration-guide')
  @HttpCode(HttpStatus.OK)
  getMigrationGuide(
    @Query('from') fromVersion: string,
    @Query('to') toVersion?: string
  ) {
    if (!fromVersion) {
      return {
        success: false,
        error: 'from version is required'
      }
    }

    const guidance = this.versionService.getMigrationGuidance(fromVersion, toVersion)

    return {
      success: true,
      data: {
        fromVersion,
        toVersion: toVersion || this.versionService.getCurrentVersion(),
        guidance
      }
    }
  }

  /**
   * API规范文档
   */
  @Get('spec')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  getApiSpec(@Query('version') version?: string) {
    const apiVersion = version || this.versionService.getCurrentVersion()
    const compatibility = this.versionService.checkVersionCompatibility(apiVersion)

    if (!compatibility.supported) {
      return {
        success: false,
        error: `Version ${apiVersion} is not supported`,
        alternatives: compatibility.alternatives
      }
    }

    // 这里应该返回实际的OpenAPI/Swagger规范
    // 暂时返回基本信息
    return {
      openapi: '3.0.0',
      info: {
        title: 'Creation Ring API',
        version: apiVersion,
        description: 'AI-powered narrative system API'
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:3000',
          description: 'Main API server'
        }
      ],
      paths: {
        '/api/version': {
          get: {
            summary: 'Get API version information',
            responses: {
              '200': {
                description: 'Version information'
              }
            }
          }
        }
      }
    }
  }

  /**
   * API使用统计
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getApiStats() {
    // 这里应该返回实际的API使用统计
    // 暂时返回模拟数据
    return {
      success: true,
      data: {
        totalRequests: 0,
        requestsPerMinute: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topEndpoints: [],
        version: this.versionService.getCurrentVersion()
      }
    }
  }
}
