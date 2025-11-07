// apps/backend/apps/nexus-engine/src/settings/settings.service.ts

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@tuheg/common-backend'; // 你提供的共享 PrismaService
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
  TestAiConnectionDto,
  createAiSettingsSchema,
} from '@tuheg/common-backend';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  // Helper: ensure role records exist and return their objects (id + name)
  private async ensureRoles(roleNames: string[]) {
    if (!Array.isArray(roleNames)) return [];

    const normalized = Array.from(
      new Set(
        roleNames.map((r) => (typeof r === 'string' ? r.trim() : '')).filter((r) => r.length > 0),
      ),
    );

    const results = [];
    for (const name of normalized) {
      // Upsert role by name (Role.name has unique constraint)
      const role = await this.prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      results.push(role);
    }
    return results;
  }

  // Create AI configuration for a user
  public async createAiSetting(userId: string, payload: unknown) {
    // validate minimal shape
    const parsed = createAiSettingsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException('Invalid payload for createAiSetting');
    }
    const dto = parsed.data as CreateAiSettingsDto;

    // If roles provided, ensure they exist
    const roleRecords = dto.roles && dto.roles.length > 0 ? await this.ensureRoles(dto.roles) : [];

    const created = await this.prisma.aiConfiguration.create({
      data: {
        owner: { connect: { id: userId } },
        provider: dto.provider,
        apiKey: dto.apiKey,
        modelId: dto.modelId,
        baseUrl: dto.baseUrl ?? null,
        roles:
          roleRecords.length > 0 ? { connect: roleRecords.map((r) => ({ id: r.id })) } : undefined,
      },
      include: {
        roles: true,
      },
    });

    // Normalize returned object (frontend expects roles array)
    return this.normalizeAiConfiguration(created);
  }

  // Update AI configuration (only owner can update)
  public async updateAiSetting(
    userId: string,
    configId: string,
    payload: Partial<UpdateAiSettingsDto>,
  ) {
    // Check existence and ownership
    const existing = await this.prisma.aiConfiguration.findUnique({
      where: { id: configId },
      include: { roles: true },
    });
    if (!existing) {
      throw new NotFoundException('AI configuration not found');
    }
    if (existing.ownerId !== userId) {
      throw new BadRequestException('Not authorized to update this configuration');
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (payload.provider !== undefined) dataToUpdate.provider = payload.provider;
    if (payload.apiKey !== undefined) dataToUpdate.apiKey = payload.apiKey;
    if (payload.modelId !== undefined) dataToUpdate.modelId = payload.modelId;
    if (payload.baseUrl !== undefined) dataToUpdate.baseUrl = payload.baseUrl ?? null;

    // Handle roles: if provided, upsert roles and set relation to exactly this list
    if (payload.roles) {
      const roleRecords = await this.ensureRoles(payload.roles);
      // Use 'set' to replace existing relation with new ones
      dataToUpdate.roles = { set: roleRecords.map((r) => ({ id: r.id })) };
    }

    const updated = await this.prisma.aiConfiguration.update({
      where: { id: configId },
      data: dataToUpdate,
      include: { roles: true },
    });

    return this.normalizeAiConfiguration(updated);
  }

  // Delete AI configuration (only owner can delete)
  public async deleteAiSetting(userId: string, configId: string) {
    const existing = await this.prisma.aiConfiguration.findUnique({ where: { id: configId } });
    if (!existing) {
      throw new NotFoundException('AI configuration not found');
    }
    if (existing.ownerId !== userId) {
      throw new BadRequestException('Not authorized to delete this configuration');
    }

    await this.prisma.aiConfiguration.delete({ where: { id: configId } });
    return { message: 'deleted' };
  }

  // Get all AI configurations for a user
  public async getAllAiSettingsForUser(userId: string) {
    const configs = await this.prisma.aiConfiguration.findMany({
      where: { ownerId: userId },
      include: {
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return configs.map((c) => this.normalizeAiConfiguration(c));
  }

  // Normalize DB record to API shape: includes roles: string[]
  private normalizeAiConfiguration(record: Record<string, unknown>) {
    const roles =
      Array.isArray(record.roles) && record.roles.length > 0
        ? record.roles
            .map((r: unknown) =>
              typeof r === 'object' && r !== null && 'name' in r
                ? (r as Record<string, unknown>).name
                : r,
            )
            .filter((r): r is string => typeof r === 'string')
        : [];

    return {
      id: record.id as string,
      ownerId: record.ownerId as string,
      provider: record.provider as string,
      apiKey: record.apiKey ? '***REDACTED***' : '', // don't leak key in API responses (return empty string instead of null)
      modelId: record.modelId as string,
      baseUrl: (record.baseUrl as string | null) ?? null,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date,
      roles, // string[]
      // legacy compatibility for frontends expecting assignedRoles CSV:
      assignedRoles: roles.join(','),
    };
  }

  /**
   * Test AI connection and fetch available models for different providers.
   * Supports multiple AI providers with specific model fetching logic.
   */
  public async testAndFetchModels(
    dto: TestAiConnectionDto,
  ): Promise<{ models: string[]; connectionStatus: string; message?: string }> {
    const provider = dto.provider?.toLowerCase?.() ?? '';
    const apiKey = dto.apiKey;
    const baseUrl = dto.baseUrl ?? null;

    // Input validation
    if (!provider) {
      throw new BadRequestException('供应商 (provider) 是必填项');
    }
    if (!apiKey) {
      throw new BadRequestException('API密钥 (apiKey) 是必填项');
    }

    try {
      let models: string[] = [];
      const connectionStatus = 'success';
      const message = '连接成功';

      switch (provider) {
        case 'openai':
        case 'groq':
          models = await this.fetchOpenAICompatibleModels(
            baseUrl || this.getDefaultBaseUrl(provider),
            apiKey,
          );
          break;

        case 'anthropic':
          models = await this.fetchAnthropicModels(apiKey);
          break;

        case 'google':
          models = await this.fetchGoogleModels(apiKey);
          break;

        case 'deepseek':
          models = await this.fetchDeepSeekModels(apiKey);
          break;

        case 'moonshot':
          models = await this.fetchMoonshotModels(apiKey);
          break;

        case 'zhipu':
          models = await this.fetchZhipuModels(apiKey);
          break;

        case 'baichuan':
          models = await this.fetchBaichuanModels(apiKey);
          break;

        case 'ollama':
          models = await this.fetchOllamaModels(baseUrl);
          break;

        default:
          // Generic fallback for custom providers
          models = await this.fetchGenericModels(baseUrl, apiKey);
          break;
      }

      return {
        models,
        connectionStatus,
        message: `${message}，获取到 ${models.length} 个可用模型`,
      };
    } catch (err) {
      const error = this.parseConnectionError(err);
      this.logger.warn(`testAndFetchModels failed for provider ${provider}`, {
        error: error.message,
        statusCode: error.statusCode,
        details: error.details,
      });

      throw new BadRequestException({
        message: error.message,
        details: error.details,
        statusCode: error.statusCode,
        provider,
      });
    }
  }

  /**
   * Fetch models from OpenAI-compatible APIs
   */
  private async fetchOpenAICompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const url = baseUrl.replace(/\/+$/, '') + '/v1/models';
    const resp$ = this.httpService.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.data)
      ? resp.data.data
          .map((m: Record<string, unknown>) => String(m.id || m.model || m))
          .filter(Boolean)
      : [];
  }

  /**
   * Fetch models from Anthropic API
   */
  private async fetchAnthropicModels(apiKey: string): Promise<string[]> {
    // Anthropic doesn't have a models endpoint, return known models
    const knownModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
    ];

    // Test connection with a simple request
    const testUrl = 'https://api.anthropic.com/v1/messages';
    const resp$ = this.httpService.post(
      testUrl,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      },
    );

    await lastValueFrom(resp$);
    return knownModels;
  }

  /**
   * Fetch models from Google AI API
   */
  private async fetchGoogleModels(apiKey: string): Promise<string[]> {
    // Google AI Studio API doesn't have a models endpoint, return known models
    const knownModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'];

    // Test connection
    const testUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const resp$ = this.httpService.post(
      testUrl,
      {
        contents: [{ parts: [{ text: 'test' }] }],
      },
      {
        params: { key: apiKey },
        timeout: 5000,
      },
    );

    await lastValueFrom(resp$);
    return knownModels;
  }

  /**
   * Fetch models from DeepSeek API
   */
  private async fetchDeepSeekModels(apiKey: string): Promise<string[]> {
    const url = 'https://api.deepseek.com/v1/models';
    const resp$ = this.httpService.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.data)
      ? resp.data.data.map((m: Record<string, unknown>) => String(m.id || m)).filter(Boolean)
      : ['deepseek-chat', 'deepseek-coder'];
  }

  /**
   * Fetch models from Moonshot API
   */
  private async fetchMoonshotModels(apiKey: string): Promise<string[]> {
    const url = 'https://api.moonshot.cn/v1/models';
    const resp$ = this.httpService.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.data)
      ? resp.data.data.map((m: Record<string, unknown>) => String(m.id || m)).filter(Boolean)
      : ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
  }

  /**
   * Fetch models from Zhipu AI API
   */
  private async fetchZhipuModels(apiKey: string): Promise<string[]> {
    const url = 'https://open.bigmodel.cn/api/paas/v4/models';
    const resp$ = this.httpService.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.data)
      ? resp.data.data.map((m: Record<string, unknown>) => String(m.id || m)).filter(Boolean)
      : ['glm-4', 'glm-3-turbo', 'chatglm_turbo'];
  }

  /**
   * Fetch models from Baichuan AI API
   */
  private async fetchBaichuanModels(apiKey: string): Promise<string[]> {
    const url = 'https://api.baichuan-ai.com/v1/models';
    const resp$ = this.httpService.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.data)
      ? resp.data.data.map((m: Record<string, unknown>) => String(m.id || m)).filter(Boolean)
      : ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan2-53B'];
  }

  /**
   * Fetch models from Ollama API
   */
  private async fetchOllamaModels(baseUrl: string | null): Promise<string[]> {
    const url = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '') + '/api/tags';
    const resp$ = this.httpService.get(url, {
      timeout: 5000,
    });

    const resp = await lastValueFrom(resp$);
    return Array.isArray(resp.data?.models)
      ? resp.data.models.map((m: Record<string, unknown>) => String(m.name || m)).filter(Boolean)
      : [];
  }

  /**
   * Generic model fetching for custom providers
   */
  private async fetchGenericModels(baseUrl: string | null, apiKey: string): Promise<string[]> {
    if (!baseUrl) {
      return [];
    }

    // Try common model endpoints
    const endpoints = ['/v1/models', '/models', '/api/models', '/v1/engines'];

    for (const endpoint of endpoints) {
      try {
        const url = baseUrl.replace(/\/+$/, '') + endpoint;
        const resp$ = this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        const resp = await lastValueFrom(resp$);

        // Try different response formats
        if (Array.isArray(resp.data?.data)) {
          return resp.data.data
            .map((m: Record<string, unknown>) => String(m.id || m.name || m))
            .filter(Boolean);
        }
        if (Array.isArray(resp.data?.models)) {
          return resp.data.models
            .map((m: Record<string, unknown>) => String(m.id || m.name || m))
            .filter(Boolean);
        }
        if (Array.isArray(resp.data)) {
          return resp.data
            .map((m: Record<string, unknown>) => String(m.id || m.name || m))
            .filter(Boolean);
        }
      } catch {
        // Continue to next endpoint
        continue;
      }
    }

    return [];
  }

  /**
   * Get default base URL for known providers
   */
  private getDefaultBaseUrl(provider: string): string {
    const defaults: Record<string, string> = {
      openai: 'https://api.openai.com',
      groq: 'https://api.groq.com/openai',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com',
      deepseek: 'https://api.deepseek.com',
      moonshot: 'https://api.moonshot.cn',
      zhipu: 'https://open.bigmodel.cn/api/paas',
      baichuan: 'https://api.baichuan-ai.com',
      ollama: 'http://localhost:11434',
    };
    return defaults[provider as keyof typeof defaults] || '';
  }

  /**
   * Parse connection errors into user-friendly format
   */
  private parseConnectionError(err: unknown): {
    message: string;
    statusCode?: number;
    details?: string;
  } {
    if (err instanceof Error) {
      // Handle Axios errors
      if ('response' in err && err.response) {
        const response = err.response as { status?: number; data?: unknown };
        const statusCode = response.status;
        const data = response.data;

        switch (statusCode) {
          case 401:
            return {
              message: 'API密钥无效或已过期',
              statusCode: 401,
              details: '请检查您的API密钥是否正确，或联系供应商确认密钥状态',
            };
          case 403:
            return {
              message: 'API密钥权限不足',
              statusCode: 403,
              details: '您的API密钥可能没有访问此功能的权限',
            };
          case 429:
            return {
              message: '请求频率过高，请稍后再试',
              statusCode: 429,
              details: '已达到API速率限制，请等待一段时间后重试',
            };
          case 500:
          case 502:
          case 503:
          case 504:
            return {
              message: '供应商服务暂时不可用',
              statusCode: statusCode,
              details: '供应商服务器出现问题，请稍后重试或联系供应商支持',
            };
          default:
            return {
              message: data?.error?.message || data?.message || '连接失败',
              statusCode: statusCode,
              details: `HTTP ${statusCode}: ${err.message}`,
            };
        }
      }

      // Handle network errors
      if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
        return {
          message: '连接超时',
          details: '网络连接超时，请检查网络连接或稍后重试',
        };
      }

      if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        return {
          message: '无法连接到供应商服务器',
          details: '请检查网络连接和Base URL是否正确',
        };
      }

      // Generic error
      return {
        message: '连接失败',
        details: err.message,
      };
    }

    return {
      message: '未知连接错误',
      details: String(err),
    };
  }
}
