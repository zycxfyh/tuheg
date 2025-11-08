# my-test-plugin

A test plugin for VCPToolBox

[![npm version](https://badge.fury.io/js/my-test-plugin.svg)](https://badge.fury.io/js/my-test-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VCPToolBox Plugin](https://img.shields.io/badge/VCPToolBox-Plugin-blue.svg)](https://tuheg.dev)

A VCPToolBox plugin that provides A test plugin for VCPToolBox.

## Features

- 🚀 **High Performance**: Optimized for speed and efficiency
- 🔧 **Easy Integration**: Seamless integration with VCPToolBox
- 📚 **Well Documented**: Comprehensive documentation and examples
- 🧪 **Thoroughly Tested**: High test coverage and quality assurance

## Installation

```bash
npm install my-test-plugin
# or
yarn add my-test-plugin
```

## Usage

### Basic Usage

```typescript
import { MyTestPluginPlugin } from 'my-test-plugin';

// Create and activate the plugin
const plugin = new MyTestPluginPlugin();
await plugin.activate(context);

// Use the AI tool
const result = await plugin.executeMyTestPluginTool({
  input: 'your input here'
});

console.log(result);
```

### VCPToolBox Integration

```typescript
import { PluginLoader } from '@tuheg/common-backend';
import my-test-plugin from 'my-test-plugin';

const loader = new PluginLoader();
await loader.loadPlugin(my-test-plugin);

// The plugin is now available in the VCPToolBox ecosystem
```

## API Reference

### `MyTestPluginPlugin`

Main plugin class that implements the VCPToolBox plugin interface.

#### Methods

- `activate(context: PluginContext)`: Activate the plugin
- `deactivate()`: Deactivate the plugin
- `executeMyTestPluginTool(input: { input: string })`: Execute the AI tool

### Tool Input Schema

```typescript
{
  type: 'object',
  properties: {
    input: {
      type: 'string',
      description: 'Input for the my-test-plugin tool'
    }
  },
  required: ['input']
}
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd my-test-plugin

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Development mode
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test -- --coverage
```

### Building

```bash
# Build for production
npm run build

# The built files will be in the `dist` directory
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://tuheg.dev/docs/plugins/my-test-plugin)
- 🐛 [Issues](https://github.com/zycxfyh/tuheg/issues)
- 💬 [Discussions](https://github.com/zycxfyh/tuheg/discussions)
- 📧 [Email Support](mailto:support@tuheg.dev)

## Related Projects

- [VCPToolBox](https://github.com/zycxfyh/tuheg) - The core plugin system
- [Plugin Marketplace](https://marketplace.tuheg.dev) - Official plugin marketplace

---

Made with ❤️ by [Test Author](https://github.com/Test Author)
