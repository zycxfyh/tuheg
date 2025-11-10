import { PrismaClient } from '@prisma/client';

/**
 * 基础Repository类
 * 提供通用的数据库操作方法
 */
export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  /**
   * 执行事务
   */
  protected async executeTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      return await fn(tx as PrismaClient);
    });
  }

  /**
   * 软删除支持
   */
  protected getSoftDeleteFilter() {
    return {
      deletedAt: null,
    };
  }

  /**
   * 分页查询
   */
  protected getPaginationOptions(page: number = 1, limit: number = 10) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  /**
   * 排序选项
   */
  protected getOrderByOptions(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return undefined;
    return {
      [sortBy]: sortOrder,
    };
  }
}
