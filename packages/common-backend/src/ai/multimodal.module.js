'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
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
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.MultimodalModule = void 0
const common_1 = require('@nestjs/common')
const multimodal_service_1 = require('./multimodal.service')
let MultimodalModule = class MultimodalModule {}
exports.MultimodalModule = MultimodalModule
exports.MultimodalModule = MultimodalModule = __decorate(
  [
    (0, common_1.Module)({
      providers: [multimodal_service_1.MultimodalService],
      exports: [multimodal_service_1.MultimodalService],
    }),
  ],
  MultimodalModule
)
//# sourceMappingURL=multimodal.module.js.map
