var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var Agent_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.Agent = void 0
const common_1 = require('@nestjs/common')
let Agent = (Agent_1 = class Agent {
  config
  name
  logger = new common_1.Logger(Agent_1.name)
  constructor(config, name) {
    this.config = config
    this.name = name
  }
  getRole() {
    return this.config.role
  }
  getName() {
    return this.name
  }
  getProvider() {
    return this.config.provider
  }
  getTools() {
    return this.config.tools ?? []
  }
  canDelegate() {
    return this.config.allowDelegation ?? false
  }
  async execute(taskDescription, context = {}) {
    const startTime = Date.now()
    const toolsUsed = []
    try {
      this.logger.debug(`Agent "${this.name}" executing task: ${taskDescription}`)
      if (!this.config.provider) {
        throw new Error(`Agent "${this.name}" has no AI provider configured`)
      }
      const systemPrompt = this.buildSystemPrompt(taskDescription, context)
      const response = await this.config.provider.model.invoke(systemPrompt)
      const output =
        typeof response === 'string'
          ? response
          : (response.content?.toString() ?? JSON.stringify(response))
      const toolCalls = this.extractToolCalls(output)
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const toolResult = await this.executeTool(toolCall.toolName, toolCall.input)
          toolsUsed.push(toolCall.toolName)
          context[`tool_result_${toolCall.toolName}`] = toolResult
        }
      }
      const executionTime = Date.now() - startTime
      return {
        success: true,
        output,
        executionTime,
        toolsUsed,
        metadata: {
          agent: this.name,
          role: this.config.role.name,
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Agent "${this.name}" execution failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      )
      return {
        success: false,
        output: null,
        error: errorMessage,
        executionTime,
        toolsUsed,
        metadata: {
          agent: this.name,
          role: this.config.role.name,
        },
      }
    }
  }
  buildSystemPrompt(taskDescription, context) {
    const role = this.config.role
    const tools = this.getTools()
    let prompt = `You are ${role.name}, ${role.description}\n\n`
    prompt += `Your goal: ${role.goal}\n\n`
    if (role.backstory) {
      prompt += `Background: ${role.backstory}\n\n`
    }
    if (tools.length > 0) {
      prompt += `Available tools:\n`
      for (const tool of tools) {
        prompt += `- ${tool.name}: ${tool.description}\n`
      }
      prompt += `\nYou can use these tools by calling them with the format: TOOL_CALL(name, input)\n\n`
    }
    if (Object.keys(context).length > 0) {
      prompt += `Context:\n${JSON.stringify(context, null, 2)}\n\n`
    }
    prompt += `Task: ${taskDescription}\n\n`
    prompt += `Please provide your response.`
    return prompt
  }
  extractToolCalls(output) {
    const toolCalls = []
    const toolCallRegex = /TOOL_CALL\(([^,]+),\s*([^)]+)\)/g
    let match
    while ((match = toolCallRegex.exec(output)) !== null) {
      const toolName = match[1].trim()
      const inputStr = match[2].trim()
      try {
        const input = JSON.parse(inputStr)
        toolCalls.push({ toolName, input })
      } catch {
        toolCalls.push({ toolName, input: inputStr })
      }
    }
    return toolCalls
  }
  async executeTool(toolName, input) {
    const tool = this.config.tools?.find((t) => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found for agent "${this.name}"`)
    }
    try {
      return await tool.execute(input)
    } catch (error) {
      this.logger.error(
        `Tool "${toolName}" execution failed:`,
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
})
exports.Agent = Agent
exports.Agent =
  Agent =
  Agent_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [Object, String])],
      Agent
    )
//# sourceMappingURL=agent.js.map
