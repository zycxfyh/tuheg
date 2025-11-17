import { Resolver, Query, Mutation, Args, ID, Int, Context, Field, InputType, ObjectType } from '@nestjs/graphql'
import { GameService } from '../../games/game.service'
import { UseGuards } from '@nestjs/common'
import { TenantGuard, RequiresTenant } from '../../multi-tenant/tenant.guard'
import type { TenantRequest } from '../../multi-tenant/tenant.middleware'
import { GraphQLJSONObject } from 'graphql-type-json'

@ObjectType()
export class Game {
  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field()
  description?: string

  @Field()
  ownerId: string

  @Field(() => User)
  owner: User

  @Field(() => [Character])
  characters: Character[]

  @Field(() => [WorldBookEntry])
  worldBook: WorldBookEntry[]

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}

@ObjectType()
export class Character {
  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field()
  description: string

  @Field(() => GraphQLJSONObject)
  stats?: any

  @Field(() => [GraphQLJSONObject])
  inventory?: any[]

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}

@ObjectType()
export class WorldBookEntry {
  @Field(() => ID)
  id: string

  @Field()
  title: string

  @Field()
  content: string

  @Field()
  category?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  @Field()
  name?: string

  @Field()
  createdAt: Date
}

@Resolver(() => Game)
@UseGuards(TenantGuard)
export class GameResolver {
  constructor(private readonly gameService: GameService) {}

  @Query(() => [Game], { name: 'games' })
  @RequiresTenant()
  async findAll(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Context() context: { req: TenantRequest }
  ) {
    const tenantId = context.req.tenant?.id
    if (!tenantId) {
      throw new Error('Tenant context required')
    }

    // TODO: 实现基于租户的游戏查询
    return []
  }

  @Query(() => Game, { name: 'game' })
  @RequiresTenant()
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: { req: TenantRequest }
  ) {
    const tenantId = context.req.tenant?.id
    if (!tenantId) {
      throw new Error('Tenant context required')
    }

    // TODO: 实现基于租户的单个游戏查询
    return null
  }

  @Mutation(() => Game)
  @RequiresTenant()
  async createGame(
    @Args('createGameInput') createGameInput: CreateGameInput,
    @Context() context: { req: TenantRequest }
  ) {
    const tenantId = context.req.tenant?.id
    const userId = context.req.user?.id

    if (!tenantId || !userId) {
      throw new Error('Tenant and user context required')
    }

    // TODO: 实现游戏创建逻辑
    return null
  }

  @Mutation(() => Game)
  @RequiresTenant()
  async updateGame(
    @Args('updateGameInput') updateGameInput: UpdateGameInput,
    @Context() context: { req: TenantRequest }
  ) {
    const tenantId = context.req.tenant?.id

    if (!tenantId) {
      throw new Error('Tenant context required')
    }

    // TODO: 实现游戏更新逻辑
    return null
  }

  @Mutation(() => Game)
  @RequiresTenant()
  async removeGame(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: { req: TenantRequest }
  ) {
    const tenantId = context.req.tenant?.id

    if (!tenantId) {
      throw new Error('Tenant context required')
    }

    // TODO: 实现游戏删除逻辑
    return null
  }
}

// Input Types
@InputType()
export class CreateGameInput {
  @Field()
  name: string

  @Field({ nullable: true })
  description?: string
}

@InputType()
export class UpdateGameInput {
  @Field(() => ID)
  id: string

  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string
}

// Import GraphQL decorators
import { Field } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
