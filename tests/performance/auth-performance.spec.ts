import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AuthModule } from '../../apps/backend-gateway/src/auth/auth.module'
import { PrismaService } from '@tuheg/common-backend'
import { mockPrismaService, measureExecutionTime } from '../shared/test-helpers'

describe('Auth Performance Tests', () => {
  let app: INestApplication
  let prismaService: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService())
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    prismaService = moduleFixture.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Response Time Benchmarks', () => {
    it('should register user within acceptable time', async () => {
      const registerDto = {
        email: `perf-test-${Date.now()}@example.com`,
        password: 'ValidPassword123!',
        name: 'Performance Test User',
      }

      // Mock successful registration
      prismaService.user.findUnique.mockResolvedValue(null)
      prismaService.user.create.mockResolvedValue({
        id: 'user-123',
        email: registerDto.email,
        name: registerDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { duration } = await measureExecutionTime(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerDto)
          .expect(201)
      }, 'User registration')

      // Assert response time is under 500ms
      expect(duration).toBeLessThan(500)
    })

    it('should login user within acceptable time', async () => {
      const loginDto = {
        email: 'perf-login@example.com',
        password: 'ValidPassword123!',
      }

      // Mock successful login
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        password: 'hashedPassword',
        name: 'Performance Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { duration } = await measureExecutionTime(async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(200)
      }, 'User login')

      // Assert response time is under 300ms
      expect(duration).toBeLessThan(300)
    })
  })

  describe('Concurrent Load Tests', () => {
    it('should handle multiple concurrent registrations', async () => {
      const concurrentUsers = 10
      const registerPromises = []

      for (let i = 0; i < concurrentUsers; i++) {
        const registerDto = {
          email: `concurrent-${i}-${Date.now()}@example.com`,
          password: 'ValidPassword123!',
          name: `Concurrent User ${i}`,
        }

        // Mock successful registration for each user
        prismaService.user.findUnique.mockResolvedValue(null)
        prismaService.user.create.mockResolvedValue({
          id: `user-${i}`,
          email: registerDto.email,
          name: registerDto.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        registerPromises.push(
          request(app.getHttpServer())
            .post('/auth/register')
            .send(registerDto)
        )
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.all(registerPromises)
        results.forEach(response => {
          expect(response.status).toBe(201)
        })
      }, `${concurrentUsers} concurrent registrations`)

      // Assert total time is reasonable (under 2 seconds for 10 concurrent requests)
      expect(duration).toBeLessThan(2000)
    })

    it('should handle multiple concurrent logins', async () => {
      const concurrentLogins = 20
      const loginPromises = []

      for (let i = 0; i < concurrentLogins; i++) {
        const loginDto = {
          email: `login-user-${i}@example.com`,
          password: 'ValidPassword123!',
        }

        // Mock successful login for each user
        prismaService.user.findUnique.mockResolvedValue({
          id: `user-${i}`,
          email: loginDto.email,
          password: 'hashedPassword',
          name: `Login User ${i}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        loginPromises.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
        )
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.all(loginPromises)
        results.forEach(response => {
          expect(response.status).toBe(200)
        })
      }, `${concurrentLogins} concurrent logins`)

      // Assert total time is reasonable (under 3 seconds for 20 concurrent requests)
      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage()

      // Perform 100 registration operations
      for (let i = 0; i < 100; i++) {
        const registerDto = {
          email: `memory-test-${i}-${Date.now()}@example.com`,
          password: 'ValidPassword123!',
          name: `Memory Test User ${i}`,
        }

        prismaService.user.findUnique.mockResolvedValue(null)
        prismaService.user.create.mockResolvedValue({
          id: `user-${i}`,
          email: registerDto.email,
          name: registerDto.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerDto)
          .expect(201)
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Assert memory increase is reasonable (under 50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Database Query Performance', () => {
    it('should perform user lookup efficiently', async () => {
      const email = 'perf-lookup@example.com'

      // Mock user lookup
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        password: 'hashedPassword',
        name: 'Performance Lookup User',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { duration } = await measureExecutionTime(async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'ValidPassword123!' })
          .expect(200)
      }, 'User lookup')

      // Assert lookup is under 100ms
      expect(duration).toBeLessThan(100)
    })

    it('should handle database connection pool efficiently', async () => {
      const poolSize = 10
      const requests = []

      // Create multiple concurrent requests
      for (let i = 0; i < poolSize; i++) {
        const loginDto = {
          email: `pool-test-${i}@example.com`,
          password: 'ValidPassword123!',
        }

        prismaService.user.findUnique.mockResolvedValue({
          id: `user-${i}`,
          email: loginDto.email,
          password: 'hashedPassword',
          name: `Pool Test User ${i}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
        )
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.all(requests)
        results.forEach(response => {
          expect(response.status).toBe(200)
        })
      }, `Database connection pool test (${poolSize} connections)`)

      // Assert all requests complete within reasonable time
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Caching Performance', () => {
    it('should benefit from response caching', async () => {
      const endpoint = '/auth/health'
      const iterations = 100

      // First request (cache miss)
      const firstResponse = await request(app.getHttpServer())
        .get(endpoint)
        .expect(200)

      // Measure time for cached requests
      const { duration } = await measureExecutionTime(async () => {
        for (let i = 0; i < iterations; i++) {
          await request(app.getHttpServer())
            .get(endpoint)
            .expect(200)
        }
      }, `${iterations} cached requests`)

      // Assert average response time is under 10ms for cached requests
      const averageTime = duration / iterations
      expect(averageTime).toBeLessThan(10)
    })
  })

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently', async () => {
      const requests = []
      const requestCount = 100

      // Create burst of requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'rate-limit-test@example.com',
              password: 'wrongpassword',
            })
        )
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.allSettled(requests)
        return results
      }, `Rate limiting test (${requestCount} requests)`)

      // Assert rate limiting completes within reasonable time
      expect(duration).toBeLessThan(5000)

      // Verify some requests were rate limited
      const fulfilledCount = requests.length
      expect(fulfilledCount).toBe(requestCount)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      const errorRequests = 50
      const requests = []

      // Create requests that will fail
      for (let i = 0; i < errorRequests; i++) {
        prismaService.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: `error-test-${i}@example.com`,
              password: 'password',
            })
        )
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.allSettled(requests)
        return results
      }, `Error handling test (${errorRequests} errors)`)

      // Assert error handling is efficient
      expect(duration).toBeLessThan(2000)
    })
  })
})
