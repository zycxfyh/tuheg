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
var __importDefault =
  (this && this.__importDefault) || ((mod) => (mod && mod.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
const testing_1 = require('@nestjs/testing')
const common_1 = require('@nestjs/common')
const core_1 = require('@nestjs/core')
const supertest_1 = __importDefault(require('supertest'))
const helmet_1 = __importDefault(require('helmet'))
const health_module_1 = require('../health/health.module')
let TestExceptionFilter = class TestExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    if (exception.status && typeof exception.status === 'number') {
      response.status(exception.status).json({
        statusCode: exception.status,
        message: exception.message || 'Bad Request',
        error: exception.name || 'BadRequestException',
      })
    } else {
      response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      })
    }
  }
}
TestExceptionFilter = __decorate([(0, common_1.Catch)()], TestExceptionFilter)
describe('API Security Tests (e2e) - Framework Built-in Security', () => {
  let app
  beforeEach(async () => {
    const moduleFixture = await testing_1.Test.createTestingModule({
      imports: [health_module_1.HealthModule],
      providers: [
        {
          provide: core_1.APP_FILTER,
          useClass: TestExceptionFilter,
        },
      ],
    }).compile()
    app = moduleFixture.createNestApplication()
    app.use(
      (0, helmet_1.default)({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      })
    )
    await app.init()
  })
  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })
  describe('Security Headers', () => {
    it('should include security headers in responses', () => {
      return (0, supertest_1.default)(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('X-Content-Type-Options', 'nosniff')
        .expect('X-XSS-Protection', '1; mode=block')
        .expect('Referrer-Policy', 'strict-origin-when-cross-origin')
    })
    it('should include CSP headers', () => {
      return (0, supertest_1.default)(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-security-policy']).toBeDefined()
          expect(res.headers['content-security-policy']).toContain("default-src 'self'")
          expect(res.headers['content-security-policy']).toContain("object-src 'none'")
        })
    })
    it('should include HSTS headers', () => {
      return (0, supertest_1.default)(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('Strict-Transport-Security', /max-age=31536000/)
    })
  })
  describe('HTTP Method Handling', () => {
    it('should handle GET requests to health endpoint', () => {
      return (0, supertest_1.default)(app.getHttpServer()).get('/health').expect(200)
    })
    it('should reject unsupported methods to health endpoint', () => {
      return (0, supertest_1.default)(app.getHttpServer()).put('/health').expect(404)
    })
  })
  describe('Input Size Limits', () => {
    it('should handle reasonable payload sizes', () => {
      const normalPayload = { data: 'x'.repeat(1000) }
      return (0, supertest_1.default)(app.getHttpServer())
        .post('/health')
        .send(normalPayload)
        .expect(400)
    })
  })
  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      return (0, supertest_1.default)(app.getHttpServer())
        .post('/health')
        .set('Content-Type', 'application/json')
        .send('{invalid json')
        .expect(400)
    })
    it('should handle non-existent endpoints', () => {
      return (0, supertest_1.default)(app.getHttpServer()).get('/nonexistent-endpoint').expect(404)
    })
  })
  describe('Basic Input Validation', () => {
    it('should handle query parameters', () => {
      return (0, supertest_1.default)(app.getHttpServer()).get('/health?test=value').expect(200)
    })
    it('should handle unicode characters in query params', () => {
      return (0, supertest_1.default)(app.getHttpServer()).get('/health?name=caf%C3%A9').expect(200)
    })
  })
})
//# sourceMappingURL=api-security.e2e-spec.js.map
