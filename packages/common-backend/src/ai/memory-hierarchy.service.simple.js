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
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var MemoryHierarchyService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.MemoryHierarchyService = void 0
const common_1 = require('@nestjs/common')
const prisma_service_1 = require('../prisma/prisma.service')
let MemoryHierarchyService = (MemoryHierarchyService_1 = class MemoryHierarchyService {
  prisma
  logger = new common_1.Logger(MemoryHierarchyService_1.name)
  constructor(prisma) {
    this.prisma = prisma
  }
  async getMemories(gameId, limit) {
    return this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
  async createMemory(gameId, content) {
    return this.prisma.memory.create({
      data: {
        gameId,
        content,
      },
    })
  }
  async deleteMemory(memoryId) {
    return this.prisma.memory.delete({
      where: { id: memoryId },
    })
  }
  async getMemoryStats(gameId) {
    const count = await this.prisma.memory.count({
      where: { gameId },
    })
    return { total: count }
  }
  async cleanupOldMemories(gameId, keepCount = 100) {
    const memoriesToDelete = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      skip: keepCount,
      select: { id: true },
    })
    if (memoriesToDelete.length === 0) {
      return 0
    }
    const result = await this.prisma.memory.deleteMany({
      where: {
        id: { in: memoriesToDelete.map((m) => m.id) },
      },
    })
    this.logger.log(`Cleaned up ${result.count} old memories for game ${gameId}`)
    return result.count
  }
})
exports.MemoryHierarchyService = MemoryHierarchyService
exports.MemoryHierarchyService =
  MemoryHierarchyService =
  MemoryHierarchyService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [prisma_service_1.PrismaService]),
      ],
      MemoryHierarchyService
    )
//# sourceMappingURL=memory-hierarchy.service.simple.js.map
