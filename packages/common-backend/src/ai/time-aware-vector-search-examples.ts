// 文件路径: packages/common-backend/src/ai/time-aware-vector-search-examples.ts
// 职责: VCPToolBox 时间感知向量检索的使用示例
// 展示Time-Aware RAG、动态K值、时间衰减等功能

import {
  TimeAwareVectorSearchService,
  TimeAwareSearchConfig,
} from './time-aware-vector-search.service';

/**
 * VCPToolBox 时间感知向量检索使用示例
 */
export class TimeAwareSearchExamples {
  constructor(private readonly timeAwareSearch: TimeAwareVectorSearchService) {}

  /**
   * 示例1: 基础时间感知检索
   * 场景: 结合语义相似度和时间因素进行智能检索
   */
  async exampleBasicTimeAwareSearch(gameId: string, query: string, user: any) {
    console.log('⏰ 基础时间感知检索示例');
    console.log(`查询: "${query}"`);
    console.log('');

    const results = await this.timeAwareSearch.searchWithTimeAwareness(query, gameId, user);

    console.log(`📊 检索到 ${results.length} 条结果:`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. [${result.hoursSinceCreation.toFixed(1)}h前]`);
      console.log(`   相似度: ${result.similarity.toFixed(3)}`);
      console.log(`   时间权重: ${result.timeWeight.toFixed(3)}`);
      console.log(`   综合分数: ${result.combinedScore.toFixed(3)}`);
      console.log(`   内容: ${result.content.substring(0, 60)}...`);
      console.log('');
    });

    return results;
  }

  /**
   * 示例2: 不同时间衰减函数对比
   * 场景: 展示不同衰减函数对检索结果的影响
   */
  async exampleDecayFunctionsComparison(gameId: string, query: string, user: any) {
    console.log('📈 时间衰减函数对比示例');
    console.log('');

    const decayFunctions: Array<'linear' | 'exponential' | 'gaussian'> = [
      'linear',
      'exponential',
      'gaussian',
    ];

    const results: Record<string, any[]> = {};

    for (const decayFunc of decayFunctions) {
      const config: Partial<TimeAwareSearchConfig> = {
        decayFunction: decayFunc,
        timeWeightFactor: 0.3,
      };

      const searchResults = await this.timeAwareSearch.searchWithTimeAwareness(
        query,
        gameId,
        user,
        config,
      );

      results[decayFunc] = searchResults.slice(0, 3); // 只显示前3个

      console.log(`${decayFunc.toUpperCase()} 衰减函数:`);
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.hoursSinceCreation.toFixed(1)}h前 - 综合分: ${result.combinedScore.toFixed(3)}`,
        );
      });
      console.log('');
    }

    return results;
  }

  /**
   * 示例3: 动态K值调整
   * 场景: 根据时间分布动态调整返回结果数量
   */
  async exampleDynamicKAdjustment(gameId: string, query: string, user: any) {
    console.log('🎯 动态K值调整示例');
    console.log('');

    // 测试不同的动态K配置
    const configs = [
      {
        name: '严格时间过滤',
        config: {
          dynamicK: {
            enabled: true,
            minResults: 2,
            maxResults: 5,
            timeThresholdHours: 12, // 12小时阈值
          },
          timeWeightFactor: 0.4,
        } as Partial<TimeAwareSearchConfig>,
      },
      {
        name: '宽松时间过滤',
        config: {
          dynamicK: {
            enabled: true,
            minResults: 3,
            maxResults: 8,
            timeThresholdHours: 48, // 48小时阈值
          },
          timeWeightFactor: 0.2,
        } as Partial<TimeAwareSearchConfig>,
      },
      {
        name: '固定数量',
        config: {
          dynamicK: { enabled: false },
          baseConfig: { limit: 5 },
        } as Partial<TimeAwareSearchConfig>,
      },
    ];

    const results: Record<string, any[]> = {};

    for (const { name, config } of configs) {
      const searchResults = await this.timeAwareSearch.searchWithTimeAwareness(
        query,
        gameId,
        user,
        config,
      );

      results[name] = searchResults;

      console.log(`${name}:`);
      console.log(`  返回数量: ${searchResults.length}`);
      const avgAge =
        searchResults.reduce((sum, r) => sum + r.hoursSinceCreation, 0) / searchResults.length;
      console.log(`  平均年龄: ${avgAge.toFixed(1)} 小时`);
      console.log('');
    }

    return results;
  }

  /**
   * 示例4: 时间分布统计分析
   * 场景: 分析记忆的时间分布，为优化配置提供依据
   */
  async exampleTimeDistributionAnalysis(gameId: string) {
    console.log('📊 时间分布统计分析示例');
    console.log('');

    const stats = await this.timeAwareSearch.getTimeDistributionStats(gameId);

    console.log(`总记忆数量: ${stats.totalMemories}`);
    console.log('时间分布:');
    stats.timeBuckets.forEach((bucket) => {
      const percentage = ((bucket.count / stats.totalMemories) * 100).toFixed(1);
      console.log(`  ${bucket.hoursRange}: ${bucket.count} 条 (${percentage}%)`);
    });
    console.log('');

    console.log('优化建议:');
    stats.recommendations.forEach((rec) => {
      console.log(`  • ${rec}`);
    });
    console.log('');

    return stats;
  }

  /**
   * 示例5: 自动配置优化
   * 场景: 基于历史数据自动调整时间感知配置
   */
  async exampleAutoOptimization(gameId: string, query: string, user: any) {
    console.log('🔧 自动配置优化示例');
    console.log('');

    // 获取优化后的配置
    const optimizedConfig = await this.timeAwareSearch.optimizeTimeConfig(gameId);

    console.log('优化后的配置:');
    console.log(`  时间权重因子: ${optimizedConfig.timeWeightFactor}`);
    console.log(`  衰减函数: ${optimizedConfig.decayFunction}`);
    if (optimizedConfig.dynamicK) {
      console.log(
        `  动态K值: ${optimizedConfig.dynamicK.minResults}-${optimizedConfig.dynamicK.maxResults}`,
      );
      console.log(`  时间阈值: ${optimizedConfig.dynamicK.timeThresholdHours}h`);
    }
    console.log('');

    // 使用优化配置进行检索
    const results = await this.timeAwareSearch.searchWithTimeAwareness(
      query,
      gameId,
      user,
      optimizedConfig,
    );

    console.log(`使用优化配置检索结果 (${results.length} 条):`);
    results.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.combinedScore.toFixed(3)} 分 - ${result.hoursSinceCreation.toFixed(1)}h前`,
      );
    });
    console.log('');

    return { optimizedConfig, results };
  }

  /**
   * 示例6: 在AI对话中的应用
   * 场景: 时间感知检索在叙事AI中的实际应用
   */
  async exampleInNarrativeAI(gameId: string, playerAction: string, user: any) {
    console.log('🎭 叙事AI中的时间感知检索示例');
    console.log(`玩家行动: "${playerAction}"`);
    console.log('');

    // 步骤1: 使用时间感知检索获取相关记忆
    const relevantMemories = await this.timeAwareSearch.searchWithTimeAwareness(
      playerAction,
      gameId,
      user,
      {
        timeWeightFactor: 0.3,
        decayFunction: 'gaussian',
        baseConfig: { limit: 8, minSimilarity: 0.7 },
      },
    );

    console.log(`检索到 ${relevantMemories.length} 条相关记忆:`);
    relevantMemories.forEach((memory, index) => {
      const timeDesc =
        memory.hoursSinceCreation < 1
          ? '刚刚'
          : memory.hoursSinceCreation < 24
            ? `${memory.hoursSinceCreation.toFixed(1)}h前`
            : `${(memory.hoursSinceCreation / 24).toFixed(1)}天前`;
      console.log(`  ${index + 1}. [${timeDesc}] 相关度:${memory.combinedScore.toFixed(3)}`);
      console.log(`     ${memory.content.substring(0, 50)}...`);
    });
    console.log('');

    // 步骤2: 构建时间感知的上下文
    const recentMemories = relevantMemories.filter((m) => m.hoursSinceCreation <= 24);
    const historicalMemories = relevantMemories.filter((m) => m.hoursSinceCreation > 24);

    const contextParts = [];

    if (recentMemories.length > 0) {
      contextParts.push('## 最近相关记忆（24小时内）');
      recentMemories.forEach((memory) => {
        contextParts.push(`- ${memory.content}`);
      });
    }

    if (historicalMemories.length > 0) {
      contextParts.push('## 历史相关记忆');
      historicalMemories.slice(0, 3).forEach((memory) => {
        const days = (memory.hoursSinceCreation / 24).toFixed(1);
        contextParts.push(`- [${days}天前] ${memory.content}`);
      });
    }

    const timeAwareContext = contextParts.join('\n');

    console.log('构建的时间感知上下文:');
    console.log(timeAwareContext);
    console.log('');

    // 步骤3: 生成AI提示词
    const aiPrompt = `
