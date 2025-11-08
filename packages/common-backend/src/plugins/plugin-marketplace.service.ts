import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PluginMarketplace,
  PluginVersion,
  PluginCategory,
  PluginStatus,
  Prisma
} from '@prisma/client';
import {
  CreatePluginDto,
  UpdatePluginDto,
  ReviewPluginDto,
  SearchPluginsDto,
  CreatePluginCategoryDto,
  UpdatePluginCategoryDto,
  CreatePluginTagDto
} from '../dto/plugin-marketplace.dto';

@Injectable()
export class PluginMarketplaceService {
  constructor(private prisma: PrismaService) {}

  // ==================== 插件市场核心功能 ====================

  /**
   * 创建新插件
   */
  async createPlugin(authorId: string, data: CreatePluginDto): Promise<PluginMarketplace> {
    // 检查分类是否存在
    const category = await this.prisma.pluginCategory.findUnique({
      where: { id: data.categoryId }
    });
    if (!category) {
      throw new BadRequestException('Plugin category not found');
    }

    // 检查插件名称是否已被使用
    const existingPlugin = await this.prisma.pluginMarketplace.findUnique({
      where: { name: data.name }
    });
    if (existingPlugin) {
      throw new BadRequestException('Plugin name already exists');
    }

    // 检查标签是否存在
    if (data.tags && data.tags.length > 0) {
      const tagCount = await this.prisma.pluginTag.count({
        where: { id: { in: data.tags } }
      });
      if (tagCount !== data.tags.length) {
        throw new BadRequestException('One or more tags not found');
      }
    }

    // 创建插件和初始版本
    const plugin = await this.prisma.pluginMarketplace.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        authorId,
        categoryId: data.categoryId,
        homepage: data.homepage,
        repository: data.repository,
        license: data.license,
        tags: data.tags ? {
          connect: data.tags.map(id => ({ id }))
        } : undefined,
        versions: {
          create: {
            version: data.version.version,
            changelog: data.version.changelog,
            downloadUrl: data.version.downloadUrl,
            fileSize: data.version.fileSize,
            checksum: data.version.checksum,
            minVersion: data.version.minVersion,
            maxVersion: data.version.maxVersion,
            isStable: data.version.isStable,
          }
        },
        dependencies: data.dependencies ? {
          create: data.dependencies.map(dep => ({
            dependencyId: dep.pluginId,
            minVersion: dep.minVersion,
            maxVersion: dep.maxVersion,
            isRequired: dep.isRequired,
          }))
        } : undefined,
      },
      include: {
        author: {
          select: { id: true, email: true }
        },
        category: true,
        tags: true,
        versions: true,
        dependencies: {
          include: {
            dependency: {
              select: { id: true, name: true, displayName: true }
            }
          }
        }
      }
    });

    return plugin;
  }

  /**
   * 获取插件详情
   */
  async getPlugin(id: string, includeVersions = false): Promise<PluginMarketplace> {
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, email: true }
        },
        category: true,
        tags: true,
        versions: includeVersions,
        reviews: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        dependencies: {
          include: {
            dependency: {
              select: { id: true, name: true, displayName: true }
            }
          }
        },
        _count: {
          select: {
            downloads: true,
            reviews: true
          }
        }
      }
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }

  /**
   * 更新插件信息
   */
  async updatePlugin(id: string, authorId: string, data: UpdatePluginDto): Promise<PluginMarketplace> {
    // 检查插件是否存在且用户有权限
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    if (plugin.authorId !== authorId) {
      throw new ForbiddenException('You do not have permission to update this plugin');
    }

    // 检查分类是否存在
    if (data.categoryId) {
      const category = await this.prisma.pluginCategory.findUnique({
        where: { id: data.categoryId }
      });
      if (!category) {
        throw new BadRequestException('Plugin category not found');
      }
    }

    // 检查标签是否存在
    if (data.tags && data.tags.length > 0) {
      const tagCount = await this.prisma.pluginTag.count({
        where: { id: { in: data.tags } }
      });
      if (tagCount !== data.tags.length) {
        throw new BadRequestException('One or more tags not found');
      }
    }

    // 更新插件
    const updatedPlugin = await this.prisma.pluginMarketplace.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
        categoryId: data.categoryId,
        homepage: data.homepage,
        repository: data.repository,
        license: data.license,
        updatedAt: new Date(),
        tags: data.tags ? {
          set: data.tags.map(id => ({ id }))
        } : undefined,
        dependencies: data.dependencies ? {
          deleteMany: {}, // 删除所有现有依赖
          create: data.dependencies.map(dep => ({
            dependencyId: dep.pluginId,
            minVersion: dep.minVersion,
            maxVersion: dep.maxVersion,
            isRequired: dep.isRequired,
          }))
        } : undefined,
      },
      include: {
        author: {
          select: { id: true, email: true }
        },
        category: true,
        tags: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return updatedPlugin;
  }

  /**
   * 删除插件
   */
  async deletePlugin(id: string, authorId: string): Promise<void> {
    // 检查插件是否存在且用户有权限
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id },
      select: { authorId: true, status: true }
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    if (plugin.authorId !== authorId) {
      throw new ForbiddenException('You do not have permission to delete this plugin');
    }

    // 软删除：将状态设置为DEPRECATED
    await this.prisma.pluginMarketplace.update({
      where: { id },
      data: {
        status: PluginStatus.DEPRECATED,
        updatedAt: new Date()
      }
    });
  }

  /**
   * 审核插件
   */
  async reviewPlugin(id: string, reviewerId: string, data: ReviewPluginDto): Promise<PluginMarketplace> {
    // 检查插件是否存在
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    // 更新插件状态
    const updatedPlugin = await this.prisma.pluginMarketplace.update({
      where: { id },
      data: {
        status: data.status,
        isPublic: data.status === PluginStatus.APPROVED,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, email: true }
        },
        category: true,
        tags: true
      }
    });

    // TODO: 发送通知给插件作者

    return updatedPlugin;
  }

  /**
   * 搜索和过滤插件
   */
  async searchPlugins(params: SearchPluginsDto): Promise<{
    plugins: PluginMarketplace[];
    total: number;
    hasMore: boolean;
  }> {
    const where: Prisma.PluginMarketplaceWhereInput = {
      status: params.status || PluginStatus.APPROVED,
      isPublic: true,
    };

    // 搜索关键词
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { displayName: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // 分类过滤
    if (params.category) {
      where.categoryId = params.category;
    }

    // 作者过滤
    if (params.author) {
      where.authorId = params.author;
    }

    // 标签过滤
    if (params.tags && params.tags.length > 0) {
      where.tags = {
        some: {
          name: { in: params.tags }
        }
      };
    }

    // 精选过滤
    if (params.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    // 评分过滤
    if (params.minRating) {
      where.averageRating = {
        gte: params.minRating
      };
    }

    // 排序
    const orderBy: Prisma.PluginMarketplaceOrderByWithRelationInput = {};
    switch (params.sortBy) {
      case 'name':
        orderBy.name = params.sortOrder;
        break;
      case 'downloads':
        orderBy.totalDownloads = params.sortOrder;
        break;
      case 'rating':
        orderBy.averageRating = params.sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = params.sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = params.sortOrder;
        break;
      default:
        orderBy.totalDownloads = 'desc';
    }

    // 查询插件
    const [plugins, total] = await Promise.all([
      this.prisma.pluginMarketplace.findMany({
        where,
        include: {
          author: {
            select: { id: true, email: true }
          },
          category: true,
          tags: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              downloads: true,
              reviews: true
            }
          }
        },
        orderBy,
        skip: params.offset,
        take: params.limit + 1, // 多取一条来判断是否有更多
      }),
      this.prisma.pluginMarketplace.count({ where })
    ]);

    const hasMore = plugins.length > params.limit;
    const resultPlugins = hasMore ? plugins.slice(0, -1) : plugins;

    return {
      plugins: resultPlugins,
      total,
      hasMore
    };
  }

  /**
   * 获取用户发布的插件
   */
  async getUserPlugins(userId: string, status?: PluginStatus): Promise<PluginMarketplace[]> {
    const where: Prisma.PluginMarketplaceWhereInput = {
      authorId: userId
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.pluginMarketplace.findMany({
      where,
      include: {
        category: true,
        tags: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            downloads: true,
            reviews: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // ==================== 插件分类管理 ====================

  /**
   * 创建插件分类
   */
  async createCategory(data: CreatePluginCategoryDto): Promise<PluginCategory> {
    // 检查分类名称是否已被使用
    const existingCategory = await this.prisma.pluginCategory.findUnique({
      where: { name: data.name }
    });

    if (existingCategory) {
      throw new BadRequestException('Category name already exists');
    }

    return this.prisma.pluginCategory.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        sortOrder: data.sortOrder,
      }
    });
  }

  /**
   * 获取所有插件分类
   */
  async getCategories(activeOnly = true): Promise<PluginCategory[]> {
    return this.prisma.pluginCategory.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            plugins: {
              where: { status: PluginStatus.APPROVED, isPublic: true }
            }
          }
        }
      }
    });
  }

  /**
   * 更新插件分类
   */
  async updateCategory(id: string, data: UpdatePluginCategoryDto): Promise<PluginCategory> {
    return this.prisma.pluginCategory.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }
    });
  }

  /**
   * 删除插件分类
   */
  async deleteCategory(id: string): Promise<void> {
    // 检查是否有插件使用此分类
    const pluginCount = await this.prisma.pluginMarketplace.count({
      where: { categoryId: id }
    });

    if (pluginCount > 0) {
      throw new BadRequestException('Cannot delete category that has plugins');
    }

    await this.prisma.pluginCategory.delete({
      where: { id }
    });
  }

  // ==================== 插件标签管理 ====================

  /**
   * 创建插件标签
   */
  async createTag(data: CreatePluginTagDto) {
    // 检查标签名称是否已被使用
    const existingTag = await this.prisma.pluginTag.findUnique({
      where: { name: data.name }
    });

    if (existingTag) {
      throw new BadRequestException('Tag name already exists');
    }

    return this.prisma.pluginTag.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        color: data.color,
      }
    });
  }

  /**
   * 获取所有插件标签
   */
  async getTags(activeOnly = true) {
    return this.prisma.pluginTag.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { usageCount: 'desc' }
    });
  }

  /**
   * 删除插件标签
   */
  async deleteTag(id: string): Promise<void> {
    // 检查是否有插件使用此标签
    const pluginCount = await this.prisma.pluginMarketplace.count({
      where: {
        tags: {
          some: { id }
        }
      }
    });

    if (pluginCount > 0) {
      throw new BadRequestException('Cannot delete tag that is being used by plugins');
    }

    await this.prisma.pluginTag.delete({
      where: { id }
    });
  }
}
