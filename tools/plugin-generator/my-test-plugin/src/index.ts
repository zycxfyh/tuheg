import { Plugin, PluginContext, AiToolContribution } from '@tuheg/common-backend';

/**
 * my-test-plugin - A test plugin for VCPToolBox
 *
 * This is a VCPToolBox plugin that provides A test plugin for VCPToolBox
 */
export class MyTestPluginPlugin implements Plugin {
  manifest = {
    id: 'my-test-plugin',
    name: 'my-test-plugin',
    version: '1.0.0',
    description: 'A test plugin for VCPToolBox',
    author: 'Test Author',
    activationEvents: ['onStartup'],
    contributes: {
      aiTools: [
        {
          id: 'my-test-plugin',
          name: 'my-test-plugin Tool',
          description: 'A test plugin for VCPToolBox',
          execute: this.executeMyTestPluginTool.bind(this),
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description: 'Input for the my-test-plugin tool'
              }
            },
            required: ['input']
          }
        }
      ] as AiToolContribution[]
    }
  };

  async activate(context: PluginContext): Promise<void> {
    context.logger.info('my-test-plugin plugin activated');

    // Plugin activation logic
    // Register event listeners, initialize resources, etc.
  }

  async deactivate(): Promise<void> {
    // Plugin deactivation logic
    // Clean up resources, close connections, etc.
  }

  /**
   * Execute the my-test-plugin tool
   */
  private async executeMyTestPluginTool(input: { input: string }): Promise<{ result: string }> {
    try {
      // Tool execution logic here
      const { input: userInput } = input;

      // Example implementation - replace with actual logic
      const result = `Processed input: ${userInput}`;

      return {
        result
      };
    } catch (error) {
      throw new Error(`my-test-plugin tool execution failed: ${error.message}`);
    }
  }
}

// Export factory function for the plugin system
export default function createMyTestPluginPlugin(context: PluginContext): Plugin {
  return new MyTestPluginPlugin();
}
