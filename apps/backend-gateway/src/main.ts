// 文件路径: apps/backend-gateway/src/main.ts
// 使用通用应用启动器 - 消除了重复代码

import { AppBootstrapper } from '@tuheg/infrastructure'
import { AppModule } from './app.module'

async function bootstrap() {
  const result = await AppBootstrapper.bootstrap(AppBootstrapper.createGatewayConfig(AppModule))

  console.log('🚀 Backend Gateway is running:')
  console.log(`   🌐 HTTP API: ${result.httpUrl}`)
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Backend Gateway:', err)
  process.exit(1)
})
