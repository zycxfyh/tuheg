var __importDefault =
  (this && this.__importDefault) || ((mod) => (mod && mod.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
const testing_1 = require('@nestjs/testing')
const supertest_1 = __importDefault(require('supertest'))
const health_module_1 = require('./health.module')
describe('Health (e2e)', () => {
  let app
  beforeEach(async () => {
    const moduleFixture = await testing_1.Test.createTestingModule({
      imports: [health_module_1.HealthModule],
    }).compile()
    app = moduleFixture.createNestApplication()
    await app.init()
  })
  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })
  it('/health (GET) - should return health status', () => {
    return (0, supertest_1.default)(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status')
        expect(res.body).toHaveProperty('timestamp')
        expect(res.body.status).toBe('ok')
        expect(res.body.timestamp).toBeDefined()
        const timestamp = new Date(res.body.timestamp)
        expect(timestamp).toBeInstanceOf(Date)
        expect(isNaN(timestamp.getTime())).toBe(false)
      })
  })
  it('/health (GET) - should handle multiple requests', async () => {
    const promises = Array(5)
      .fill(null)
      .map(() => (0, supertest_1.default)(app.getHttpServer()).get('/health').expect(200))
    const responses = await Promise.all(promises)
    responses.forEach((res) => {
      expect(res.body.status).toBe('ok')
      expect(res.body.timestamp).toBeDefined()
    })
  })
  it('/health (GET) - should return proper content type', () => {
    return (0, supertest_1.default)(app.getHttpServer())
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200)
  })
})
//# sourceMappingURL=health.e2e-spec.js.map
