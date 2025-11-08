// VCPToolBox SDK - 信息命令

export class InfoCommand {
  async execute(): Promise<void> {
    console.log('ℹ️  VCPToolBox SDK 信息\n')

    console.log('版本信息:')
    console.log('  SDK版本: 1.0.0')
    console.log('  兼容平台版本: 1.0.0+')
    console.log('  Node.js要求: >=16.0.0\n')

    console.log('环境信息:')
    console.log(`  Node.js: ${process.version}`)
    console.log(`  平台: ${process.platform}`)
    console.log(`  架构: ${process.arch}\n`)

    console.log('配置信息:')
    console.log('  默认仓库: https://registry.creation-ring.com')
    console.log('  API端点: https://api.creation-ring.com/v1')
    console.log('  超时时间: 30000ms\n')

    console.log('支持的插件类型:')
    console.log('  • static - 静态插件')
    console.log('  • messagePreprocessor - 消息预处理器')
    console.log('  • synchronous - 同步插件')
    console.log('  • asynchronous - 异步插件')
    console.log('  • service - 服务插件')
    console.log('  • dynamic - 动态插件')
  }
}
