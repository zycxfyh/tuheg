// 文件路径: apps/logic-agent/src/rule-engine.service.ts (已修复 unknown 类型)

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  CharacterUpdate,
  DirectiveSet,
  NumericOperation,
  PrismaService,
  StateChangeDirective,
  StringOperation,
} from '@tuheg/common-backend'

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async execute(gameId: string, directives: DirectiveSet): Promise<void> {
    if (!directives || directives.length === 0) {
      this.logger.warn(`RuleEngine executed with an empty directive set for game ${gameId}.`)
      return
    }

    // [安全修复] 在执行指令前进行业务规则验证
    this.validateDirectives(directives)

    try {
      await this.prisma.$transaction(async (tx) => {
        const transactionClient = tx as Prisma.TransactionClient

        for (const directive of directives) {
          if (directive.op === 'update_character') {
            await this.handleUpdateCharacter(transactionClient, gameId, directive)
          } else {
            throw new BadRequestException(`Unknown directive operation: ${directive.op}`)
          }
        }
      })

      this.logger.log(`Successfully executed ${directives.length} directives for game ${gameId}.`)
    } catch (error: unknown) {
      // <-- [核心修正] 明确 error 类型为 unknown
      // 如果是BadRequestException，直接重新抛出
      if (error instanceof BadRequestException) {
        throw error
      }

      const errorMessage = error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : 'Unknown database error'
      this.logger.error(
        `Transaction failed during rule execution for game ${gameId}`,
        error instanceof Error ? error.stack : error
      )
      throw new InternalServerErrorException(`Rule engine transaction failed: ${errorMessage}`)
    }
  }

  private async handleUpdateCharacter(
    tx: Prisma.TransactionClient,
    gameId: string,
    directive: StateChangeDirective
  ) {
    const character = await tx.character.findUniqueOrThrow({
      where: { gameId },
    })
    const payload = directive.payload as CharacterUpdate
    const updates: Prisma.CharacterUpdateInput = {}

    if (payload.hp) {
      updates.hp = this.applyNumericOperation(character.hp, payload.hp)
    }
    if (payload.mp) {
      updates.mp = this.applyNumericOperation(character.mp, payload.mp)
    }
    if (payload.status) {
      updates.status = this.applyStringOperation(character.status, payload.status)
    }

    if (Object.keys(updates).length > 0) {
      await tx.character.update({ where: { gameId }, data: updates })
    }
  }

  private applyNumericOperation(currentValue: number, op: NumericOperation): number {
    switch (op.op) {
      case 'set':
        return op.value
      case 'increment':
        return currentValue + op.value
      case 'decrement':
        return currentValue - op.value
    }
  }

  private applyStringOperation(currentValue: string, op: StringOperation): string {
    switch (op.op) {
      case 'set':
        return op.value
      case 'append':
        return currentValue + op.value
      case 'prepend':
        return op.value + currentValue
    }
  }

  /**
   * [安全修复] 验证指令集中的业务规则
   * 防止AI生成恶意或不合理的状态变更
   */
  private validateDirectives(directives: DirectiveSet): void {
    for (const directive of directives) {
      if (directive.op === 'update_character') {
        this.validateCharacterUpdate(directive.payload as CharacterUpdate)
      }
      // 可以在这里添加其他操作类型的验证
    }
  }

  /**
   * [安全修复] 验证角色更新指令的业务规则
   */
  private validateCharacterUpdate(payload: CharacterUpdate): void {
    // HP验证：不能为负数，且单次操作不能超过合理范围
    if (payload.hp) {
      this.validateNumericOperation(payload.hp, 'HP', -1000, 1000)
    }

    // MP验证：不能为负数，且单次操作不能超过合理范围
    if (payload.mp) {
      this.validateNumericOperation(payload.mp, 'MP', -1000, 1000)
    }

    // 状态字符串验证：长度限制，防止注入攻击
    if (payload.status) {
      this.validateStringOperation(payload.status, 'status', 500)
    }
  }

  /**
   * [安全修复] 验证数值操作的业务规则
   */
  private validateNumericOperation(
    op: NumericOperation,
    fieldName: string,
    minValue: number,
    maxValue: number
  ): void {
    // 检查操作值是否在合理范围内
    if (op.value < minValue || op.value > maxValue) {
      throw new BadRequestException(
        `${fieldName} operation value ${op.value} is outside allowed range [${minValue}, ${maxValue}]`
      )
    }

    // 对于set操作，检查是否会导致无效状态
    if (op.op === 'set' && op.value < 0) {
      throw new BadRequestException(`${fieldName} cannot be set to negative value: ${op.value}`)
    }
  }

  /**
   * [安全修复] 验证字符串操作的业务规则
   */
  private validateStringOperation(op: StringOperation, fieldName: string, maxLength: number): void {
    // 检查字符串长度是否超过限制
    if (op.value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} value is too long: ${op.value.length} characters (max: ${maxLength})`
      )
    }

    // 检查是否包含潜在的恶意内容（基础检查）
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(op.value)) {
        throw new BadRequestException(
          `${fieldName} contains potentially malicious content: ${op.value.substring(0, 50)}...`
        )
      }
    }
  }
}
