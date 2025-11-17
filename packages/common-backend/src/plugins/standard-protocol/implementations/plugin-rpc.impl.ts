import { Injectable } from '@nestjs/common'
import { PluginRPC, RPCHandler, RPCStats } from '../plugin-communication.interface'

@Injectable()
export class PluginRPCImpl implements PluginRPC {
  registerMethod(name: string, handler: RPCHandler): void {
    // 实现方法注册逻辑
  }

  unregisterMethod(name: string): void {
    // 实现方法注销逻辑
  }

  call(method: string, params: any[], target?: string, timeout?: number): Promise<any> {
    // 实现方法调用逻辑
    return Promise.resolve(null)
  }

  getRegisteredMethods(): string[] {
    // 实现已注册方法获取逻辑
    return []
  }

  getStats(): RPCStats {
    // 实现统计获取逻辑
    return {
      registeredMethods: 0,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageExecutionTime: 0,
      timeoutCalls: 0
    }
  }
}
