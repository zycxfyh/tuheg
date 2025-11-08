/**
 * 测试文件生成器
 * 为新功能生成高质量的测试模板
 */

export interface TestTemplateOptions {
  serviceName: string
  methods: string[]
  dependencies: string[]
  hasDatabase?: boolean
  hasExternalAPI?: boolean
  hasAsync?: boolean
}

export function generateTestTemplate(options: TestTemplateOptions): string {
  const {
    serviceName,
    methods,
    dependencies = [],
    hasDatabase = false,
    hasExternalAPI = false,
    hasAsync = false,
  } = options

  const mockImports = dependencies
    .map((dep) => `import { type MockProxy, mock } from 'jest-mock-extended'`)
    .join('\n')

  const mockDeclarations = dependencies
    .map((dep) => `  let ${dep.toLowerCase()}Mock: MockProxy<${dep}>;`)
    .join('\n')

  const mockSetups = dependencies
    .map(
      (dep) => `
    ${dep.toLowerCase()}Mock = mock<${dep}>();`
    )
    .join('')

  const mockProviders = dependencies
    .map((dep) => `        { provide: ${dep}, useValue: ${dep.toLowerCase()}Mock },`)
    .join('\n')

  const methodTests = methods
    .map(
      (method) => `
  describe('${method}', () => {
    it('should execute ${method} successfully', async () => {
      // Arrange
      const input = {}; // TODO: Define test input
      const expectedOutput = {}; // TODO: Define expected output

      // Act${
        hasAsync
          ? `
      const result = await service.${method}(input);`
          : `
      const result = service.${method}(input);`
      }

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle ${method} errors gracefully', async () => {
      // Arrange
      const invalidInput = {}; // TODO: Define invalid input

      // Act & Assert${
        hasAsync
          ? `
      await expect(service.${method}(invalidInput)).rejects.toThrow();`
          : `
      expect(() => service.${method}(invalidInput)).toThrow();`
      }
    });
  });`
    )
    .join('\n')

  const databaseMocks = hasDatabase
    ? `
    // Database mocks
    const prismaMock = mock<PrismaService>();`
    : ''

  const apiMocks = hasExternalAPI
    ? `
    // External API mocks
    const httpServiceMock = mock<HttpService>();
    const axiosMock = jest.fn();`
    : ''

  return `// 文件路径: apps/${serviceName.toLowerCase()}/src/__tests__/${serviceName.toLowerCase()}.service.spec.ts
// 测试目标: ${serviceName} 服务的核心功能

import { Test, TestingModule } from '@nestjs/testing';
import { ${serviceName} } from '../${serviceName.toLowerCase()}.service';
${mockImports}
${hasDatabase ? "import { PrismaService } from '@tuheg/common-backend';" : ''}
${hasExternalAPI ? "import { HttpService } from '@nestjs/axios';" : ''}

describe('${serviceName}', () => {
  let service: ${serviceName};
${mockDeclarations}${databaseMocks}${apiMocks}

  beforeEach(async () => {
    ${mockSetups}${
      hasDatabase
        ? `
    prismaMock = mock<PrismaService>();`
        : ''
    }${
      hasExternalAPI
        ? `
    httpServiceMock = mock<HttpService>();
    axiosMock.mockResolvedValue({ data: {} });`
        : ''
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${serviceName},${mockProviders}${
          hasDatabase
            ? `
        { provide: PrismaService, useValue: prismaMock },`
            : ''
        }${
          hasExternalAPI
            ? `
        { provide: HttpService, useValue: httpServiceMock },`
            : ''
        }
      ],
    }).compile();

    service = module.get<${serviceName}>(${serviceName});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });${methodTests}

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      // TODO: Setup error scenario

      // Act & Assert
      expect(async () => {
        // TODO: Call method that should fail
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete operations within acceptable time', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      // TODO: Call performance-sensitive method

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });${
    hasDatabase
      ? `

  describe('Database Integration', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      prismaMock.$connect.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.healthCheck?.()).rejects.toThrow('Database connection failed');
    });

    it('should handle database query errors', async () => {
      // Arrange
      prismaMock.someModel.findMany.mockRejectedValue(new Error('Query failed'));

      // Act & Assert
      await expect(service.someDatabaseOperation?.()).rejects.toThrow('Query failed');
    });
  });`
      : ''
  }${
    hasExternalAPI
      ? `

  describe('External API Integration', () => {
    it('should handle API timeout errors', async () => {
      // Arrange
      httpServiceMock.get.mockRejectedValue(new Error('Request timeout'));

      // Act & Assert
      await expect(service.someApiCall()).rejects.toThrow('Request timeout');
    });

    it('should handle API authentication errors', async () => {
      // Arrange
      httpServiceMock.get.mockRejectedValue(new Error('Unauthorized'));

      // Act & Assert
      await expect(service.someApiCall()).rejects.toThrow('Unauthorized');
    });

    it('should retry failed API calls', async () => {
      // Arrange
      httpServiceMock.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      // Act
      const result = await service.someApiCall();

      // Assert
      expect(httpServiceMock.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });
  });`
      : ''
  }

  describe('Input Validation', () => {
    it('should validate required inputs', () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      expect(() => service.someMethod(invalidInput)).toThrow('Input validation failed');
    });

    it('should sanitize malicious inputs', () => {
      // Arrange
      const maliciousInput = '<script>alert("xss")</script>';

      // Act & Assert
      expect(() => service.processInput(maliciousInput)).toThrow('Invalid input detected');
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent operations safely', async () => {
      // Arrange
      const promises = Array(10).fill(null).map(() =>
        service.someConcurrentOperation()
      );

      // Act
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});`
}
