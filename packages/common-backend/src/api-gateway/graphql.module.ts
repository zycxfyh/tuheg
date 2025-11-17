import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { join } from 'path'
import { GameResolver } from './resolvers/game.resolver'
import { UserResolver } from './resolvers/user.resolver'
import { TenantResolver } from './resolvers/tenant.resolver'
import { OrchestrationResolver } from './resolvers/orchestration.resolver'
import { GameService } from '../games/game.service'
import { UserService } from '../users/user.service'
import { TenantService } from '../multi-tenant/tenant.service'
import { WorkflowOrchestratorService } from '../orchestration/workflow-orchestrator.service'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        // 自定义错误格式
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path,
          timestamp: new Date().toISOString(),
        }
      },
    }),
  ],
  providers: [
    GameResolver,
    UserResolver,
    TenantResolver,
    OrchestrationResolver,
    GameService,
    UserService,
    TenantService,
    WorkflowOrchestratorService,
  ],
  exports: [GraphQLModule],
})
export class ApiGraphQLModule {}
