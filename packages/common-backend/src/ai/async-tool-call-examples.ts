// 文件路径: packages/common-backend/src/ai/async-tool-call-examples.ts
// 职责: VCPToolBox 异步工具调用的使用示例
// 展示非阻塞工具调用和上下文感知的结果处理

import { AsyncToolCallService, AsyncToolCallStatus } from './async-tool-call.service';

/**
 * VCPToolBox 异步工具调用使用示例
 */
export class AsyncToolCallExamples {
  constructor(private readonly asyncToolService: AsyncToolCallService) {}

  /**
   * 示例1: 基本异步工具调用
   * 场景: AI需要执行耗时操作，但不想阻塞对话流程
   */
  async exampleBasicAsyncCall() {
    console.log('🔧 基本异步工具调用示例');
    console.log('');

    // AI决定调用网络搜索工具
    const taskId = await this.asyncToolService.callToolAsync(
      'web_search',
      { query: '最新AI技术趋势', maxResults: 5 },
      { userId: 'user123', conversationId: 'conv456' },
    );

    console.log(`📤 工具调用已发起，任务ID: ${taskId}`);
    console.log('AI可以继续生成回复，不需要等待工具结果...');
    console.log('');

    // 在AI回复中植入占位符
    const aiResponse = `
    我正在搜索最新的AI技术趋势，请稍候...

    {{VCP_ASYNC_RESULT::web_search::${taskId}}}

    与此同时，让我们讨论一下您对AI的看法...
    `;

    console.log('🤖 AI回复（包含异步结果占位符）:');
    console.log(aiResponse);
    console.log('');

    return { taskId, aiResponse };
  }

