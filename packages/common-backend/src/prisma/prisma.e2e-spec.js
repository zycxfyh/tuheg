'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const testing_1 = require('@nestjs/testing')
const prisma_service_1 = require('./prisma.service')
const prisma_module_1 = require('./prisma.module')
describe('PrismaService (e2e)', () => {
  let prisma
  let module
  let databaseAvailable = false
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, skipping database integration tests')
      return
    }
    try {
      module = await testing_1.Test.createTestingModule({
        imports: [prisma_module_1.PrismaModule],
      }).compile()
      prisma = module.get(prisma_service_1.PrismaService)
      await prisma.onModuleInit()
      databaseAvailable = true
    } catch (error) {
      console.warn('Database not available, skipping database integration tests:', error)
      databaseAvailable = false
    }
  }, 30000)
  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
    if (module) {
      await module.close()
    }
  }, 30000)
  it('should connect to database', async () => {
    if (!databaseAvailable) {
      console.log('Skipping: Database not available')
      return
    }
    const result = await prisma.$queryRaw`SELECT 1 as value`
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })
  it('should handle connection pool correctly', async () => {
    if (!databaseAvailable) {
      console.log('Skipping: Database not available')
      return
    }
    const promises = Array(5)
      .fill(null)
      .map(async () => {
        return prisma.$queryRaw`SELECT NOW() as time`
      })
    const results = await Promise.all(promises)
    expect(results).toHaveLength(5)
    results.forEach((result) => {
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
  it('should execute transaction correctly', async () => {
    if (!databaseAvailable) {
      console.log('Skipping: Database not available')
      return
    }
    await prisma.$transaction(async (tx) => {
      const result = await tx.$queryRaw`SELECT 1 as value`
      expect(result).toBeDefined()
      return result
    })
  })
  it('should handle query errors gracefully', async () => {
    if (!databaseAvailable) {
      console.log('Skipping: Database not available')
      return
    }
    await expect(prisma.$queryRaw`SELECT * FROM non_existent_table`).rejects.toThrow()
  })
})
//# sourceMappingURL=prisma.e2e-spec.js.map
