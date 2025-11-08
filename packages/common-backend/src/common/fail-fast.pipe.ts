import {
  BadRequestException,
  Injectable,
  Logger,
  type PipeTransform,
  ValidationPipe,
} from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'

/**
 * 快速失败验证管道
 * 严格验证输入数据，立即报告验证错误
 */
@Injectable()
export class FailFastValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(FailFastValidationPipe.name)

  async transform(value: any, { metatype, type, data }: any) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }

    // 转换到类实例
    const object = plainToClass(metatype, value)
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
    })

    if (errors.length > 0) {
      // 构建详细的错误信息
      const errorMessages = this.buildErrorMessages(errors)

      this.logger.error(`❌ Validation failed for ${metatype.name}`, {
        field: data,
        type,
        errors: errorMessages,
        input: value,
        timestamp: new Date().toISOString(),
      })

      // 在测试环境中，抛出详细错误
      if (process.env.NODE_ENV === 'test') {
        throw new Error(`Validation failed for ${metatype.name}: ${errorMessages.join(', ')}`)
      }

      // 在开发环境中，也抛出详细错误
      if (process.env.NODE_ENV === 'development') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
          field: data,
          receivedType: typeof value,
          expectedType: metatype.name,
        })
      }

      // 在生产环境中，返回标准错误
      throw new BadRequestException('Invalid input data')
    }

    return object
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }

  private buildErrorMessages(errors: any[]): string[] {
    const messages: string[] = []

    for (const error of errors) {
      if (error.constraints) {
        for (const constraint in error.constraints) {
          messages.push(`${error.property}: ${error.constraints[constraint]}`)
        }
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.buildErrorMessages(error.children))
      }
    }

    return messages
  }
}

/**
 * 严格的验证管道配置
 * 用于NestJS应用的全局配置
 */
export const strictValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  validationError: {
    target: false,
    value: false,
  },
  exceptionFactory: (errors) => {
    const logger = new Logger('ValidationPipe')

    // 记录详细的验证错误
    logger.error('❌ Strict validation failed', {
      errors: errors.map((error) => ({
        target: error.target?.constructor?.name,
        property: error.property,
        value: error.value,
        constraints: error.constraints,
      })),
      timestamp: new Date().toISOString(),
    })

    // 在测试环境中，立即失败
    if (process.env.NODE_ENV === 'test') {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
    }

    return new BadRequestException({
      message: 'Validation failed',
      errors: errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', '),
      })),
    })
  },
})
