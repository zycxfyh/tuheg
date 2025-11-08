import { VCPToolBoxClient } from '@tuheg/vcptoolbox-sdk';

class PluginMarketplaceApi {
  constructor(private client: VCPToolBoxClient) {}

  // ==================== 插件查询 ====================

  /**
   * 搜索插件
   */
  async searchPlugins(params: {
    q?: string;
    category?: string;
    tags?: string[];
    author?: string;
    status?: string;
    isFeatured?: boolean;
    minRating?: number;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.client.get('/plugins/marketplace', params);
  }

  /**
   * 获取插件详情
   */
  async getPlugin(id: string) {
    return this.client.get(`/plugins/marketplace/${id}`);
  }

  /**
   * 获取插件分类
   */
  async getCategories() {
    return this.client.get('/plugins/marketplace/categories/all');
  }

  /**
   * 获取插件标签
   */
  async getTags() {
    return this.client.get('/plugins/marketplace/tags/all');
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string) {
    return this.client.get('/plugins/marketplace/search/suggestions', { q: query });
  }

  /**
   * 获取相关插件推荐
   */
  async getRelatedPlugins(pluginId: string, limit: number = 6) {
    return this.client.get(`/plugins/marketplace/${pluginId}/related`, { limit });
  }

  /**
   * 获取热门插件
   */
  async getTrendingPlugins(limit: number = 10) {
    return this.client.get('/plugins/marketplace/statistics/trending', { limit });
  }

  /**
   * 获取精选插件
   */
  async getFeaturedPlugins(limit: number = 10) {
    return this.client.get('/plugins/marketplace/statistics/featured', { limit });
  }

  // ==================== 插件管理 ====================

  /**
   * 创建新插件
   */
  async createPlugin(pluginData: any) {
    return this.client.post('/plugins/marketplace', pluginData);
  }

  /**
   * 更新插件信息
   */
  async updatePlugin(id: string, updateData: any) {
    return this.client.put(`/plugins/marketplace/${id}`, updateData);
  }

  /**
   * 删除插件
   */
  async deletePlugin(id: string) {
    return this.client.delete(`/plugins/marketplace/${id}`);
  }

  /**
   * 上传插件文件
   */
  async uploadPluginFile(pluginId: string, file: File, versionData: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', versionData.version);
    if (versionData.changelog) {
      formData.append('changelog', versionData.changelog);
    }

    return this.client.post(`/plugins/marketplace/${pluginId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * 下载插件
   */
  async downloadPlugin(pluginId: string, version?: string) {
    return this.client.post(`/plugins/marketplace/${pluginId}/download`, {
      version
    });
  }

  // ==================== 插件评价 ====================

  /**
   * 获取插件评价列表
   */
  async getPluginReviews(pluginId: string, params: any = {}) {
    return this.client.get(`/plugins/marketplace/${pluginId}/reviews`, params);
  }

  /**
   * 创建插件评价
   */
  async createReview(pluginId: string, reviewData: any) {
    return this.client.post(`/plugins/marketplace/${pluginId}/reviews`, reviewData);
  }

  /**
   * 更新插件评价
   */
  async updateReview(pluginId: string, reviewId: string, reviewData: any) {
    return this.client.put(`/plugins/marketplace/${pluginId}/reviews/${reviewId}`, reviewData);
  }

  /**
   * 删除插件评价
   */
  async deleteReview(pluginId: string, reviewId: string) {
    return this.client.delete(`/plugins/marketplace/${pluginId}/reviews/${reviewId}`);
  }

  /**
   * 评价投票（有帮助/没帮助）
   */
  async voteReviewHelpful(reviewId: string, helpful: boolean) {
    return this.client.post(`/plugins/marketplace/${reviewId}/reviews/helpful`, { helpful });
  }

  // ==================== 插件统计 ====================

  /**
   * 获取插件统计信息
   */
  async getPluginStatistics(pluginId: string, params: any = {}) {
    return this.client.get(`/plugins/marketplace/${pluginId}/statistics`, params);
  }

  /**
   * 获取插件市场整体统计
   */
  async getMarketStatistics(params: any = {}) {
    return this.client.get('/plugins/marketplace/statistics/market-overview', params);
  }

  // ==================== 管理员功能 ====================

  /**
   * 审核插件（管理员）
   */
  async reviewPlugin(id: string, reviewData: any) {
    return this.client.put(`/plugins/marketplace/${id}/review`, reviewData);
  }

  /**
   * 获取待审核插件列表（管理员）
   */
  async getPendingPlugins() {
    return this.client.get('/plugins/marketplace/admin/pending-review');
  }

  /**
   * 创建插件分类（管理员）
   */
  async createCategory(categoryData: any) {
    return this.client.post('/plugins/marketplace/categories', categoryData);
  }

  /**
   * 更新插件分类（管理员）
   */
  async updateCategory(id: string, categoryData: any) {
    return this.client.put(`/plugins/marketplace/categories/${id}`, categoryData);
  }

  /**
   * 删除插件分类（管理员）
   */
  async deleteCategory(id: string) {
    return this.client.delete(`/plugins/marketplace/categories/${id}`);
  }

  /**
   * 创建插件标签（管理员）
   */
  async createTag(tagData: any) {
    return this.client.post('/plugins/marketplace/tags', tagData);
  }

  /**
   * 删除插件标签（管理员）
   */
  async deleteTag(id: string) {
    return this.client.delete(`/plugins/marketplace/tags/${id}`);
  }

  // ==================== 用户插件管理 ====================

  /**
   * 获取当前用户的插件
   */
  async getUserPlugins(status?: string) {
    return this.client.get('/plugins/marketplace/user/my-plugins', { status });
  }

  /**
   * 获取指定用户的公开插件
   */
  async getUserPublicPlugins(userId: string) {
    return this.client.get(`/plugins/marketplace/user/${userId}/plugins`);
  }
}

// 创建单例实例
let pluginMarketplaceApi: PluginMarketplaceApi;

export function createPluginMarketplaceApi(client: VCPToolBoxClient) {
  pluginMarketplaceApi = new PluginMarketplaceApi(client);
  return pluginMarketplaceApi;
}

export { pluginMarketplaceApi };
export default PluginMarketplaceApi;
