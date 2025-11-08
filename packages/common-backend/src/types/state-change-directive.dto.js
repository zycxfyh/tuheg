Object.defineProperty(exports, '__esModule', { value: true })
exports.directiveSetSchema = exports.stateChangeDirectiveSchema = void 0
const zod_1 = require('zod')
const numericOperationSchema = zod_1.z.object({
  op: zod_1.z.enum(['set', 'increment', 'decrement']),
  value: zod_1.z.number(),
})
const stringOperationSchema = zod_1.z.object({
  op: zod_1.z.enum(['set', 'append', 'prepend']),
  value: zod_1.z.string(),
})
const characterUpdateSchema = zod_1.z.object({
  hp: numericOperationSchema.optional(),
  mp: numericOperationSchema.optional(),
  status: stringOperationSchema.optional(),
})
exports.stateChangeDirectiveSchema = zod_1.z.object({
  op: zod_1.z.enum(['update_character', 'update_world_book']),
  targetId: zod_1.z.string(),
  payload: zod_1.z.union([characterUpdateSchema, zod_1.z.record(zod_1.z.string(), zod_1.z.any())]),
})
exports.directiveSetSchema = zod_1.z.array(exports.stateChangeDirectiveSchema)
//# sourceMappingURL=state-change-directive.dto.js.map
