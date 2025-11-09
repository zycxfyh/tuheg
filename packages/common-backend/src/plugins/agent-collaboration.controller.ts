import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../security/jwt-auth.guard'
import type { AgentService } from './agent.service'
import type { AgentCommunicationService } from './agent-communication.service'
import type { AgentLearningService } from './agent-learning.service'
import type { CollaborationService } from './collaboration.service'
import type { TaskService } from './task.service'

@Controller('agents')
export class AgentCollaborationController {
  constructor(
    private readonly agentService: AgentService,
    private readonly taskService: TaskService,
    private readonly collaborationService: CollaborationService,
    private readonly learningService: AgentLearningService,
    private readonly communicationService: AgentCommunicationService
  ) {}

  // ==================== Agent 管理 ====================

  /**
   * 创建新Agent
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAgent(@Body() data: any) {
    return this.agentService.createAgent(data)
  }

  /**
   * 获取所有Agent
   */
  @Get()
  async getAgents(@Query() filters: any) {
    return this.agentService.getAgents(filters)
  }

  /**
   * 获取Agent详情
   */
  @Get(':id')
  async getAgent(@Param('id') id: string) {
    return this.agentService.getAgent(id)
  }

  /**
   * 更新Agent
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateAgent(@Param('id') id: string, @Body() data: any) {
    return this.agentService.updateAgent(id, data)
  }

  /**
   * 删除Agent
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAgent(@Param('id') id: string) {
    await this.agentService.deleteAgent(id)
    return { message: 'Agent deleted successfully' }
  }

  /**
   * 获取Agent工作负载
   */
  @Get(':id/workload')
  async getAgentWorkload(@Param('id') id: string) {
    return this.agentService.getAgentWorkload(id)
  }

  /**
   * 获取Agent性能指标
   */
  @Get(':id/metrics')
  async getAgentMetrics(
    @Param('id') id: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.agentService.getAgentMetrics(id, period)
  }

  /**
   * Agent健康检查
   */
  @Get(':id/health')
  async checkAgentHealth(@Param('id') id: string) {
    return this.agentService.healthCheck(id)
  }

  /**
   * 批量更新Agent状态
   */
  @Put('batch/status')
  @UseGuards(JwtAuthGuard)
  async bulkUpdateStatus(@Body() data: { agentIds: string[]; status: string }) {
    return this.agentService.bulkUpdateStatus(data.agentIds, data.status as any)
  }

  // ==================== 任务管理 ====================

  /**
   * 创建任务
   */
  @Post('tasks')
  @UseGuards(JwtAuthGuard)
  async createTask(@Body() data: any) {
    return this.taskService.createTask(data)
  }

  /**
   * 获取任务列表
   */
  @Get('tasks')
  async getTasks(@Query() filters: any) {
    return this.taskService.getTaskQueue(filters)
  }

