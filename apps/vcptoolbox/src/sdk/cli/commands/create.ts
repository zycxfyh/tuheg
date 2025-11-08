// VCPToolBox SDK - 创建插件命令

import * as fs from 'fs'
import * as path from 'path'
import type { PluginType } from '../../types'

export interface CreateOptions {
  type: PluginType
  description?: string
  author?: string
  typescript: boolean
}

export class CreateCommand {
  async execute(name: string, options: CreateOptions): Promise<void> {
    console.log(`🚀 创建 ${options.type} 插件: ${name}`)

    try {
      // 创建项目目录
      const projectDir = path.join(process.cwd(), name)
      await this.createProjectDirectory(projectDir)

      // 创建项目文件
      await this.createProjectFiles(projectDir, name, options)

      // 初始化package.json
      await this.createPackageJson(projectDir, name, options)

      // 创建README
      await this.createReadme(projectDir, name, options)

      // 创建示例代码
      await this.createExampleCode(projectDir, name, options)

      console.log(`✅ 插件项目创建成功: ${projectDir}`)
      console.log(`📖 运行 'cd ${name} && npm install' 安装依赖`)
      console.log(`🚀 运行 'npm run dev' 启动开发服务器`)
    } catch (error: any) {
      console.error(`❌ 创建插件失败: ${error.message}`)
      process.exit(1)
    }
  }

  private async createProjectDirectory(dir: string): Promise<void> {
    if (fs.existsSync(dir)) {
      throw new Error(`目录已存在: ${dir}`)
    }

    fs.mkdirSync(dir, { recursive: true })
  }

  private async createProjectFiles(
    projectDir: string,
    name: string,
    options: CreateOptions
  ): Promise<void> {
    const files = [
      '.gitignore',
      'tsconfig.json',
      'package.json',
      'README.md',
      'src/index.ts',
      'src/plugin.ts',
      'src/manifest.json',
      'tests/plugin.test.ts',
    ]

    for (const file of files) {
      const filePath = path.join(projectDir, file)
      const dir = path.dirname(filePath)

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const content = this.getFileContent(file, name, options)
      fs.writeFileSync(filePath, content, 'utf-8')
    }
  }

  private getFileContent(file: string, name: string, options: CreateOptions): string {
    switch (file) {
      case '.gitignore':
        return this.getGitignoreContent()

      case 'tsconfig.json':
        return this.getTsconfigContent()

      case 'package.json':
        return this.getPackageJsonContent(name, options)

      case 'README.md':
        return this.getReadmeContent(name, options)

      case 'src/index.ts':
        return this.getIndexContent(name, options)

      case 'src/plugin.ts':
        return this.getPluginContent(name, options)

      case 'src/manifest.json':
        return this.getManifestContent(name, options)

      case 'tests/plugin.test.ts':
        return this.getTestContent(name, options)

      default:
        return ''
    }
  }

  private getGitignoreContent(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/
*.lcov

# Temporary files
*.tmp
*.temp
`
  }

  private getTsconfigContent(): string {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}`
  }

  private getPackageJsonContent(name: string, options: CreateOptions): string {
    const packageJson = {
      name: `vcptoolbox-${name}`,
      version: '1.0.0',
      description: options.description || `VCPToolBox ${options.type} plugin`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
        test: 'jest',
        lint: 'eslint src/**/*.ts',
        clean: 'rm -rf dist',
      },
      keywords: ['vcptoolbox', 'plugin', options.type],
      author: options.author || '',
      license: 'MIT',
      dependencies: {
        '@creation-ring/vcptoolbox-sdk': '^1.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        jest: '^29.0.0',
        '@types/jest': '^29.0.0',
        eslint: '^8.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
      },
      vcptoolbox: {
        type: options.type,
        compatibility: {
          minVersion: '1.0.0',
          vcpProtocolVersion: '1.0.0',
          platforms: ['web', 'desktop'],
        },
      },
    }

