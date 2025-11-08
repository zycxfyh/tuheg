import { MyTestPluginPlugin, createMyTestPluginPlugin } from './index';

describe('MyTestPluginPlugin', () => {
  let plugin: MyTestPluginPlugin;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      pluginId: 'my-test-plugin',
      config: {},
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };

    plugin = new MyTestPluginPlugin();
  });

  describe('manifest', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.manifest.id).toBe('my-test-plugin');
      expect(plugin.manifest.name).toBe('my-test-plugin');
      expect(plugin.manifest.version).toBe('1.0.0');
      expect(plugin.manifest.description).toBe('A test plugin for VCPToolBox');
      expect(plugin.manifest.author).toBe('Test Author');
    });

    it('should contribute AI tools', () => {
      expect(plugin.manifest.contributes?.aiTools).toHaveLength(1);
      expect(plugin.manifest.contributes?.aiTools?.[0].id).toBe('my-test-plugin');
      expect(plugin.manifest.contributes?.aiTools?.[0].name).toBe('my-test-plugin Tool');
    });
  });

  describe('activate', () => {
    it('should activate successfully', async () => {
      await plugin.activate(mockContext);
      expect(mockContext.logger.info).toHaveBeenCalledWith('my-test-plugin plugin activated');
    });
  });

  describe('deactivate', () => {
    it('should deactivate successfully', async () => {
      await plugin.deactivate();
      // Add assertions for cleanup logic if any
    });
  });

  describe('tool execution', () => {
    it('should execute my-test-plugin tool successfully', async () => {
      const input = { input: 'test input' };
      const result = await (plugin.manifest.contributes?.aiTools?.[0].execute as any)(input);

      expect(result).toHaveProperty('result');
      expect(result.result).toContain('Processed input: test input');
    });

    it('should handle tool execution errors', async () => {
      // Test error handling by mocking internal functions or providing invalid input
      // This depends on the actual implementation logic
    });
  });

  describe('factory function', () => {
    it('should create plugin instance', () => {
      const instance = createMyTestPluginPlugin(mockContext);
      expect(instance).toBeInstanceOf(MyTestPluginPlugin);
    });
  });
});
