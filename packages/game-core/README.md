# Game Core (游戏核心包) - 领域驱动的游戏逻辑引擎

## 📋 概述

Game Core是创世星环系统的游戏逻辑核心包，采用领域驱动设计(DDD)架构实现。该包作为游戏业务逻辑的核心，提供了完整的游戏规则引擎、状态管理和核心游戏机制，为整个系统提供一致的游戏逻辑抽象。

[![DDD Architecture](https://img.shields.io/badge/architecture-DDD-blue.svg)](https://domainlanguage.com/ddd/)
[![Game Logic](https://img.shields.io/badge/game--logic-core-critical.svg)](../../docs/core/core-mechanism-optimization.md)

## 🏗️ 技术栈

- **架构模式**: 领域驱动设计 (DDD)
- **语言**: TypeScript
- **状态管理**: 不可变状态 + 事件溯源
- **验证**: Zod (运行时类型验证)
- **测试**: Jest + 测试替身
- **文档**: TypeDoc + 领域故事

## 架构设计

### DDD分层架构

Game Core严格遵循DDD经典分层架构：

```text
┌─────────────────────────────────────┐
│         Interfaces Layer            │  ← API适配器
│   Controllers, DTOs, Presenters     │
├─────────────────────────────────────┤
│       Application Layer             │  ← 用例编排
│   Use Cases, Application Services   │
├─────────────────────────────────────┤
│          Domain Layer               │  ← 核心业务逻辑
│   Entities, Value Objects, Services │
├─────────────────────────────────────┤
│     Infrastructure Layer            │  ← 外部依赖
│   Repositories, External Services   │
└─────────────────────────────────────┘
```

### 目录结构

```text
packages/game-core/
├── src/
│   ├── domain/                    # 领域层
│   │   ├── entities/              # 领域实体
│   │   │   ├── game/              # 游戏实体
│   │   │   │   ├── game.entity.ts
│   │   │   │   ├── game.state.ts
│   │   │   │   └── game.rules.ts
│   │   │   ├── character/         # 角色实体
│   │   │   │   ├── character.entity.ts
│   │   │   ├── world/             # 世界实体
│   │   │   └── shared/            # 共享实体
│   │   ├── value-objects/         # 值对象
│   │   │   ├── action.vo.ts       # 行动值对象
│   │   │   ├── position.vo.ts     # 位置值对象
│   │   │   └── attribute.vo.ts    # 属性值对象
│   │   ├── services/              # 领域服务
│   │   │   ├── game-rules.service.ts    # 游戏规则服务
│   │   │   ├── state-manager.service.ts # 状态管理器
│   │   │   └── action-validator.service.ts # 行动验证器
│   │   ├── events/                # 领域事件
│   │   │   ├── game.events.ts     # 游戏事件
│   │   │   ├── character.events.ts # 角色事件
│   │   │   └── domain-events.ts   # 领域事件基类
│   │   └── aggregates/            # 聚合根
│   │       └── game.aggregate.ts  # 游戏聚合根
│   ├── application/               # 应用层
│   │   ├── use-cases/             # 用例
│   │   │   ├── create-game/       # 创建游戏用例
│   │   │   ├── execute-action/    # 执行行动用例
│   │   │   ├── query-game/        # 查询游戏用例
│   │   │   └── manage-character/  # 角色管理用例
│   │   ├── services/              # 应用服务
│   │   │   ├── game-application.service.ts
│   │   │   └── character-application.service.ts
│   │   └── dto/                   # 应用层DTO
│   │       ├── game.dto.ts
│   │       ├── action.dto.ts
│   │       └── character.dto.ts
│   ├── infrastructure/            # 基础设施层
│   │   ├── repositories/          # 仓储实现
│   │   │   ├── game.repository.ts
│   │   │   ├── character.repository.ts
│   │   │   └── interfaces/        # 仓储接口
│   │   ├── external/              # 外部服务集成
│   │   │   ├── ai-service.adapter.ts
│   │   │   ├── event-bus.adapter.ts
│   │   │   └── cache.adapter.ts
│   │   ├── config/                # 配置
│   │   └── persistence/           # 持久化
│   ├── interfaces/                # 接口层
│   │   ├── controllers/           # API控制器
│   │   │   ├── game.controller.ts
│   │   │   └── character.controller.ts
│   │   ├── presenters/            # 展示器
│   │   │   └── game.presenter.ts
│   │   ├── dto/                   # 接口DTO
│   │   └── middleware/            # 中间件
│   └── shared/                    # 共享组件
│       ├── types/                 # 共享类型
│       ├── constants/             # 常量
│       └── utils/                 # 工具函数
├── test/                         # 测试文件
│   ├── domain/                   # 领域层测试
│   ├── application/              # 应用层测试
│   ├── infrastructure/           # 基础设施层测试
│   └── integration/              # 集成测试
└── README.md
```

## 核心领域模型

### 1. 游戏聚合根 (Game Aggregate)

**Game实体**是整个游戏的核心聚合根：

```typescript
export class Game extends AggregateRoot<GameId> {
  private constructor(
    id: GameId,
    private name: GameName,
    private ownerId: UserId,
    private world: World,
    private characters: Character[],
    private state: GameState,
    private rules: GameRules
  ) {
    super(id)
  }

  // 工厂方法
  static create(props: CreateGameProps): Result<Game, GameError> {
    // 验证和创建逻辑
  }

  // 业务方法
  executeAction(action: Action): Result<GameEvent[], GameError> {
    // 执行行动逻辑
  }

  // 只读属性
  get currentState(): GameState {
    return this.state
  }
}
```

### 2. 角色实体 (Character Entity)

```typescript
export class Character extends Entity<CharacterId> {
  constructor(
    id: CharacterId,
    private name: CharacterName,
    private attributes: CharacterAttributes,
    private position: Position,
    private status: CharacterStatus
  ) {
    super(id)
  }

  // 领域行为
  moveTo(newPosition: Position): Result<void, CharacterError> {
    // 移动验证和执行
  }

  takeDamage(amount: number): Result<void, CharacterError> {
    // 伤害计算和应用
  }
}
```

### 3. 值对象 (Value Objects)

#### 行动值对象 (Action VO)

```typescript
export class Action extends ValueObject {
  constructor(
    private readonly type: ActionType,
    private readonly target: ActionTarget,
    private readonly parameters: ActionParameters
  ) {}

  // 值对象比较
  equals(other: Action): boolean {
    return (
      this.type === other.type &&
      this.target.equals(other.target) &&
      deepEqual(this.parameters, other.parameters)
    )
  }
}
```

#### 属性值对象 (Attribute VO)

```typescript
export class Attribute extends ValueObject {
  constructor(
    private readonly name: string,
    private readonly value: number,
    private readonly minValue: number = 0,
    private readonly maxValue: number = 100
  ) {}

  // 业务方法
  increase(amount: number): Result<Attribute, AttributeError> {
    const newValue = this.value + amount
    if (newValue > this.maxValue) {
      return Result.fail(new AttributeError('Value exceeds maximum'))
    }
    return Result.ok(
      new Attribute(this.name, newValue, this.minValue, this.maxValue)
    )
  }
}
```

## 领域服务

### 1. 游戏规则服务 (GameRulesService)

```typescript
@Injectable()
export class GameRulesService {
  validateAction(
    action: Action,
    gameState: GameState
  ): Result<void, ValidationError> {
    // 行动规则验证
  }

  calculateActionResult(action: Action, gameState: GameState): ActionResult {
    // 行动结果计算
  }

  checkWinCondition(gameState: GameState): boolean {
    // 胜利条件检查
  }
}
```

### 2. 状态管理器 (StateManagerService)

```typescript
@Injectable()
export class StateManagerService {
  applyStateChange(
    currentState: GameState,
    changes: StateChange[]
  ): Result<GameState, StateError> {
    // 状态变更应用
  }

  validateStateTransition(
    fromState: GameState,
    toState: GameState
  ): Result<void, TransitionError> {
    // 状态转换验证
  }
}
```

## 应用层用例

### 1. 执行行动用例 (ExecuteActionUseCase)

```typescript
export class ExecuteActionUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private gameRulesService: GameRulesService,
    private eventBus: IEventBus
  ) {}

  async execute(
    request: ExecuteActionRequest
  ): Promise<Result<ExecuteActionResponse, UseCaseError>> {
    // 1. 获取游戏
    const game = await this.gameRepository.findById(request.gameId)

    // 2. 验证行动
    const validation = await this.gameRulesService.validateAction(
      request.action,
      game.state
    )

    // 3. 执行行动
    const result = game.executeAction(request.action)

    // 4. 保存状态
    await this.gameRepository.save(game)

    // 5. 发布事件
    await this.eventBus.publish(result.events)

    return Result.ok({ gameState: game.state, events: result.events })
  }
}
```

## 基础设施层

### 1. 仓储实现 (Repository Implementations)

```typescript
@Injectable()
export class PrismaGameRepository implements IGameRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: GameId): Promise<Game | null> {
    const data = await this.prisma.game.findUnique({
      where: { id: id.value },
      include: { characters: true, world: true },
    })

    return data ? this.toDomain(data) : null
  }

  async save(game: Game): Promise<void> {
    const data = this.toPersistence(game)
    await this.prisma.game.upsert({
      where: { id: game.id.value },
      update: data,
      create: data,
    })
  }

  private toDomain(data: any): Game {
    // 持久化数据到领域对象的转换
  }

  private toPersistence(game: Game): any {
    // 领域对象到持久化数据的转换
  }
}
```

### 2. 外部服务适配器

#### AI服务适配器

```typescript
@Injectable()
export class AiServiceAdapter implements IAiService {
  constructor(private aiOrchestrator: AiOrchestratorService) {}

  async generateNarrative(context: GameContext): Promise<Narrative> {
    const request = this.buildAiRequest(context)
    const response = await this.aiOrchestrator.executeChat(request)
    return this.parseAiResponse(response)
  }
}
```

## 事件驱动架构

### 领域事件定义

```typescript
export class GameCreatedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly ownerId: UserId,
    public readonly gameName: string
  ) {
    super()
  }
}

export class ActionExecutedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly action: Action,
    public readonly result: ActionResult
  ) {
    super()
  }
}
```

### 事件处理

```typescript
@Injectable()
export class GameEventHandler {
  @EventHandler(GameCreatedEvent)
  async handleGameCreated(event: GameCreatedEvent): Promise<void> {
    // 处理游戏创建事件
    await this.notificationService.notifyGameCreated(event)
    await this.analyticsService.trackGameCreation(event)
  }

  @EventHandler(ActionExecutedEvent)
  async handleActionExecuted(event: ActionExecutedEvent): Promise<void> {
    // 处理行动执行事件
    await this.stateProjectionService.updateProjection(event)
  }
}
```

## 测试策略

### 1. 领域层测试

```typescript
describe('Game Aggregate', () => {
  it('should create valid game', () => {
    const props = createValidGameProps()
    const result = Game.create(props)

    expect(result.isSuccess()).toBe(true)
    expect(result.value.name).toBe(props.name)
  })

  it('should reject invalid action', () => {
    const game = createValidGame()
    const invalidAction = createInvalidAction()

    const result = game.executeAction(invalidAction)

    expect(result.isFailure()).toBe(true)
    expect(result.error).toBeInstanceOf(ValidationError)
  })
})
```

### 2. 应用层测试

```typescript
describe('ExecuteActionUseCase', () => {
  let useCase: ExecuteActionUseCase
  let mockGameRepository: MockGameRepository

  beforeEach(() => {
    mockGameRepository = new MockGameRepository()
    useCase = new ExecuteActionUseCase(
      mockGameRepository,
      mockRulesService,
      mockEventBus
    )
  })

  it('should execute valid action', async () => {
    const request = createValidActionRequest()
    mockGameRepository.game = createValidGame()

    const result = await useCase.execute(request)

    expect(result.isSuccess()).toBe(true)
    expect(mockEventBus.publishedEvents).toHaveLength(1)
  })
})
```

### 3. 集成测试

```typescript
describe('Game Creation Integration', () => {
  it('should create game end-to-end', async () => {
    // 完整的端到端测试
    const gameData = await gameService.createGame(createGameRequest)
    const savedGame = await gameRepository.findById(gameData.id)

    expect(savedGame).toBeDefined()
    expect(savedGame.name).toBe(createGameRequest.name)
  })
})
```

## 性能优化

### 1. 状态快照 (State Snapshots)

```typescript
@Injectable()
export class StateSnapshotService {
  async createSnapshot(gameId: GameId): Promise<StateSnapshot> {
    // 创建游戏状态快照用于快速查询
  }

  async restoreFromSnapshot(snapshotId: string): Promise<GameState> {
    // 从快照恢复游戏状态
  }
}
```

### 2. 事件溯源 (Event Sourcing)

```typescript
@Injectable()
export class EventSourcingService {
  async saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void> {
    // 保存领域事件用于审计和状态重建
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    // 获取聚合的事件历史
  }

  async rebuildState(aggregateId: string): Promise<GameState> {
    // 通过重放事件重建当前状态
  }
}
```

## 部署和扩展

### 模块化部署

```typescript
// 核心模块导出
export const GameCoreModule = {
  domain: DomainModule,
  application: ApplicationModule,
  infrastructure: InfrastructureModule,
  interfaces: InterfacesModule,
}

// 按需导入
const lightweightGameCore = {
  domain: DomainModule,
  application: ApplicationModule,
  // 排除重型基础设施依赖
}
```

### 水平扩展

- **读写分离**: 命令和查询分离部署
- **CQRS模式**: 命令查询职责分离
- **事件驱动**: 异步事件处理
- **缓存策略**: 多层缓存优化

## 领域故事 (Domain Storytelling)

### 用户创建游戏的故事

```text
作为一个游戏玩家，
我想要创建新游戏，
以便开始我的冒险之旅。

场景：创建角色驱动游戏
  给定 我提供了游戏概念 "科幻探险"
  当 我提交创建请求
  那么 系统应该：
    - 验证概念有效性
    - 生成游戏名称
    - 创建初始角色
    - 设置游戏规则
    - 返回游戏ID
```

### 玩家执行行动的故事

```text
作为一个游戏玩家，
我想要执行游戏行动，
以便推进游戏剧情。

场景：执行移动行动
  给定 游戏处于活跃状态
    且 角色位于森林中
  当 我选择 "向北移动" 行动
  那么 系统应该：
    - 验证行动有效性
    - 更新角色位置
    - 生成移动叙事
    - 提供后续行动选项
```

## 演进规划

### Phase 1: 核心领域实现 ✅

- 基础DDD架构搭建
- 核心实体和值对象
- 基本用例实现

### Phase 2: 高级功能 🚧

- 事件溯源支持
- CQRS架构
- 复杂规则引擎

### Phase 3: 扩展能力 📋

- 多租户支持
- 插件化规则引擎
- 分布式部署

### Phase 4: 智能化 🎯

- AI辅助规则生成
- 动态难度调整
- 自适应游戏机制

## 相关文档

- [领域驱动设计](https://domainlanguage.com/ddd/)
- [Common Backend文档](../common-backend/README.md)
- [Logic Agent文档](../../apps/logic-agent/README.md)
- [核心机制优化](../../docs/core/core-mechanism-optimization.md)
