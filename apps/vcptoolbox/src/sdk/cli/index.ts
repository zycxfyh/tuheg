// VCPToolBox SDK - CLI 工具
// 命令行接口，为开发者提供便捷的开发工具

import { Command } from 'commander'
import { CreateCommand } from './commands/create'
import { BuildCommand } from './commands/build'
import { TestCommand } from './commands/test'
import { PublishCommand } from './commands/publish'
import { ValidateCommand } from './commands/validate'
import { DevCommand } from './commands/dev'
import { InfoCommand } from './commands/info'

const program = new Command()

// CLI 基础信息
program
  .name('vcptoolbox')
  .description('VCPToolBox SDK - 创世星环AI叙事平台插件开发工具')
  .version('1.0.0')

// 创建插件命令
program
  .command('create <name>')
  .description('创建新的插件项目')
  .option(
    '-t, --type <type>',
    '插件类型 (static|messagePreprocessor|synchronous|asynchronous|service|dynamic)',
    'static'
  )
  .option('-d, --description <description>', '插件描述')
  .option('-a, --author <author>', '插件作者')
  .option('--typescript', '使用TypeScript', true)
  .option('--no-typescript', '不使用TypeScript')
  .action(async (name, options) => {
    const command = new CreateCommand()
    await command.execute(name, options)
  })

// 构建插件命令
program
  .command('build')
  .description('构建插件项目')
  .option('-o, --out-dir <dir>', '输出目录', 'dist')
  .option('-m, --minify', '压缩代码', false)
  .option('-s, --sourcemap', '生成source map', false)
  .option('-w, --watch', '监听模式', false)
  .action(async (options) => {
    const command = new BuildCommand()
    await command.execute(options)
  })

// 测试插件命令
program
  .command('test')
  .description('运行插件测试')
  .option('-u, --unit', '运行单元测试', true)
  .option('-i, --integration', '运行集成测试', false)
  .option('-p, --performance', '运行性能测试', false)
  .option('-c, --coverage', '生成覆盖率报告', false)
  .option('-w, --watch', '监听模式', false)
  .option('-v, --verbose', '详细输出', false)
  .action(async (options) => {
    const command = new TestCommand()
    await command.execute(options)
  })

// 发布插件命令
program
  .command('publish')
  .description('发布插件到市场')
  .option('-r, --registry <url>', '插件仓库URL')
  .option('-t, --tag <tag>', '发布标签', 'latest')
  .option('--access <access>', '访问级别 (public|restricted)', 'public')
  .option('--dry-run', '空运行模式', false)
  .option('-f, --force', '强制发布', false)
  .action(async (options) => {
    const command = new PublishCommand()
    await command.execute(options)
  })

// 验证插件命令
program
  .command('validate')
  .description('验证插件配置和代码')
  .option('-f, --fix', '自动修复问题', false)
  .option('-s, --strict', '严格模式', false)
  .action(async (options) => {
    const command = new ValidateCommand()
    await command.execute(options)
  })

// 开发服务器命令
program
  .command('dev')
  .description('启动开发服务器')
  .option('-p, --port <port>', '服务器端口', '3000')
  .option('-h, --host <host>', '服务器主机', 'localhost')
  .option('-o, --open', '自动打开浏览器', false)
  .option('--cors', '启用CORS', false)
  .action(async (options) => {
    const command = new DevCommand()
    await command.execute(options)
  })

// 信息命令
program
  .command('info')
  .description('显示环境和配置信息')
  .action(async () => {
    const command = new InfoCommand()
    await command.execute()
  })

// 全局选项
program
  .option('-v, --verbose', '详细输出')
  .option('--debug', '调试模式')
  .option('-c, --config <file>', '配置文件路径')

// 错误处理
program.on('command:*', (unknownCommand) => {
  console.error(`未知命令: ${unknownCommand[0]}`)
  console.log(`运行 'vcptoolbox --help' 查看可用命令`)
  process.exit(1)
})

// 解析命令行参数
program.parse(process.argv)

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