    return JSON.stringify(packageJson, null, 2)
  }

  private getReadmeContent(name: string, options: CreateOptions): string {
    return `# ${name}

${options.description || `A VCPToolBox ${options.type} plugin for Creation Ring AI narrative platform.`}

## Installation

\`\`\`bash
npm install ${name}
# or
yarn add ${name}
\`\`\`

## Usage

\`\`\`typescript
import { ${this.capitalize(name)}Plugin } from '${name}'

// Create and activate plugin
const plugin = new ${this.capitalize(name)}Plugin()
await plugin.activate(context)
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Build plugin
npm run build

# Run tests
npm test

# Start development mode
npm run dev
\`\`\`

## License

MIT
`
  }

  private getIndexContent(name: string, options: CreateOptions): string {
    return `// ${name} - VCPToolBox Plugin
export { ${this.capitalize(name)}Plugin } from './plugin'
export type { ${this.capitalize(name)}PluginConfig } from './plugin'
`
  }

  private getPluginContent(name: string, options: CreateOptions): string {
    const className = this.capitalize(name)
    const configInterface = `${className}Config`

    return `import { VCPPlugin, PluginContext, PluginType } from '@creation-ring/vcptoolbox-sdk'

export interface ${configInterface} {
  // Add your plugin configuration here
  enabled: boolean
  [key: string]: any
}

export class ${className}Plugin implements VCPPlugin {
  id = '${name}'
  name = '${this.capitalize(name)}'
  version = '1.0.0'
  type: PluginType = '${options.type}'
  description = '${options.description || `A ${options.type} plugin for VCPToolBox`}'

  private config: ${configInterface} = {
    enabled: true
  }

  async activate(context: PluginContext): Promise<void> {
    console.log(\`🚀 ${this.capitalize(name)} plugin activated\`)

    // Initialize plugin
    this.setupEventListeners(context)
    this.registerCapabilities(context)

    // Plugin-specific activation logic
    await this.onActivate(context)
  }

  async deactivate(): Promise<void> {
    console.log(\`🛑 ${this.capitalize(name)} plugin deactivated\`)

    // Plugin-specific deactivation logic
    await this.onDeactivate()
  }

  // Plugin-specific activation logic
  private async onActivate(context: PluginContext): Promise<void> {
    // Implement your plugin activation logic here
    switch (this.type) {
      case 'static':
        await this.setupStaticCapabilities(context)
        break
      case 'messagePreprocessor':
        await this.setupMessagePreprocessing(context)
        break
      case 'synchronous':
        await this.setupSynchronousTools(context)
        break
      case 'asynchronous':
        await this.setupAsynchronousTools(context)
        break
      case 'service':
        await this.setupService(context)
        break
      case 'dynamic':
        await this.setupDynamicCapabilities(context)
        break
    }
  }

  // Plugin-specific deactivation logic
  private async onDeactivate(): Promise<void> {
    // Cleanup logic here
  }

  // Setup event listeners
  private setupEventListeners(context: PluginContext): void {
    // Register event listeners
  }

  // Register plugin capabilities
  private registerCapabilities(context: PluginContext): void {
    // Register plugin capabilities with the platform
  }

  // Static plugin setup
  private async setupStaticCapabilities(context: PluginContext): Promise<void> {
    // Setup static data and knowledge
  }

  // Message preprocessor setup
  private async setupMessagePreprocessing(context: PluginContext): Promise<void> {
    // Setup message preprocessing logic
  }

  // Synchronous tools setup
  private async setupSynchronousTools(context: PluginContext): Promise<void> {
    // Register synchronous tools
  }

  // Asynchronous tools setup
  private async setupAsynchronousTools(context: PluginContext): Promise<void> {
    // Register asynchronous tools
  }

  // Service setup
  private async setupService(context: PluginContext): Promise<void> {
    // Setup background service
  }

  // Dynamic capabilities setup
  private async setupDynamicCapabilities(context: PluginContext): Promise<void> {
    // Setup dynamic learning and adaptation
  }

  // Configuration methods
  getConfig(): ${configInterface} {
    return { ...this.config }
  }

  updateConfig(updates: Partial<${configInterface}>): void {
    this.config = { ...this.config, ...updates }
  }
}
`
  }

  private getManifestContent(name: string, options: CreateOptions): string {
    const manifest = {
      id: name,
      name: this.capitalize(name),
      version: '1.0.0',
      type: options.type,
      description: options.description || `A ${options.type} plugin for VCPToolBox`,
      author: options.author || '',
      compatibility: {
        minVersion: '1.0.0',
        maxVersion: '',
        vcpProtocolVersion: '1.0.0',
        platforms: ['web', 'desktop', 'mobile'],
        supportedModels: ['gpt-4', 'claude-3'],
        memoryRequirements: {
          minRAM: 64,
          recommendedRAM: 128,
        },
      },
      capabilities: this.getDefaultCapabilities(options.type),
      dependencies: [],
      keywords: ['vcptoolbox', 'plugin', options.type],
      repository: '',
      license: 'MIT',
    }

    return JSON.stringify(manifest, null, 2)
  }

  private getTestContent(name: string, options: CreateOptions): string {
    const className = this.capitalize(name)

    return `import { ${className}Plugin } from '../src/plugin'

describe('${className}Plugin', () => {
  let plugin: ${className}Plugin

  beforeEach(() => {
    plugin = new ${className}Plugin()
  })

  it('should have correct basic properties', () => {
    expect(plugin.id).toBe('${name}')
    expect(plugin.name).toBe('${this.capitalize(name)}')
    expect(plugin.version).toBe('1.0.0')
    expect(plugin.type).toBe('${options.type}')
  })

  it('should activate successfully', async () => {
    // Mock context - in real tests, use SDK test utilities
    const mockContext = {} as any

    // Note: This would need proper mock context in real implementation
    // await expect(plugin.activate(mockContext)).resolves.toBeUndefined()
    expect(plugin).toBeDefined()
  })

  it('should have default configuration', () => {
    const config = plugin.getConfig()
    expect(config).toBeDefined()
    expect(config.enabled).toBe(true)
  })

  it('should update configuration', () => {
    plugin.updateConfig({ enabled: false })
    const config = plugin.getConfig()
    expect(config.enabled).toBe(false)
  })
})
`
  }

  private getDefaultCapabilities(type: PluginType): any {
    switch (type) {
      case 'static':
        return {
          providesStaticData: true,
          dataTypes: ['knowledge', 'context'],
        }
      case 'messagePreprocessor':
        return {
          processesMessages: true,
          supportedFormats: ['text', 'image', 'audio'],
        }
      case 'synchronous':
        return {
          providesTools: true,
          executionMode: 'sync',
          avgExecutionTime: 100,
        }
      case 'asynchronous':
        return {
          providesTools: true,
          executionMode: 'async',
          supportsProgress: true,
        }
      case 'service':
        return {
          providesService: true,
          backgroundProcessing: true,
        }
      case 'dynamic':
        return {
          dynamicLearning: true,
          selfImprovement: true,
        }
      default:
        return {}
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
  }

  private async createPackageJson(
    projectDir: string,
    name: string,
    options: CreateOptions
  ): Promise<void> {
    // package.json 已经在 createProjectFiles 中创建，这里可以添加额外逻辑
  }

  private async createReadme(
    projectDir: string,
    name: string,
    options: CreateOptions
  ): Promise<void> {
    // README.md 已经在 createProjectFiles 中创建，这里可以添加额外逻辑
  }

  private async createExampleCode(
    projectDir: string,
    name: string,
    options: CreateOptions
  ): Promise<void> {
    // 创建示例代码目录和文件
    const examplesDir = path.join(projectDir, 'examples')
    fs.mkdirSync(examplesDir, { recursive: true })

    const exampleContent = `// ${name} - 使用示例

import { ${this.capitalize(name)}Plugin } from '../src'

// 创建插件实例
const plugin = new ${this.capitalize(name)}Plugin()

// 配置插件
plugin.updateConfig({
  enabled: true,
  // 添加其他配置...
})

// 使用插件
async function example() {
  // 这里添加使用示例
  console.log('Plugin example:', plugin.getConfig())
}

example().catch(console.error)
`

    fs.writeFileSync(path.join(examplesDir, 'usage.ts'), exampleContent, 'utf-8')
  }
}
