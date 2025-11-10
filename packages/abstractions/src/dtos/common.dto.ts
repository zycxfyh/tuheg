/**
 * 分页请求DTO
 */
export class PaginationDto {
  /** 页码 (从1开始) */
  page: number = 1;

  /** 每页数量 */
  limit: number = 10;

  /** 排序字段 */
  sortBy?: string;

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 分页响应DTO
 */
export class PaginatedResponseDto<T> {
  /** 数据列表 */
  data: T[];

  /** 分页信息 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  /** 元信息 */
  meta?: Record<string, any>;
}

/**
 * API响应DTO
 */
export class ApiResponseDto<T = any> {
  /** 是否成功 */
  success: boolean;

  /** 响应数据 */
  data?: T;

  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** 元信息 */
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

/**
 * 错误响应DTO
 */
export class ErrorResponseDto {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误详情 */
  details?: any;

  /** 时间戳 */
  timestamp: Date;

  /** 请求ID */
  requestId?: string;

  /** 堆栈跟踪 (仅开发环境) */
  stack?: string;
}

/**
 * 成功响应DTO
 */
export class SuccessResponseDto<T = any> extends ApiResponseDto<T> {
  constructor(data: T, meta?: ApiResponseDto['meta']) {
    super();
    this.success = true;
    this.data = data;
    this.meta = meta;
  }
}

/**
 * 验证错误详情
 */
export class ValidationErrorDetail {
  /** 字段名 */
  field: string;

  /** 错误消息 */
  message: string;

  /** 字段值 */
  value?: any;

  /** 约束 */
  constraints?: Record<string, string>;
}

/**
 * 验证错误响应DTO
 */
export class ValidationErrorResponseDto extends ErrorResponseDto {
  /** 验证错误列表 */
  errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[], requestId?: string) {
    super();
    this.code = 'VALIDATION_ERROR';
    this.message = 'Validation failed';
    this.errors = errors;
    this.timestamp = new Date();
    this.requestId = requestId;
  }
}

/**
 * 文件上传DTO
 */
export class FileUploadDto {
  /** 文件 */
  file: Express.Multer.File;

  /** 文件名 */
  filename?: string;

  /** 文件描述 */
  description?: string;

  /** 文件标签 */
  tags?: string[];
}

/**
 * 文件信息DTO
 */
export class FileInfoDto {
  /** 文件ID */
  id: string;

  /** 文件名 */
  filename: string;

  /** 原始文件名 */
  originalName: string;

  /** MIME类型 */
  mimeType: string;

  /** 文件大小 */
  size: number;

  /** 文件URL */
  url: string;

  /** 上传时间 */
  uploadedAt: Date;

  /** 上传者 */
  uploadedBy?: string;

  /** 文件标签 */
  tags?: string[];

  /** 文件描述 */
  description?: string;
}

/**
 * 搜索请求DTO
 */
export class SearchRequestDto {
  /** 搜索查询 */
  query: string;

  /** 搜索字段 */
  fields?: string[];

  /** 过滤条件 */
  filters?: Record<string, any>;

  /** 搜索选项 */
  options?: {
    fuzzy?: boolean;
    caseSensitive?: boolean;
    wholeWords?: boolean;
  };
}

/**
 * 搜索结果DTO
 */
export class SearchResultDto<T = any> {
  /** 搜索结果 */
  items: T[];

  /** 总结果数 */
  total: number;

  /** 高亮片段 */
  highlights?: Record<string, string[]>;

  /** 搜索耗时 */
  took: number;

  /** 建议查询 */
  suggestions?: string[];
}

/**
 * 批量操作请求DTO
 */
export class BatchOperationDto<T = any> {
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete' | 'upsert';

  /** 操作数据 */
  data: T[];

  /** 操作选项 */
  options?: {
    continueOnError?: boolean;
    batchSize?: number;
    atomic?: boolean;
  };
}

/**
 * 批量操作响应DTO
 */
export class BatchOperationResponseDto {
  /** 成功操作数 */
  successful: number;

  /** 失败操作数 */
  failed: number;

  /** 总操作数 */
  total: number;

  /** 错误详情 */
  errors?: Array<{
    index: number;
    error: string;
    data?: any;
  }>;

  /** 耗时 */
  took: number;
}

/**
 * 统计信息DTO
 */
export class StatisticsDto {
  /** 统计时间范围 */
  period: {
    start: Date;
    end: Date;
  };

  /** 统计指标 */
  metrics: Record<string, {
    value: number;
    change?: number;
    changePercent?: number;
  }>;

  /** 趋势数据 */
  trends?: Array<{
    timestamp: Date;
    metrics: Record<string, number>;
  }>;
}

/**
 * 健康检查响应DTO
 */
export class HealthCheckDto {
  /** 服务状态 */
  status: 'healthy' | 'unhealthy' | 'degraded';

  /** 检查时间戳 */
  timestamp: Date;

  /** 版本信息 */
  version: string;

  /** 各组件状态 */
  checks: Record<string, {
    status: 'healthy' | 'unhealthy';
    message?: string;
    responseTime?: number;
    details?: any;
  }>;

  /** 系统信息 */
  system?: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}
