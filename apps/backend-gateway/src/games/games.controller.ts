// 文件路径: apps/backend-gateway/src/games/games.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { User } from '@prisma/client'
// [修正] 从 narrative-domain 导入游戏相关的 DTO 和 schema
import type {
  CreateNarrativeGameDto,
  SubmitActionDto,
  UpdateCharacterDto,
} from '@tuheg/narrative-domain'
// [核心修正] 从 narrative-domain 导入游戏相关的 schema，从 infrastructure 导入管道
import {
  createNarrativeGameSchema,
  submitActionSchema,
  updateCharacterSchema,
} from '@tuheg/narrative-domain'
import { ZodValidationPipe } from '@tuheg/infrastructure'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { GamesService } from './games.service'

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  public async findAllForUser(@Req() req: Request) {
    const user = req.user as User
    return this.gamesService.findAllForUser(user.id)
  }

  @Post('narrative-driven')
  public async createNarrative(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createNarrativeGameSchema))
    dto: CreateNarrativeGameDto
  ) {
    const user = req.user as User
    return this.gamesService.createNarrativeDriven(user.id, dto)
  }

  @Post(':id/actions')
  @HttpCode(HttpStatus.ACCEPTED)
  public async submitAction(
    @Req() req: Request,
    @Param('id') gameId: string,
    // [核心修正] 使用从 @tuheg/common-backend 导入的 schema 和 DTO
    @Body(new ZodValidationPipe(submitActionSchema)) dto: SubmitActionDto
  ): Promise<void> {
    const user = req.user as User
    await this.gamesService.submitAction(user.id, gameId, dto)
  }

  @Get(':id')
  public async findOne(@Req() req: Request, @Param('id') gameId: string) {
    const user = req.user as User
    return this.gamesService.findOne(user.id, gameId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  public async delete(@Req() req: Request, @Param('id') gameId: string) {
    const user = req.user as User
    return this.gamesService.delete(user.id, gameId)
  }

  @Patch(':id/character')
  @HttpCode(HttpStatus.OK)
  public async updateCharacter(
    @Req() req: Request,
    @Param('id') gameId: string,
    @Body(new ZodValidationPipe(updateCharacterSchema))
    dto: UpdateCharacterDto
  ) {
    const user = req.user as User
    return this.gamesService.updateCharacterState(user.id, gameId, dto)
  }
}
