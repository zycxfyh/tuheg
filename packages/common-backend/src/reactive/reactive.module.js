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
exports.ReactiveModule = void 0
const common_1 = require('@nestjs/common')
const event_stream_1 = require('./event-stream')
let ReactiveModule = class ReactiveModule {}
exports.ReactiveModule = ReactiveModule
exports.ReactiveModule = ReactiveModule = __decorate(
  [
    (0, common_1.Module)({
      providers: [event_stream_1.EventStream],
      exports: [event_stream_1.EventStream],
    }),
  ],
  ReactiveModule
)
//# sourceMappingURL=reactive.module.js.map
