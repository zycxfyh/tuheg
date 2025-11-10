// 文件路径: apps/logic-agent/src/main.ts
// 使用通用应用启动器 - 消除了重复代码

import { AppBootstrapper } from '@tuheg/infrastructure'
import { LogicAgentModule } from './logic-agent.module'

async function bootstrap() {
  const result = await AppBootstrapper.bootstrap(
    AppBootstrapper.createLogicAgentConfig(LogicAgentModule)
  )

  console.log('🚀 Logic Agent is running:')
  console.log(`   📡 Microservices: listening for tasks on the event bus`)
  console.log(`   🌐 HTTP API: ${result.httpUrl}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start Logic Agent:', err)
  process.exit(1)
})
