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
exports.TimeAwareVectorSearchModule = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const prisma_module_1 = require('../prisma/prisma.module')
const vector_search_module_1 = require('./vector-search.module')
const time_aware_vector_search_service_1 = require('./time-aware-vector-search.service')
let TimeAwareVectorSearchModule = class TimeAwareVectorSearchModule {}
exports.TimeAwareVectorSearchModule = TimeAwareVectorSearchModule
exports.TimeAwareVectorSearchModule = TimeAwareVectorSearchModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        config_1.ConfigModule,
        prisma_module_1.PrismaModule,
        vector_search_module_1.VectorSearchModule,
      ],
      providers: [time_aware_vector_search_service_1.TimeAwareVectorSearchService],
      exports: [time_aware_vector_search_service_1.TimeAwareVectorSearchService],
    }),
  ],
  TimeAwareVectorSearchModule
)
//# sourceMappingURL=time-aware-vector-search.module.js.map
