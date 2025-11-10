import { IAiProviderFactory, AiProviderType, AiModelConfig } from '@tuheg/abstractions';
import { IProvider, ProviderConfig, ProviderRegistration } from '../interfaces';

/**
 * AI提供商工厂实现
 * 负责创建和管理不同类型的AI提供商实例
 */
export class AiProviderFactory implements IAiProviderFactory {
  private readonly providers = new Map<AiProviderType, ProviderRegistration>();
  private readonly instances = new Map<string, IProvider>();

  constructor() {
    // 注册内置提供商
    this.registerBuiltInProviders();
  }

  /**
   * 创建AI提供商实例
   */
  createProvider(providerType: AiProviderType, config: any): IProvider {
    const registration = this.providers.get(providerType);
    if (!registration) {
      throw new Error(`Unknown provider type: ${providerType}`);
    }

    const providerConfig: ProviderConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      organizationId: config.organizationId,
      projectId: config.projectId,
      timeout: config.timeout || 30000,
      retry: config.retry || {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      rateLimit: config.rateLimit,
      cache: config.cache
    };

    const instanceKey = `${providerType}:${JSON.stringify(providerConfig)}`;
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    const provider = new registration.providerClass(providerConfig);
    this.instances.set(instanceKey, provider);

    return provider;
  }

  /**
   * 获取所有可用的提供商类型
   */
  getAvailableProviders(): AiProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 根据模型名称获取最合适的提供商
   */
  getProviderForModel(modelName: string): IProvider | null {
    // 简单的模型映射逻辑，可以根据需要扩展
    const modelMappings: Record<string, AiProviderType> = {
      'gpt-3.5-turbo': 'openai',
      'gpt-4': 'openai',
      'claude-3': 'anthropic',
      'claude-3-sonnet': 'anthropic',
      'gemini-pro': 'google'
    };

    const providerType = modelMappings[modelName] || 'openai'; // 默认使用OpenAI
    const registration = this.providers.get(providerType);

    if (!registration) {
      return null;
    }

    // 返回一个默认配置的提供商实例
    return this.createProvider(providerType, { apiKey: 'dummy-key' });
  }

  /**
   * 注册新的提供商
   */
  registerProvider(registration: ProviderRegistration): void {
    this.providers.set(registration.type, registration);
  }

  /**
   * 注销提供商
   */
  unregisterProvider(providerType: AiProviderType): void {
    this.providers.delete(providerType);
  }

  /**
   * 获取提供商注册信息
   */
  getProviderRegistration(providerType: AiProviderType): ProviderRegistration | null {
    return this.providers.get(providerType) || null;
  }

  /**
   * 获取所有提供商注册信息
   */
  getAllProviderRegistrations(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  /**
   * 清理所有实例缓存
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * 注册内置提供商
   * 注意：这里只是注册，实际的提供商实现类需要在各自的包中定义
   */
  private registerBuiltInProviders(): void {
    // 这里会在providers包中实现具体的提供商类后进行注册
    // 暂时注册占位符
    const builtInProviders: AiProviderType[] = ['openai', 'anthropic', 'google', 'azure', 'custom'];

    builtInProviders.forEach(type => {
      // 实际实现时需要导入具体的提供商类
      // this.registerProvider({
      //   type,
      //   providerClass: OpenAiProvider, // 例如
      //   supportedModels: [...],
      //   metadata: {...}
      // });
    });
  }
}
