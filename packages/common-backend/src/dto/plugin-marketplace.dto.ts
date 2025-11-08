import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { PluginStatus } from '@prisma/client'

// 插件状态枚举
export const PluginStatusEnum = z.enum([
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'DEPRECATED',
])

// 插件分类创建DTO
export class CreatePluginCategoryDto extends createZodDto(
  z.object({
    name: z.string().min(1).max(50),
    displayName: z.string().min(1).max(100),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    sortOrder: z.number().int().min(0).default(0),
  })
) {}

// 插件分类更新DTO
export class UpdatePluginCategoryDto extends createZodDto(
  z.object({
    displayName: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
) {}

// 插件标签创建DTO
export class CreatePluginTagDto extends createZodDto(
  z.object({
    name: z.string().min(1).max(50),
    displayName: z.string().min(1).max(100),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
) {}

// 插件版本创建DTO
export class CreatePluginVersionDto extends createZodDto(
  z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/), // 语义化版本
    changelog: z.string().optional(),
    downloadUrl: z.string().url(),
    fileSize: z.number().int().min(0),
    checksum: z.string().optional(),
    minVersion: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .optional(),
    maxVersion: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .optional(),
    isStable: z.boolean().default(true),
  })
) {}

// 插件创建DTO
export class CreatePluginDto extends createZodDto(
  z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/), // 只能包含小写字母、数字和连字符
    displayName: z.string().min(1).max(200),
    description: z.string().min(10).max(5000),
    categoryId: z.string().cuid(),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    license: z.string().optional(),
    tags: z.array(z.string().cuid()).max(10).optional(), // 最多10个标签
    dependencies: z
      .array(
        z.object({
          pluginId: z.string().cuid(),
          minVersion: z
            .string()
            .regex(/^\d+\.\d+\.\d+$/)
            .optional(),
          maxVersion: z
            .string()
            .regex(/^\d+\.\d+\.\d+$/)
            .optional(),
          isRequired: z.boolean().default(true),
        })
      )
      .max(20)
      .optional(), // 最多20个依赖
    version: z.object({
      version: z.string().regex(/^\d+\.\d+\.\d+$/),
      changelog: z.string().optional(),
      fileSize: z.number().int().min(0),
      checksum: z.string().optional(),
      minVersion: z
        .string()
        .regex(/^\d+\.\d+\.\d+$/)
        .optional(),
      maxVersion: z
        .string()
        .regex(/^\d+\.\d+\.\d+$/)
        .optional(),
      isStable: z.boolean().default(true),
    }),
  })
) {}

// 插件更新DTO
export class UpdatePluginDto extends createZodDto(
  z.object({
    displayName: z.string().min(1).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    categoryId: z.string().cuid().optional(),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    license: z.string().optional(),
    tags: z.array(z.string().cuid()).max(10).optional(),
    dependencies: z
      .array(
        z.object({
          pluginId: z.string().cuid(),
          minVersion: z
            .string()
            .regex(/^\d+\.\d+\.\d+$/)
            .optional(),
          maxVersion: z
            .string()
            .regex(/^\d+\.\d+\.\d+$/)
            .optional(),
          isRequired: z.boolean().default(true),
        })
      )
      .max(20)
      .optional(),
  })
) {}

// 插件审核DTO
export class ReviewPluginDto extends createZodDto(
  z.object({
    status: PluginStatusEnum,
    reviewNotes: z.string().max(1000).optional(),
  })
) {}

// 插件搜索DTO
export class SearchPluginsDto extends createZodDto(
  z.object({
    q: z.string().optional(), // 搜索关键词
    category: z.string().cuid().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().cuid().optional(),
    status: PluginStatusEnum.optional(),
    isFeatured: z.boolean().optional(),
    minRating: z.number().min(1).max(5).optional(),
    sortBy: z.enum(['name', 'downloads', 'rating', 'createdAt', 'updatedAt']).default('downloads'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  })
) {}

// 插件评价创建DTO
export class CreatePluginReviewDto extends createZodDto(
  z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(10).max(2000),
  })
) {}

// 插件评价更新DTO
export class UpdatePluginReviewDto extends createZodDto(
  z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(10).max(2000).optional(),
  })
) {}

// 插件下载DTO
export class DownloadPluginDto extends createZodDto(
  z.object({
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .optional(), // 指定版本，不指定则下载最新版本
  })
) {}

// 插件统计DTO
export class PluginStatisticsDto extends createZodDto(
  z.object({
    period: z.enum(['day', 'week', 'month', 'year', 'all']).default('month'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
) {}
