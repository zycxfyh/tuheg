import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Logger
} from '@nestjs/common'
import {
  AgentRegistryService,
  IntelligentSchedulerService,
  WorkflowOrchestratorService,
  AgentInfo,
  AgentRegistrationRequest,
  TaskRequirements
} from '@tuheg/common-backend'
import { ClerkGuard } from '../guards/clerk.guard'

@Controller('orchestration')
@UseGuards(ClerkGuard)
export class OrchestrationController {
  private readonly logger = new Logger(OrchestrationController.name)

  constructor(
    private readonly agentRegistry: AgentRegistryService,
    private readonly scheduler: IntelligentSchedulerService,
    private readonly orchestrator: WorkflowOrchestratorService
  ) {}

  // ============ Agent管理端点 ============

  /**
   * 注册新Agent
   */
  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  async registerAgent(@Body() request: AgentRegistrationRequest) {
    this.logger.log(`Registering agent: ${request.name}`)
    const agent = await this.agentRegistry.registerAgent(request)
    return {
      success: true,
      data: agent,
      message: 'Agent registered successfully'
    }
  }

  /**
   * 获取所有Agent
   */
  @Get('agents')
  async getAgents(@Query('type') type?: string, @Query('status') status?: string) {
    let agents = this.agentRegistry.getAllAgents()

    // 应用过滤器
    if (type) {
      agents = agents.filter(agent => agent.type === type)
    }
    if (status) {
      agents = agents.filter(agent => agent.status === status)
    }

    return {
      success: true,
      data: agents,
      count: agents.length
    }
  }

  /**
   * 获取单个Agent详情
   */
  @Get('agents/:id')
  async getAgent(@Param('id') id: string) {
    const agent = this.agentRegistry.getAgent(id)
    if (!agent) {
      return {
        success: false,
        error: 'Agent not found',
        statusCode: HttpStatus.NOT_FOUND
      }
    }

    return {
      success: true,
      data: agent
    }
  }

  /**
   * 更新Agent状态
   */
  @Put('agents/:id/status')
  async updateAgentStatus(
    @Param('id') id: string,
    @Body() body: { status: AgentInfo['status'], healthScore?: number }
  ) {
    await this.agentRegistry.updateAgentStatus(id, body.status, body.healthScore)
    return {
      success: true,
      message: 'Agent status updated'
    }
  }

  /**
   * 注销Agent
   */
  @Delete('agents/:id')
  async unregisterAgent(@Param('id') id: string) {
    await this.agentRegistry.unregisterAgent(id)
    return {
      success: true,
      message: 'Agent unregistered'
    }
  }

  // ============ 调度管理端点 ============

  /**
   * 智能调度任务
   */
  @Post('schedule')
  async scheduleTask(@Body() body: {
    requirements: TaskRequirements
    context?: Record<string, any>
  }) {
    const result = await this.scheduler.scheduleTask({
      taskId: `task-${Date.now()}`,
      requirements: body.requirements,
      loadBalancing: true,
      failoverEnabled: true
    })

    if (!result) {
      return {
        success: false,
        error: 'No suitable agent found',
        statusCode: HttpStatus.NOT_FOUND
      }
    }

    return {
      success: true,
      data: result
    }
  }

  /**
   * 批量调度任务
   */
  @Post('schedule/batch')
  async scheduleBatchTasks(@Body() body: {
    tasks: Array<{ taskId: string, requirements: TaskRequirements }>
  }) {
    const results = await this.scheduler.scheduleMultipleTasks(body.tasks)
    return {
      success: true,
      data: Object.fromEntries(results)
    }
  }

  /**
   * 获取调度统计信息
   */
  @Get('schedule/stats')
  async getSchedulingStats() {
    const stats = this.scheduler.getSchedulingStats()
    return {
      success: true,
      data: stats
    }
  }

  // ============ 工作流管理端点 ============

  /**
   * 注册工作流定义
   */
  @Post('workflows')
  @HttpCode(HttpStatus.CREATED)
  async registerWorkflow(@Body() workflowDefinition: any) {
    this.orchestrator.registerWorkflow(workflowDefinition)
    return {
      success: true,
      message: 'Workflow registered successfully'
    }
  }

  /**
   * 执行工作流
   */
  @Post('workflows/:id/execute')
  async executeWorkflow(
    @Param('id') workflowId: string,
    @Body() body: { context?: Record<string, any> }
  ) {
    const result = await this.orchestrator.executeWorkflow(
      workflowId,
      body.context || {}
    )

    return {
      success: true,
      data: result
    }
  }

  /**
   * 获取活跃执行列表
   */
  @Get('executions/active')
  async getActiveExecutions() {
    const executions = this.orchestrator.getActiveExecutions()
    return {
      success: true,
      data: executions,
      count: executions.length
    }
  }

  /**
   * 取消工作流执行
   */
  @Delete('executions/:id')
  async cancelExecution(@Param('id') executionId: string) {
    const cancelled = this.orchestrator.cancelExecution(executionId)
    return {
      success: cancelled,
      message: cancelled ? 'Execution cancelled' : 'Execution not found or already completed'
    }
  }

  /**
   * 获取编排统计信息
   */
  @Get('stats')
  async getOrchestrationStats() {
    const registryStats = this.agentRegistry.getRegistryStats()
    const orchestratorStats = this.orchestrator.getOrchestratorStats()

    return {
      success: true,
      data: {
        agents: registryStats,
        workflows: orchestratorStats
      }
    }
  }

  // ============ 工具端点 ============

  /**
   * 根据能力查找Agent
   */
  @Get('agents/capability/:capability')
  async findAgentsByCapability(
    @Param('capability') capability: string,
    @Query('reliability') reliability?: string
  ) {
    const minReliability = reliability ? parseFloat(reliability) : 0.8
    const agents = this.agentRegistry.findAgentsByCapability(capability, minReliability)

    return {
      success: true,
      data: agents,
      count: agents.length
    }
  }

  /**
   * 根据类型查找Agent
   */
  @Get('agents/type/:type')
  async findAgentsByType(@Param('type') type: string) {
    const agents = this.agentRegistry.findAgentsByType(type as any)

    return {
      success: true,
      data: agents,
      count: agents.length
    }
  }
}