  /**
   * 示例2: 等待异步任务完成
   * 场景: 在某些情况下需要等待工具结果
   */
  async exampleWaitForCompletion(taskId: string) {
    console.log('⏳ 等待异步任务完成示例');
    console.log('');

    try {
      const task = await this.asyncToolService.waitForTaskCompletion(taskId, 10000);

      console.log(`✅ 任务 ${taskId} 已完成`);
      console.log(`工具: ${task.toolName}`);
      console.log(`状态: ${task.status}`);
      console.log(`耗时: ${task.completedAt!.getTime() - task.createdAt.getTime()}ms`);
      console.log('结果:', JSON.stringify(task.result, null, 2));
      console.log('');

      return task;
    } catch (error) {
      console.log(`❌ 等待任务失败:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * 示例3: 解析AI回复中的异步结果占位符
   * 场景: 处理AI回复，替换异步结果占位符
   */
  async exampleParseAsyncResults(aiResponse: string) {
    console.log('🔄 解析异步结果占位符示例');
    console.log('');

    const placeholderRegex = /\{\{VCP_ASYNC_RESULT::([^:]+)::([^}]+)\}\}/g;
    let processedResponse = aiResponse;
    const replacements: Array<{ placeholder: string; result: string }> = [];

    let match;
    while ((match = placeholderRegex.exec(aiResponse)) !== null) {
      const [fullMatch, toolName, taskId] = match;
      console.log(`找到占位符: ${fullMatch}`);
      console.log(`工具: ${toolName}, 任务ID: ${taskId}`);

      const task = this.asyncToolService.getTaskStatus(taskId);
      if (task && task.status === AsyncToolCallStatus.COMPLETED) {
        const resultText = this.formatToolResult(task.toolName, task.result);
        processedResponse = processedResponse.replace(fullMatch, resultText);
        replacements.push({ placeholder: fullMatch, result: resultText });
      } else if (task && task.status === AsyncToolCallStatus.FAILED) {
        const errorText = `❌ 工具调用失败: ${task.error}`;
        processedResponse = processedResponse.replace(fullMatch, errorText);
        replacements.push({ placeholder: fullMatch, result: errorText });
      } else {
        // 任务还在进行中，保持占位符
        console.log(`任务 ${taskId} 仍在进行中 (${task?.status || 'unknown'})`);
      }
    }

    console.log('🔄 处理后的回复:');
    console.log(processedResponse);
    console.log('');

    return { processedResponse, replacements };
  }

  /**
   * 示例4: 复杂的多工具异步调用
   * 场景: AI需要同时调用多个工具进行并行处理
   */
  async exampleMultipleAsyncCalls() {
    console.log('🎪 多工具异步调用示例');
    console.log('');

    const correlationId = `multi-tool-${Date.now()}`;

    // 同时发起多个工具调用
    const tasks = await Promise.all([
      this.asyncToolService.callToolAsync(
        'web_search',
        { query: 'AI在医疗领域的应用' },
        { correlationId, step: 1 },
      ),
      this.asyncToolService.callToolAsync(
        'data_analysis',
        { dataset: 'medical_ai_stats', analysisType: 'trend' },
        { correlationId, step: 2 },
      ),
      this.asyncToolService.callToolAsync(
        'file_operation',
        { action: 'read', path: 'research_papers/medical_ai.pdf' },
        { correlationId, step: 3 },
      ),
    ]);

    console.log('📤 已发起3个异步工具调用:');
    tasks.forEach((taskId, index) => {
      console.log(`  ${index + 1}. 任务ID: ${taskId}`);
    });
    console.log('');

    // AI回复包含所有占位符
    const aiResponse = `
    我正在并行处理多个信息源来为您提供全面的答案：

    📊 网络搜索结果:
    {{VCP_ASYNC_RESULT::web_search::${tasks[0]}}}

    📈 数据分析结果:
    {{VCP_ASYNC_RESULT::data_analysis::${tasks[1]}}}

    📄 研究论文内容:
    {{VCP_ASYNC_RESULT::file_operation::${tasks[2]}}}

    这些信息将帮助我们更好地理解AI在医疗领域的最新进展。
    `;

    console.log('🤖 AI回复（包含多个异步结果占位符）:');
    console.log(aiResponse);
    console.log('');

    return { tasks, aiResponse, correlationId };
  }

  /**
   * 示例5: WebSocket集成示例
   * 场景: 通过WebSocket实时推送工具执行状态
   */
  async exampleWebSocketIntegration() {
    console.log('🌐 WebSocket集成示例');
    console.log('');

    // 模拟WebSocket事件监听
    const eventHandlers = {
      'async-tool-call.started': (data: any) => {
        console.log(`🚀 工具调用开始: ${data.toolName} (任务: ${data.taskId})`);
        // 在这里发送WebSocket消息给前端
        // this.webSocketService.sendToUser(userId, 'tool_call_started', data);
      },

      'async-tool-call.completed': (data: any) => {
        console.log(`✅ 工具调用完成: ${data.toolName} (任务: ${data.taskId})`);
        // 在这里发送WebSocket消息给前端
        // this.webSocketService.sendToUser(userId, 'tool_call_completed', {
        //   taskId: data.taskId,
        //   result: data.result,
        // });
      },

      'async-tool-call.failed': (data: any) => {
        console.log(`❌ 工具调用失败: ${data.toolName} (任务: ${data.taskId})`);
        console.log(`错误: ${data.error}`);
        // 在这里发送WebSocket消息给前端
        // this.webSocketService.sendToUser(userId, 'tool_call_failed', data);
      },
    };

    console.log('已设置WebSocket事件处理器:');
    Object.keys(eventHandlers).forEach((event) => {
      console.log(`  - ${event}`);
    });
    console.log('');

    // 发起一个异步调用来演示
    const taskId = await this.asyncToolService.callToolAsync(
      'web_search',
      { query: 'WebSocket技术详解' },
      { userId: 'demo_user' },
    );

    console.log(`发起演示任务: ${taskId}`);
    console.log('在实际应用中，这些事件会通过WebSocket实时推送到前端界面');
    console.log('');

    return { eventHandlers, taskId };
  }

  /**
   * 示例6: 完整的AI对话流程
   * 场景: 从AI决策到工具调用再到结果整合的完整流程
   */
  async exampleCompleteWorkflow(userQuery: string) {
    console.log('🔄 完整AI对话工作流示例');
    console.log(`用户查询: "${userQuery}"`);
    console.log('');

    // 步骤1: AI分析查询并决定需要哪些工具
    console.log('🤖 AI分析查询...');
    const requiredTools = this.analyzeQueryForTools(userQuery);
    console.log(`需要调用工具: ${requiredTools.join(', ')}`);
    console.log('');

    // 步骤2: 发起异步工具调用
    console.log('📤 发起异步工具调用...');
    const correlationId = `workflow-${Date.now()}`;
    const taskPromises = requiredTools.map((tool) =>
      this.asyncToolService.callToolAsync(tool, this.generateToolInput(tool, userQuery), {
        correlationId,
        userQuery,
      }),
    );
    const taskIds = await Promise.all(taskPromises);
    console.log(`已创建 ${taskIds.length} 个异步任务`);
    console.log('');

    // 步骤3: AI生成初始回复，包含占位符
    console.log('✨ AI生成初始回复...');
    const initialResponse = this.generateResponseWithPlaceholders(
      userQuery,
      requiredTools,
      taskIds,
    );
    console.log('初始回复:');
    console.log(initialResponse);
    console.log('');

    // 步骤4: 等待所有工具完成（或设置超时）
    console.log('⏳ 等待工具结果...');
    const completedTasks = [];
    const timeoutMs = 15000; // 15秒超时

    for (const taskId of taskIds) {
      try {
        const task = await this.asyncToolService.waitForTaskCompletion(taskId, timeoutMs);
        completedTasks.push(task);
        console.log(`✅ 任务 ${taskId} 完成`);
      } catch (error) {
        console.log(
          `❌ 任务 ${taskId} 失败:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    console.log('');

    // 步骤5: 整合结果并生成最终回复
    console.log('🔄 整合结果并生成最终回复...');
    const finalResponse = this.integrateResultsIntoResponse(initialResponse, completedTasks);
    console.log('最终回复:');
    console.log(finalResponse);
    console.log('');

    return {
      userQuery,
      requiredTools,
      taskIds,
      initialResponse,
      completedTasks,
      finalResponse,
    };
  }

  // ===== 辅助方法 =====

  private analyzeQueryForTools(query: string): string[] {
    // 简单的查询分析逻辑
    const tools = [];

    if (query.toLowerCase().includes('搜索') || query.toLowerCase().includes('search')) {
      tools.push('web_search');
    }

    if (query.toLowerCase().includes('分析') || query.toLowerCase().includes('analyze')) {
      tools.push('data_analysis');
    }

    if (query.toLowerCase().includes('文件') || query.toLowerCase().includes('file')) {
      tools.push('file_operation');
    }

    return tools.length > 0 ? tools : ['web_search']; // 默认使用搜索
  }

  private generateToolInput(tool: string, query: string): unknown {
    switch (tool) {
      case 'web_search':
        return { query, maxResults: 3 };
      case 'data_analysis':
        return { data: query, analysisType: 'general' };
      case 'file_operation':
        return { action: 'search', query };
      default:
        return { query };
    }
  }

  private generateResponseWithPlaceholders(
    query: string,
    tools: string[],
    taskIds: string[],
  ): string {
    let response = `我收到了您的查询："${query}"\n\n`;

    response += '为了给您最准确的答案，我正在调用以下工具:\n';
    tools.forEach((tool, index) => {
      const taskId = taskIds[index];
      response += `- ${tool}: {{VCP_ASYNC_RESULT::${tool}::${taskId}}}\n`;
    });

    response += '\n请稍候，我正在处理这些信息...';

    return response;
  }

  private integrateResultsIntoResponse(initialResponse: string, completedTasks: any[]): string {
    let finalResponse = initialResponse;

    for (const task of completedTasks) {
      const placeholder = `{{VCP_ASYNC_RESULT::${task.toolName}::${task.id}}}`;
      const resultText = this.formatToolResult(task.toolName, task.result);
      finalResponse = finalResponse.replace(placeholder, resultText);
    }

    return finalResponse;
  }

  private formatToolResult(toolName: string, result: unknown): string {
    if (!result) return '暂无结果';

    switch (toolName) {
      case 'web_search':
        const searchResults = result as any;
        return `搜索到 ${searchResults.results?.length || 0} 个结果，包括 "${searchResults.results?.[0]?.title || '无标题'}" 等`;

      case 'data_analysis':
        const analysisResults = result as any;
        return `分析完成，发现 ${analysisResults.analysis?.insights?.length || 0} 个关键洞察`;

      case 'file_operation':
        const fileResults = result as any;
        return `文件操作完成，读取了 ${fileResults.size || 0} 字节的内容`;

      default:
        return JSON.stringify(result).slice(0, 200) + '...';
    }
  }
}

/**
 * 使用指南
 *
 * 1. 导入服务:
 * import { AsyncToolCallService } from './async-tool-call.service';
 *
 * 2. 基本异步调用:
 * const taskId = await asyncToolService.callToolAsync('tool_name', input, context);
 *
 * 3. 在AI回复中植入占位符:
 * const response = `结果: {{VCP_ASYNC_RESULT::tool_name::${taskId}}}`;
 *
 * 4. 监听结果事件:
 * - 'async-tool-call.started': 工具调用开始
 * - 'async-tool-call.completed': 工具调用完成
 * - 'async-tool-call.failed': 工具调用失败
 *
 * 5. 解析占位符:
 * const finalResponse = response.replace(
 *   /\{\{VCP_ASYNC_RESULT::([^:]+)::([^}]+)\}\}/g,
 *   (match, toolName, taskId) => getToolResult(taskId)
 * );
 *
 * 6. 性能优势:
 * - 非阻塞调用: AI可以继续生成回复
 * - 并行处理: 多个工具可以同时执行
 * - 实时反馈: 通过WebSocket推送状态更新
 * - 容错性强: 单个工具失败不影响整体流程
 */