基于角色的记忆和时间线，生成合适的叙事回应。

${timeAwareContext}

玩家当前行动: ${playerAction}

请考虑:
1. 角色的近期经历对当前行动的影响
2. 历史事件如何塑造角色的决策
3. 时间流逝带来的变化和成长

生成生动连贯的叙事回应：
    `.trim();

    console.log('生成的AI提示词:');
    console.log(aiPrompt);
    console.log('');

    return {
      relevantMemories,
      timeAwareContext,
      aiPrompt,
    };
  }

  /**
   * 示例7: 性能对比分析
   * 场景: 对比时间感知检索与普通向量检索的性能差异
   */
  async examplePerformanceComparison(gameId: string, queries: string[], user: any) {
    console.log('⚡ 性能对比分析示例');
    console.log('');

    const results = {
      timeAware: [] as any[],
      regular: [] as any[],
    };

    for (const query of queries) {
      console.log(`测试查询: "${query}"`);

      // 时间感知检索
      const timeAwareStart = Date.now();
      const timeAwareResults = await this.timeAwareSearch.searchWithTimeAwareness(
        query,
        gameId,
        user,
      );
      const timeAwareTime = Date.now() - timeAwareStart;

      // 普通向量检索（模拟）
      const regularStart = Date.now();
      // 这里应该调用普通向量搜索，但为了演示我们用时间感知的结果模拟
      const regularResults = timeAwareResults.map((r) => ({
        similarity: r.similarity,
        count: timeAwareResults.length,
      }));
      const regularTime = Date.now() - regularStart;

      results.timeAware.push({
        query,
        time: timeAwareTime,
        results: timeAwareResults.length,
        avgScore:
          timeAwareResults.reduce((sum, r) => sum + r.combinedScore, 0) / timeAwareResults.length,
      });

      results.regular.push({
        query,
        time: regularTime,
        results: regularResults.length,
        avgScore: regularResults.reduce((sum, r) => sum + r.similarity, 0) / regularResults.length,
      });

      console.log(`  时间感知: ${timeAwareTime}ms, ${timeAwareResults.length} 结果`);
      console.log(`  普通检索: ${regularTime}ms, ${regularResults.length} 结果`);
      console.log('');
    }

    // 生成对比报告
    const avgTimeAware =
      results.timeAware.reduce((sum, r) => sum + r.time, 0) / results.timeAware.length;
    const avgRegular = results.regular.reduce((sum, r) => sum + r.time, 0) / results.regular.length;
    const timeOverhead = (((avgTimeAware - avgRegular) / avgRegular) * 100).toFixed(1);

    console.log('📈 对比报告:');
    console.log(`  时间感知检索平均耗时: ${avgTimeAware.toFixed(0)}ms`);
    console.log(`  普通检索平均耗时: ${avgRegular.toFixed(0)}ms`);
    console.log(`  时间开销: ${timeOverhead}%`);
    console.log(`  检索质量提升: 综合分数考虑时间因素，更加符合用户期望`);
    console.log('');

    return results;
  }
}

/**
 * 使用指南
 *
 * 1. 导入服务:
 * import { TimeAwareVectorSearchService } from './time-aware-vector-search.service';
 *
 * 2. 基础时间感知检索:
 * const results = await timeAwareSearch.searchWithTimeAwareness(query, gameId, user, config);
 *
 * 3. 配置选项:
 * - timeWeightFactor: 时间权重因子 (0-1)
 * - decayFunction: 衰减函数 ('linear' | 'exponential' | 'gaussian')
 * - dynamicK: 动态结果数量调整
 *
 * 4. 时间分布分析:
 * const stats = await timeAwareSearch.getTimeDistributionStats(gameId);
 *
 * 5. 自动配置优化:
 * const optimizedConfig = await timeAwareSearch.optimizeTimeConfig(gameId);
 *
 * 优势:
 * - ⏰ 时间感知: 优先返回相关且及时的记忆
 * - 🎯 动态调整: 根据内容时间分布智能调整参数
 * - 📈 质量提升: 综合相似度和时间因素，提供更准确的结果
 * - 🔧 自优化: 基于历史数据自动调整配置
 */
