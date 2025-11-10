// 文件路径: apps/creation-agent/src/main.ts
// 使用通用应用启动器 - 消除了重复代码

import { AppBootstrapper } from '@tuheg/infrastructure'
import { CreationAgentModule } from './creation-agent.module'

async function bootstrap() {
  const result = await AppBootstrapper.bootstrap(
    AppBootstrapper.createCreationAgentConfig(CreationAgentModule)
  )

  console.log('🚀 Creation Agent is running:')
  console.log(`   📡 Microservices: listening for tasks on the event bus`)
  console.log(`   🌐 HTTP API: ${result.httpUrl}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start Creation Agent:', err)
  process.exit(1)
})
