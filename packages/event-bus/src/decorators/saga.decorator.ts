import 'reflect-metadata';

/**
 * Saga元数据键
 */
export const SAGA_METADATA = Symbol('SAGA');
export const SAGA_STATE_METADATA = Symbol('SAGA_STATE');
export const SAGA_TRANSITIONS_METADATA = Symbol('SAGA_TRANSITIONS');

/**
 * Saga装饰器
 * 用于标记类为Saga处理器
 */
export function Saga(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(SAGA_METADATA, true, target);
  };
}

/**
 * Saga状态装饰器
 * 定义Saga的状态
 */
export function SagaState(state: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(SAGA_STATE_METADATA, state, target);
  };
}

/**
 * Saga转换装饰器
 * 定义状态间的转换规则
 */
export function SagaTransitions(transitions: Record<string, string[]>): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(SAGA_TRANSITIONS_METADATA, transitions, target);
  };
}

/**
 * Saga步骤装饰器
 * 标记方法为Saga步骤
 */
export function SagaStep(eventType: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const steps = Reflect.getMetadata(SAGA_TRANSITIONS_METADATA, target.constructor) || {};
    steps[eventType] = steps[eventType] || [];
    steps[eventType].push(propertyKey.toString());

    Reflect.defineMetadata(SAGA_TRANSITIONS_METADATA, steps, target.constructor);
  };
}

/**
 * Saga补偿操作装饰器
 * 标记方法为补偿操作
 */
export function SagaCompensation(forStep: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const compensations = Reflect.getMetadata('SAGA_COMPENSATIONS', target.constructor) || {};
    compensations[forStep] = propertyKey.toString();

    Reflect.defineMetadata('SAGA_COMPENSATIONS', compensations, target.constructor);
  };
}

/**
 * 获取Saga元数据
 */
export function getSagaMetadata(target: any): {
  isSaga: boolean;
  state?: string;
  transitions?: Record<string, string[]>;
  compensations?: Record<string, string>;
} {
  const isSaga = Reflect.getMetadata(SAGA_METADATA, target) === true;
  const state = Reflect.getMetadata(SAGA_STATE_METADATA, target);
  const transitions = Reflect.getMetadata(SAGA_TRANSITIONS_METADATA, target);
  const compensations = Reflect.getMetadata('SAGA_COMPENSATIONS', target);

  return {
    isSaga,
    state,
    transitions,
    compensations
  };
}

/**
 * Saga执行器接口
 */
export interface ISagaExecutor {
  /** 执行Saga */
  execute(sagaId: string, event: any): Promise<void>;

  /** 补偿Saga */
  compensate(sagaId: string, event: any): Promise<void>;

  /** 获取Saga状态 */
  getSagaState(sagaId: string): Promise<string>;

  /** 完成Saga */
  completeSaga(sagaId: string): Promise<void>;

  /** 失败Saga */
  failSaga(sagaId: string, error: Error): Promise<void>;
}

/**
 * Saga存储接口
 */
export interface ISagaStore {
  /** 保存Saga状态 */
  saveSagaState(sagaId: string, state: string, data: any): Promise<void>;

  /** 获取Saga状态 */
  getSagaState(sagaId: string): Promise<{ state: string; data: any } | null>;

  /** 删除Saga状态 */
  deleteSagaState(sagaId: string): Promise<void>;

  /** 获取所有活动Saga */
  getActiveSagas(): Promise<Array<{ sagaId: string; state: string; data: any }>>;
}

/**
 * Saga管理器
 */
export class SagaManager implements ISagaExecutor {
  constructor(private sagaStore: ISagaStore) {}

  async execute(sagaId: string, event: any): Promise<void> {
    const sagaState = await this.sagaStore.getSagaState(sagaId);
    if (!sagaState) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    // 这里应该实现Saga状态机逻辑
    // 根据当前状态和事件类型决定下一步操作

    await this.sagaStore.saveSagaState(sagaId, sagaState.state, {
      ...sagaState.data,
      lastEvent: event,
      lastUpdated: new Date()
    });
  }

  async compensate(sagaId: string, event: any): Promise<void> {
    const sagaState = await this.sagaStore.getSagaState(sagaId);
    if (!sagaState) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    // 执行补偿逻辑
    await this.sagaStore.saveSagaState(sagaId, 'compensating', {
      ...sagaState.data,
      compensationEvent: event,
      lastUpdated: new Date()
    });
  }

  async getSagaState(sagaId: string): Promise<string> {
    const sagaState = await this.sagaStore.getSagaState(sagaId);
    return sagaState?.state || 'unknown';
  }

  async completeSaga(sagaId: string): Promise<void> {
    await this.sagaStore.saveSagaState(sagaId, 'completed', {
      completedAt: new Date()
    });
  }

  async failSaga(sagaId: string, error: Error): Promise<void> {
    await this.sagaStore.saveSagaState(sagaId, 'failed', {
      failedAt: new Date(),
      error: error.message
    });
  }
}
