import { Module } from '@nestjs/common'
import { VectorDatabaseServiceImpl } from './vector-database.service'
import { PgVectorDatabase } from './pgvector-database.impl'
import { HybridSearchEngineImpl } from './hybrid-search.impl'
import { VectorCompressorImpl } from './vector-compressor.impl'
import { VectorDatabaseController } from './controllers/vector-database.controller'

@Module({
  providers: [
    {
      provide: 'VectorDatabaseService',
      useClass: VectorDatabaseServiceImpl,
    },
    PgVectorDatabase,
    HybridSearchEngineImpl,
    VectorCompressorImpl,
  ],
  controllers: [VectorDatabaseController],
  exports: [
    'VectorDatabaseService',
    PgVectorDatabase,
    HybridSearchEngineImpl,
    VectorCompressorImpl,
  ],
})
export class VectorDatabaseModule {}
