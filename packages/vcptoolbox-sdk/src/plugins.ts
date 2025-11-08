import {
  Plugin,
  ApiResponse
} from './types.js';
import { VCPToolBoxClient } from './client.js';

/**
 * Plugin Management Module
 * 插件管理模块
 */
export class PluginManager {
  constructor(private client: VCPToolBoxClient) {}

  /**
   * 获取所有可用插件
   */
  async getPlugins(params?: {
    category?: string;
    author?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Plugin[]>> {
    return this.client.get<Plugin[]>('/plugins', params);
  }

  /**
   * 获取单个插件详情
   */
  async getPlugin(pluginId: string): Promise<ApiResponse<Plugin>> {
    return this.client.get<Plugin>(`/plugins/${pluginId}`);
  }

  /**
   * 搜索插件
   */
  async searchPlugins(query: {
    q: string;
    category?: string;
    author?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Plugin[]>> {
    return this.client.get<Plugin[]>('/plugins/search', query);
  }

  /**
   * 获取插件分类
   */
  async getPluginCategories(): Promise<ApiResponse<string[]>> {
    return this.client.get<string[]>('/plugins/categories');
  }

  /**
   * 获取插件标签
   */
  async getPluginTags(): Promise<ApiResponse<string[]>> {
    return this.client.get<string[]>('/plugins/tags');
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginId: string, version?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.client.post('/plugins/install', {
      pluginId,
      version
    });

    if (response.data.success) {
      // 获取插件详情并触发事件
      try {
        const pluginResponse = await this.getPlugin(pluginId);
        this.client.emit('pluginLoaded', pluginResponse.data);
      } catch (error) {
        // 忽略错误，插件可能还没有完全安装
      }
    }

    return response;
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.client.delete(`/plugins/${pluginId}`);

    if (response.data.success) {
      this.client.emit('pluginUnloaded', pluginId);
    }

    return response;
  }

  /**
   * 更新插件
   */
  async updatePlugin(pluginId: string, targetVersion?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.client.put(`/plugins/${pluginId}/update`, {
      targetVersion
    });

    if (response.data.success) {
      // 重新获取插件详情并触发事件
      try {
        const pluginResponse = await this.getPlugin(pluginId);
        this.client.emit('pluginLoaded', pluginResponse.data);
      } catch (error) {
        // 忽略错误
      }
    }

    return response;
  }

  /**
   * 获取已安装的插件
   */
  async getInstalledPlugins(): Promise<ApiResponse<Plugin[]>> {
    return this.client.get<Plugin[]>('/plugins/installed');
  }

  /**
   * 获取插件统计信息
   */
  async getPluginStats(pluginId: string): Promise<ApiResponse<{
    downloads: number;
    rating: number;
    reviewCount: number;
    lastUpdated: Date;
  }>> {
    return this.client.get(`/plugins/${pluginId}/stats`);
  }

  /**
   * 给插件评分
   */
  async ratePlugin(pluginId: string, rating: number, review?: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post(`/plugins/${pluginId}/rate`, {
      rating,
      review
    });
  }

  /**
   * 获取插件的评论
   */
  async getPluginReviews(pluginId: string, params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'oldest' | 'rating';
  }): Promise<ApiResponse<any[]>> {
    return this.client.get(`/plugins/${pluginId}/reviews`, params);
  }

  /**
   * 报告插件问题
   */
  async reportPluginIssue(pluginId: string, issue: {
    type: 'bug' | 'feature' | 'security' | 'other';
    title: string;
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<ApiResponse<{ issueId: string; message: string }>> {
    return this.client.post(`/plugins/${pluginId}/issues`, issue);
  }

  /**
   * 获取插件依赖关系
   */
  async getPluginDependencies(pluginId: string): Promise<ApiResponse<{
    dependencies: string[];
    dependents: string[];
  }>> {
    return this.client.get(`/plugins/${pluginId}/dependencies`);
  }

  /**
   * 验证插件兼容性
   */
  async checkPluginCompatibility(pluginId: string, targetVersion?: string): Promise<ApiResponse<{
    compatible: boolean;
    issues?: string[];
    recommendations?: string[];
  }>> {
    return this.client.get(`/plugins/${pluginId}/compatibility`, {
      targetVersion
    });
  }
}
