// 文件路径: apps/narrative-agent/src/main.ts
// 使用通用应用启动器 - 消除了重复代码

import { AppBootstrapper } from '@tuheg/infrastructure'
import { NarrativeAgentModule } from './narrative-agent.module'

async function bootstrap() {
  const result = await AppBootstrapper.bootstrap(
    AppBootstrapper.createNarrativeAgentConfig(NarrativeAgentModule)
  )

  console.log('🚀 Narrative Agent is running:')
  console.log(`   📡 Microservices: listening for tasks on the event bus`)
  console.log(`   🌐 HTTP API: ${result.httpUrl}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start Narrative Agent:', err)
  process.exit(1)
})
