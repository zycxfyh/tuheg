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
exports.VcpPluginSystemModule = void 0
const common_1 = require('@nestjs/common')
const event_emitter_1 = require('@nestjs/event-emitter')
const vcp_plugin_system_service_1 = require('./vcp-plugin-system.service')
let VcpPluginSystemModule = class VcpPluginSystemModule {}
exports.VcpPluginSystemModule = VcpPluginSystemModule
exports.VcpPluginSystemModule = VcpPluginSystemModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [event_emitter_1.EventEmitterModule.forRoot()],
      providers: [vcp_plugin_system_service_1.VcpPluginSystemService],
      exports: [vcp_plugin_system_service_1.VcpPluginSystemService],
    }),
  ],
  VcpPluginSystemModule
)
//# sourceMappingURL=vcp-plugin-system.module.js.map
