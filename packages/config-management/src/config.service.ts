import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { IConfigurationService } from '@tuheg/abstractions';

/**
 * 配置服务实现
 * 实现IConfigurationService接口，提供类型安全和结构化的配置管理
 */
@Injectable()
export class ConfigService implements IConfigurationService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  /**
   * 获取配置值
   */
  get<T>(key: string, defaultValue?: T): T {
    return this.nestConfigService.get<T>(key, defaultValue);
  }

  /**
   * 设置配置值
   * 注意：运行时设置的值不会持久化到环境变量
   */
  set<T>(key: string, value: T): void {
    // NestJS ConfigService 不支持运行时设置
    // 这里可以扩展为支持内存中的配置覆盖
    process.env[key] = String(value);
  }

  /**
   * 检查配置是否存在
   */
  has(key: string): boolean {
    return this.nestConfigService.get(key) !== undefined;
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, any> {
    // 注意：NestJS ConfigService 没有直接获取所有配置的方法
    // 这里返回一个空对象，实际使用时需要从环境变量或其他来源获取
    return {};
  }

  /**
   * 监听配置变化
   * 注意：NestJS ConfigService 不支持配置变化监听
   */
  watch<T>(key: string, callback: (newValue: T, oldValue: T) => void): () => void {
    // 简单的轮询实现，实际项目中可能需要更复杂的机制
    const interval = setInterval(() => {
      const newValue = this.get<T>(key);
      // 这里没有旧值的跟踪，简化实现
      callback(newValue, newValue);
    }, 5000); // 每5秒检查一次

    return () => clearInterval(interval);
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return {
      host: this.get('DATABASE_HOST', 'localhost'),
      port: this.get('DATABASE_PORT', 5432),
      username: this.get('DATABASE_USERNAME', 'postgres'),
      password: this.get('DATABASE_PASSWORD', ''),
      database: this.get('DATABASE_NAME', 'creation_ring'),
      ssl: this.get('DATABASE_SSL', false),
    };
  }

  /**
   * 获取Redis配置
   */
  getRedisConfig() {
    return {
      host: this.get('REDIS_HOST', 'localhost'),
      port: this.get('REDIS_PORT', 6379),
      password: this.get('REDIS_PASSWORD'),
      db: this.get('REDIS_DB', 0),
    };
  }

  /**
   * 获取AI提供商配置
   */
  getAiProvidersConfig() {
    return {
      openai: {
        apiKey: this.get('OPENAI_API_KEY'),
        baseUrl: this.get('OPENAI_BASE_URL'),
        organizationId: this.get('OPENAI_ORGANIZATION_ID'),
      },
      anthropic: {
        apiKey: this.get('ANTHROPIC_API_KEY'),
        baseUrl: this.get('ANTHROPIC_BASE_URL'),
      },
      google: {
        apiKey: this.get('GOOGLE_AI_API_KEY'),
        projectId: this.get('GOOGLE_PROJECT_ID'),
      },
    };
  }

  /**
   * 获取服务器配置
   */
  getServerConfig() {
    return {
      port: this.get('PORT', 3000),
      host: this.get('HOST', 'localhost'),
      environment: this.get('NODE_ENV', 'development'),
      cors: {
        origin: this.get('CORS_ORIGIN', '*'),
        credentials: this.get('CORS_CREDENTIALS', true),
      },
    };
  }

  /**
   * 获取监控配置
   */
  getMonitoringConfig() {
    return {
      sentry: {
        dsn: this.get('SENTRY_DSN'),
        environment: this.get('NODE_ENV', 'development'),
        release: this.get('SENTRY_RELEASE'),
      },
      enabled: this.get('MONITORING_ENABLED', true),
    };
  }
}
