import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PluginSandboxService, SandboxOptions, SandboxResult } from '@tuheg/common-backend';

interface TestActivationDto {
  options?: SandboxOptions;
}

interface TestToolDto {
  toolId: string;
  input: any;
  options?: SandboxOptions;
}

/**
 * Plugin Sandbox Controller
 * 提供插件沙盒测试API
 */
@Controller('plugin-sandbox')
export class PluginSandboxController {
  private readonly logger = new Logger(PluginSandboxController.name);

  constructor(private readonly sandboxService: PluginSandboxService) {}

  /**
   * 测试插件激活
   * POST /plugin-sandbox/test-activation
   */
  @Post('test-activation')
  @UseInterceptors(FileInterceptor('plugin'))
  async testPluginActivation(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: TestActivationDto
  ): Promise<SandboxResult> {
    if (!file) {
      throw new BadRequestException('Plugin file is required');
    }

    if (!file.originalname.endsWith('.js') && !file.originalname.endsWith('.ts')) {
      throw new BadRequestException('Plugin file must be a JavaScript or TypeScript file');
    }

    this.logger.log(`Testing plugin activation: ${file.originalname}`);

    try {
      // 将文件内容保存为临时文件
      const tempPath = `/tmp/plugin-sandbox-${Date.now()}-${file.originalname}`;
      await require('fs').promises.writeFile(tempPath, file.buffer);

      const result = await this.sandboxService.testPluginActivation(tempPath, body.options);

      // 清理临时文件
      await require('fs').promises.unlink(tempPath);

      return result;
    } catch (error) {
      this.logger.error(`Plugin activation test failed: ${error.message}`);
      throw new BadRequestException(`Plugin test failed: ${error.message}`);
    }
  }

  /**
   * 测试插件工具执行
   * POST /plugin-sandbox/test-tool
   */
  @Post('test-tool')
  @UseInterceptors(FileInterceptor('plugin'))
  async testPluginTool(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: TestToolDto
  ): Promise<SandboxResult> {
    if (!file) {
      throw new BadRequestException('Plugin file is required');
    }

    if (!body.toolId) {
      throw new BadRequestException('Tool ID is required');
    }

    this.logger.log(`Testing plugin tool: ${file.originalname} -> ${body.toolId}`);

    try {
      // 将文件内容保存为临时文件
      const tempPath = `/tmp/plugin-sandbox-${Date.now()}-${file.originalname}`;
      await require('fs').promises.writeFile(tempPath, file.buffer);

      const result = await this.sandboxService.testPluginTool(
        tempPath,
        body.toolId,
        body.input,
        body.options
      );

      // 清理临时文件
      await require('fs').promises.unlink(tempPath);

      return result;
    } catch (error) {
      this.logger.error(`Plugin tool test failed: ${error.message}`);
      throw new BadRequestException(`Plugin tool test failed: ${error.message}`);
    }
  }

  /**
   * 获取沙盒统计信息
   * GET /plugin-sandbox/stats
   */
  @Post('stats')
  getSandboxStats() {
    return this.sandboxService.getSandboxStats();
  }

  /**
   * 健康检查
   * GET /plugin-sandbox/health
   */
  @Post('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      sandbox: this.sandboxService.getSandboxStats()
    };
  }
}
