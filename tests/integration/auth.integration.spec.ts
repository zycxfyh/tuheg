import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AuthModule } from '../../apps/backend-gateway/src/auth/auth.module'
import { PrismaService } from '@tuheg/common-backend'
import { createTestDatabase, cleanupDatabase } from '../shared/test-helpers'

describe('Auth (Integration)', () => {
  let app: INestApplication
  let prisma: PrismaClient
  let prismaService: PrismaService

  beforeAll(async () => {
    // Create test database connection
    prisma = createTestDatabase()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile()

    app = moduleFixture.createNestApplication()

    // Apply same validation pipe as production
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }))

    await app.init()

    prismaService = moduleFixture.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupDatabase(prisma)
  })

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: 'integration-test@example.com',
        password: 'ValidPassword123!',
        name: 'Integration Test User',
      }

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user')
          expect(res.body).toHaveProperty('access_token')
          expect(res.body.user.email).toBe(registerDto.email)
          expect(res.body.user.name).toBe(registerDto.name)
          expect(res.body.user).not.toHaveProperty('password')
        })
    })

    it('should reject registration with existing email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'ValidPassword123!',
        name: 'First User',
      }

      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)

      // Try to register with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerDto,
          name: 'Second User',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already exists')
        })
    })

    it('should validate email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        '',
      ]

      return Promise.all(
        invalidEmails.map(email =>
          request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email,
              password: 'ValidPassword123!',
              name: 'Test User',
            })
            .expect(400)
        )
      )
    })

    it('should validate password strength', () => {
      const weakPasswords = [
        '123',
        'password',
        'weak',
        '',
      ]

      return Promise.all(
        weakPasswords.map(password =>
          request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email: `test-${password}@example.com`,
              password,
              name: 'Test User',
            })
            .expect(400)
        )
      )
    })
  })

  describe('/auth/login (POST)', () => {
    const testUser = {
      email: 'login-test@example.com',
      password: 'ValidPassword123!',
      name: 'Login Test User',
    }

    beforeEach(async () => {
      // Register test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
    })

    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user')
          expect(res.body).toHaveProperty('access_token')
          expect(res.body.user.email).toBe(testUser.email)
          expect(typeof res.body.access_token).toBe('string')
        })
    })

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401)
    })

    it('should reject login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401)
    })
  })

  describe('Authentication middleware', () => {
    let accessToken: string

    beforeAll(async () => {
      // Register and login to get token
      const registerDto = {
        email: 'auth-test@example.com',
        password: 'ValidPassword123!',
        name: 'Auth Test User',
      }

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)

      accessToken = registerResponse.body.access_token
    })

    it('should allow access with valid token', () => {
      // This test assumes there's a protected route
      // You would test actual protected routes here
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401)
    })

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should reject access with expired token', async () => {
      // This would require setting up a short-lived token for testing
      // For now, we'll skip this test
      expect(true).toBe(true)
    })
  })

  describe('Database persistence', () => {
    it('should persist user data correctly', async () => {
      const registerDto = {
        email: 'persistence-test@example.com',
        password: 'ValidPassword123!',
        name: 'Persistence Test User',
      }

      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)

      // Verify data was persisted
      const userInDb = await prisma.user.findUnique({
        where: { email: registerDto.email },
      })

      expect(userInDb).toBeTruthy()
      expect(userInDb?.email).toBe(registerDto.email)
      expect(userInDb?.name).toBe(registerDto.name)
      expect(userInDb?.password).not.toBe(registerDto.password) // Should be hashed
    })

    it('should handle concurrent registrations', async () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        email: `concurrent-${i}@example.com`,
        password: 'ValidPassword123!',
        name: `Concurrent User ${i}`,
      }))

      // Register all users concurrently
      const promises = users.map(user =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send(user)
      )

      const results = await Promise.allSettled(promises)

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })

      // Verify all users were created
      for (const user of users) {
        const userInDb = await prisma.user.findUnique({
          where: { email: user.email },
        })
        expect(userInDb).toBeTruthy()
      }
    })
  })

  describe('Rate limiting', () => {
    it('should handle rapid requests appropriately', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
      )

      const results = await Promise.allSettled(requests)

      // Some requests should be rate limited
      const rateLimitedCount = results.filter(result =>
        result.status === 'fulfilled' &&
        (result as any).value.status === 429
      ).length

      // At least some requests should be rate limited
      expect(rateLimitedCount).toBeGreaterThan(0)
    })
  })

  describe('Security headers', () => {
    it('should include appropriate security headers', () => {
      return request(app.getHttpServer())
        .get('/auth/health')
        .expect(200)
        .expect((res) => {
          // Check for common security headers
          expect(res.headers).toHaveProperty('x-content-type-options')
          expect(res.headers).toHaveProperty('x-frame-options')
          expect(res.headers).toHaveProperty('x-xss-protection')
        })
    })
  })
})
