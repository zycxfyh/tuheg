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
exports.VcpMetaThinkingModule = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const vcp_meta_thinking_service_1 = require('./vcp-meta-thinking.service')
let VcpMetaThinkingModule = class VcpMetaThinkingModule {}
exports.VcpMetaThinkingModule = VcpMetaThinkingModule
exports.VcpMetaThinkingModule = VcpMetaThinkingModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [config_1.ConfigModule],
      providers: [vcp_meta_thinking_service_1.VcpMetaThinkingService],
      exports: [vcp_meta_thinking_service_1.VcpMetaThinkingService],
    }),
  ],
  VcpMetaThinkingModule
)
//# sourceMappingURL=vcp-meta-thinking.module.js.map
