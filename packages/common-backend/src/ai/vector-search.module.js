var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
Object.defineProperty(exports, '__esModule', { value: true })
exports.VectorSearchModule = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const prisma_module_1 = require('../prisma/prisma.module')
const ai_provider_factory_1 = require('./ai-provider.factory')
const dynamic_ai_scheduler_service_1 = require('./dynamic-ai-scheduler.service')
const vector_search_service_1 = require('./vector-search.service')
let VectorSearchModule = class VectorSearchModule {}
exports.VectorSearchModule = VectorSearchModule
exports.VectorSearchModule = VectorSearchModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [config_1.ConfigModule, prisma_module_1.PrismaModule],
      providers: [
        vector_search_service_1.VectorSearchService,
        dynamic_ai_scheduler_service_1.DynamicAiSchedulerService,
        ai_provider_factory_1.AiProviderFactory,
      ],
      exports: [vector_search_service_1.VectorSearchService],
    }),
  ],
  VectorSearchModule
)
//# sourceMappingURL=vector-search.module.js.map
