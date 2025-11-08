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
exports.CrewModule = void 0
const common_1 = require('@nestjs/common')
const agent_1 = require('./agent')
const crew_1 = require('./crew')
const task_1 = require('./task')
let CrewModule = class CrewModule {}
exports.CrewModule = CrewModule
exports.CrewModule = CrewModule = __decorate(
  [
    (0, common_1.Module)({
      providers: [agent_1.Agent, task_1.Task, crew_1.Crew],
      exports: [agent_1.Agent, task_1.Task, crew_1.Crew],
    }),
  ],
  CrewModule
)
//# sourceMappingURL=crew.module.js.map
