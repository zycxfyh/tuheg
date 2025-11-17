import { Injectable } from '@nestjs/common'
import { ToolPlugin, ToolRegistry, ToolSearchQuery, ToolRegistryStats, ToolCategory } from '../standard-protocol/tool-system.interface'

@Injectable()
export class ToolRegistryImpl implements ToolRegistry {
  private readonly tools = new Map<string, ToolPlugin>()

  async registerTool(tool: ToolPlugin): Promise<void> {
    this.tools.set(tool.id, tool)
  }

  async unregisterTool(toolId: string): Promise<void> {
    this.tools.delete(toolId)
  }

  async getTool(toolId: string): Promise<ToolPlugin | null> {
    return this.tools.get(toolId) || null
  }

  async getAllTools(): Promise<ToolPlugin[]> {
    return Array.from(this.tools.values())
  }

  async getToolsByCategory(category: ToolCategory): Promise<ToolPlugin[]> {
    return Array.from(this.tools.values()).filter(tool => tool.category === category)
  }

  async getToolsByPermissions(permissions: any[]): Promise<ToolPlugin[]> {
    return Array.from(this.tools.values()).filter(tool =>
      permissions.every(perm => tool.permissions.includes(perm))
    )
  }

  async searchTools(query: ToolSearchQuery): Promise<ToolPlugin[]> {
    let tools = Array.from(this.tools.values())

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(keyword) ||
        tool.description.toLowerCase().includes(keyword)
      )
    }

    if (query.category) {
      tools = tools.filter(tool => tool.category === query.category)
    }

    return tools
  }

  async hasTool(toolId: string): Promise<boolean> {
    return this.tools.has(toolId)
  }

  getToolStats(): ToolRegistryStats {
    const tools = Array.from(this.tools.values())
    const categoryDistribution = {} as any

    tools.forEach(tool => {
      categoryDistribution[tool.category] = (categoryDistribution[tool.category] || 0) + 1
    })

    return {
      totalTools: tools.length,
      categoryDistribution,
      permissionDistribution: {} as any,
      enabledTools: tools.length,
      disabledTools: 0,
      lastUpdated: new Date()
    }
  }
}