  /**
   * 获取任务详情
   */
  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return this.taskService.getTask(id)
  }

  /**
   * 更新任务
   */
  @Put('tasks/:id')
  @UseGuards(JwtAuthGuard)
  async updateTask(@Param('id') id: string, @Body() data: any) {
    return this.taskService.updateTask(id, data)
  }

  /**
   * 删除任务
   */
  @Delete('tasks/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTask(@Param('id') id: string) {
    await this.taskService.deleteTask(id)
    return { message: 'Task deleted successfully' }
  }

  /**
   * 手动分配任务
   */
  @Post('tasks/:id/assign')
  @UseGuards(JwtAuthGuard)
  async assignTask(@Param('id') id: string, @Body() data: { agentId: string; priority?: number }) {
    await this.taskService.assignTask({
      taskId: id,
      agentId: data.agentId,
      priority: data.priority,
    })
    return { message: 'Task assigned successfully' }
  }

  /**
   * 取消任务分配
   */
  @Delete('tasks/:id/assign/:agentId')
  @UseGuards(JwtAuthGuard)
  async unassignTask(@Param('id') id: string, @Param('agentId') agentId: string) {
    await this.taskService.unassignTask(id, agentId)
    return { message: 'Task unassigned successfully' }
  }

  /**
   * 更新任务进度
   */
  @Put('tasks/:id/progress')
  @UseGuards(JwtAuthGuard)
  async updateTaskProgress(
    @Param('id') id: string,
    @Body()
    data: {
      agentId: string
      progress: number
      status?: string
      result?: any
      error?: string
    }
  ) {
    await this.taskService.updateTaskProgress(
      id,
      data.agentId,
      data.progress,
      data.status as any,
      data.result,
      data.error
    )
    return { message: 'Task progress updated successfully' }
  }

  /**
   * 获取Agent的任务列表
   */
  @Get(':id/tasks')
  async getAgentTasks(@Param('id') id: string, @Query() filters: any) {
    return this.taskService.getAgentTasks(id, filters)
  }

  // ==================== 协作管理 ====================

  /**
   * 创建协作
   */
  @Post('collaborations')
  @UseGuards(JwtAuthGuard)
  async createCollaboration(@Body() data: any, @Request() req) {
    return this.collaborationService.createCollaboration(
      req.user.id,
      data.participantIds,
      data.config
    )
  }

  /**
   * 获取协作详情
   */
  @Get('collaborations/:id')
  async getCollaboration(@Param('id') id: string) {
    return this.collaborationService.getCollaboration(id)
  }

  /**
   * 更新协作状态
   */
  @Put('collaborations/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateCollaborationStatus(
    @Param('id') id: string,
    @Body() data: { status: string; outcome?: any }
  ) {
    return this.collaborationService.updateCollaborationStatus(id, data.status as any, data.outcome)
  }

  /**
   * 添加协作参与者
   */
  @Post('collaborations/:id/participants')
  @UseGuards(JwtAuthGuard)
  async addParticipant(@Param('id') id: string, @Body() data: { agentId: string }) {
    await this.collaborationService.addParticipant(id, data.agentId)
    return { message: 'Participant added successfully' }
  }

  /**
   * 移除协作参与者
   */
  @Delete('collaborations/:id/participants/:agentId')
  @UseGuards(JwtAuthGuard)
  async removeParticipant(@Param('id') id: string, @Param('agentId') agentId: string) {
    await this.collaborationService.removeParticipant(id, agentId)
    return { message: 'Participant removed successfully' }
  }

  /**
   * 分配协作任务
   */
  @Post('collaborations/:id/tasks')
  @UseGuards(JwtAuthGuard)
  async assignCollaborationTask(
    @Param('id') id: string,
    @Body() data: { taskId: string; agentId: string; contribution?: string }
  ) {
    return this.collaborationService.assignCollaborationTask(
      id,
      data.taskId,
      data.agentId,
      data.contribution
    )
  }

  /**
   * 更新协作任务进度
   */
  @Put('collaborations/:id/tasks/:taskId/progress')
  @UseGuards(JwtAuthGuard)
  async updateTaskCollaborationProgress(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() data: { agentId: string; status: string; contribution?: string }
  ) {
    await this.collaborationService.updateTaskCollaborationProgress(
      id,
      taskId,
      data.agentId,
      data.status,
      data.contribution
    )
    return { message: 'Task progress updated successfully' }
  }

  /**
   * 发送协作消息
   */
  @Post('collaborations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendCollaborationMessage(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.collaborationService.sendCollaborationMessage(
      id,
      req.user.id,
      data.message,
      data.messageType,
      data.receiverId,
      data.metadata
    )
  }

  /**
   * 获取协作消息历史
   */
  @Get('collaborations/:id/messages')
  async getCollaborationMessages(@Param('id') id: string, @Query() query: any) {
    return this.collaborationService.getCollaborationMessages(id, query.limit, query.offset)
  }

  /**
   * 获取协作结果
   */
  @Get('collaborations/:id/results')
  async getCollaborationResult(@Param('id') id: string) {
    return this.collaborationService.getCollaborationResult(id)
  }

  /**
   * 获取活跃协作列表
   */
  @Get('collaborations/active')
  async getActiveCollaborations() {
    return this.collaborationService.getActiveCollaborations()
  }

  /**
   * 获取Agent的协作历史
   */
  @Get(':id/collaborations')
  async getAgentCollaborations(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.collaborationService.getAgentCollaborations(id, limit)
  }

  // ==================== 学习和优化 ====================

  /**
   * 记录Agent学习数据
   */
  @Post(':id/learning')
  @UseGuards(JwtAuthGuard)
  async recordLearning(
    @Param('id') id: string,
    @Body() data: { pattern: string; learningData: any; performance: number }
  ) {
    return this.learningService.recordLearning(
      id,
      data.pattern,
      data.learningData,
      data.performance
    )
  }

  /**
   * 获取Agent学习历史
   */
  @Get(':id/learning')
  async getAgentLearningHistory(@Param('id') id: string, @Query() query: any) {
    return this.learningService.getAgentLearningHistory(id, query.pattern, query.limit)
  }

  /**
   * 分析学习模式
   */
  @Get(':id/learning/patterns')
  async analyzeLearningPatterns(@Param('id') id: string) {
    return this.learningService.analyzeLearningPatterns(id)
  }

  /**
   * 应用学习模式
   */
  @Post(':id/learning/patterns/:patternId/apply')
  @UseGuards(JwtAuthGuard)
  async applyLearnedPattern(
    @Param('id') id: string,
    @Param('patternId') patternId: string,
    @Body() context: any
  ) {
    const success = await this.learningService.applyLearnedPattern(id, patternId, context)
    return { success }
  }

  /**
   * 计算Agent性能
   */
  @Get(':id/performance')
  async calculateAgentPerformance(
    @Param('id') id: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.learningService.calculateAgentPerformance(id, period)
  }

  /**
   * 生成性能报告
   */
  @Get(':id/performance/report')
  async generatePerformanceReport(@Param('id') id: string) {
    return this.learningService.generatePerformanceReport(id)
  }

  /**
   * 优化Agent配置
   */
  @Get(':id/optimize')
  async optimizeAgent(@Param('id') id: string) {
    return this.learningService.optimizeAgent(id)
  }

  /**
   * 应用优化建议
   */
  @Post(':id/optimize/:optimizationType')
  @UseGuards(JwtAuthGuard)
  async applyOptimization(
    @Param('id') id: string,
    @Param('optimizationType') optimizationType: string
  ) {
    const success = await this.learningService.applyOptimization(id, optimizationType)
    return { success }
  }

  // ==================== 通信 ====================

  /**
   * 发送消息给Agent
   */
  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body() data: { receiverId: string; payload: any; collaborationId?: string }
  ) {
    return this.communicationService.sendMessage(
      req.user.id,
      id,
      data.payload,
      data.collaborationId
    )
  }

  /**
   * 广播消息
   */
  @Post('messages/broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcastMessage(
    @Request() req,
    @Body() data: { receiverIds: string[]; payload: any; collaborationId?: string }
  ) {
    return this.communicationService.broadcastMessage(
      req.user.id,
      data.receiverIds,
      data.payload,
      data.collaborationId
    )
  }

  /**
   * 获取Agent消息历史
   */
  @Get(':id/messages')
  async getAgentMessages(@Param('id') id: string, @Query() filters: any) {
    return this.communicationService.getAgentMessages(id, filters)
  }

  /**
   * 创建通信频道
   */
  @Post('channels')
  @UseGuards(JwtAuthGuard)
  async createChannel(@Body() data: { name: string; type: string; participants: string[] }) {
    return this.communicationService.createChannel(data.name, data.type as any, data.participants)
  }

  /**
   * 加入频道
   */
  @Post('channels/:channelId/join')
  @UseGuards(JwtAuthGuard)
  async joinChannel(@Param('channelId') channelId: string, @Request() req) {
    const success = this.communicationService.joinChannel(channelId, req.user.id)
    return { success }
  }

  /**
   * 发送频道消息
   */
  @Post('channels/:channelId/messages')
  @UseGuards(JwtAuthGuard)
  async sendChannelMessage(
    @Param('channelId') channelId: string,
    @Request() req,
    @Body() payload: any
  ) {
    return this.communicationService.sendChannelMessage(channelId, req.user.id, payload)
  }

  /**
   * 获取通信统计
   */
  @Get('communication/stats')
  async getCommunicationStats(@Query() query: any) {
    return this.communicationService.getCommunicationStats(query.agentId, query.period)
  }

  /**
   * 监控通信质量
   */
  @Get(':id/communication/quality')
  async monitorCommunicationQuality(@Param('id') id: string) {
    return this.communicationService.monitorCommunicationQuality(id)
  }

  // ==================== 系统状态 ====================

  /**
   * 获取Agent类型统计
   */
  @Get('stats/types')
  async getAgentTypeStats() {
    return this.agentService.getAgentTypeStats()
  }

  /**
   * 系统健康检查
   */
  @Get('health')
  async getSystemHealth() {
    // 这里可以实现更复杂的系统健康检查
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        agents: 'operational',
        tasks: 'operational',
        collaborations: 'operational',
        learning: 'operational',
        communication: 'operational',
      },
    }
  }
}
