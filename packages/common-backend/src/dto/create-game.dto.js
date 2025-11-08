Object.defineProperty(exports, '__esModule', { value: true })
exports.createNarrativeGameSchema = void 0
const zod_1 = require('zod')
exports.createNarrativeGameSchema = zod_1.z.object({
  concept: zod_1.z
    .string()
    .min(10, { message: 'Concept must be at least 10 characters long.' })
    .max(500, { message: 'Concept must be 500 characters or less.' }),
})
//# sourceMappingURL=create-game.dto.js.map
