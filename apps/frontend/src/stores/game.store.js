// 文件路径: src/stores/game.store.js (瘦身版)

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api.service';
import { useUIStore } from './ui.store'; // 修正: ui.store
import { useToast } from '@/composables/useToast';

export const useGameStore = defineStore('game', () => {
  const { show: showToast } = useToast();
  const uiStore = useUIStore();

  // --- State ---
  const currentGame = ref(null);
  const narrativeLog = ref([]);
  const commandInputValue = ref('');
  const isAiThinking = ref(false); // 追踪AI是否正在处理当前会话的行动

  // --- [新增] 错误消息转换映射
  const errorMessages = {
    // 网络错误
    NETWORK_ERROR: '网络连接出现问题，请检查网络后重试',
    TIMEOUT: '响应超时，AI可能正在处理复杂任务，请稍后再试',
    CONNECTION_LOST: '连接已断开，请刷新页面重新连接',

    // AI处理错误
    AI_BUSY: 'AI当前正在处理其他任务，请稍候',
    AI_LIMIT_EXCEEDED: 'AI使用达到限制，请稍后再试',
    INVALID_INPUT: '输入内容不符合要求，请调整后重试',
    PROMPT_INJECTION: '检测到不安全的输入内容，请重新表述',

    // 系统错误
    SYSTEM_OVERLOAD: '系统负载过高，请稍后再试',
    INTERNAL_ERROR: '系统内部错误，我们正在修复中',

    // 默认错误
    UNKNOWN: '发生了未知错误，请重试或联系支持',
  };

  /**
   * [新增] 转换错误消息为用户友好的格式
   */
  function getUserFriendlyError(error) {
    if (!error) {
      return errorMessages.UNKNOWN;
    }

    const errorStr = String(error).toLowerCase();

    // 网络相关错误
    if (errorStr.includes('network') || errorStr.includes('fetch')) {
      return errorMessages.NETWORK_ERROR;
    }
    if (errorStr.includes('timeout')) {
      return errorMessages.TIMEOUT;
    }
    if (errorStr.includes('connection') && errorStr.includes('lost')) {
      return errorMessages.CONNECTION_LOST;
    }

    // AI相关错误
    if (errorStr.includes('busy') || errorStr.includes('rate limit')) {
      return errorMessages.AI_BUSY;
    }
    if (errorStr.includes('limit') || errorStr.includes('quota')) {
      return errorMessages.AI_LIMIT_EXCEEDED;
    }
    if (errorStr.includes('invalid') || errorStr.includes('validation')) {
      return errorMessages.INVALID_INPUT;
    }
    if (errorStr.includes('injection') || errorStr.includes('security')) {
      return errorMessages.PROMPT_INJECTION;
    }

    // 系统相关错误
    if (errorStr.includes('overload') || errorStr.includes('capacity')) {
      return errorMessages.SYSTEM_OVERLOAD;
    }
    if (errorStr.includes('internal') || errorStr.includes('server')) {
      return errorMessages.INTERNAL_ERROR;
    }

    // 如果没有匹配的错误类型，返回原始错误（但限制长度）
    const originalError = String(error);
    return originalError.length > 100 ? originalError.substring(0, 100) + '...' : originalError;
  }

  // --- Actions ---

  /**
   * [重构] loadGame 现在只负责获取初始数据
   */
  async function loadGame(gameId) {
    uiStore.isProcessing = true;
    try {
      const gameData = await apiService.games.getById(gameId);
      currentGame.value = gameData;
      // 初始化叙事日志
      narrativeLog.value = [
        { text: `降临至世界 "${gameData.name || '一个未知世界'}"...`, isMeta: true },
      ];
      // [注释] 连接WebSocket的职责已移交给 main.js 和 realtime.store
    } catch (error) {
      const userFriendlyError = getUserFriendlyError(error.message);
      showToast(`加载世界失败: ${userFriendlyError}`, 'error');
      currentGame.value = null;
      throw error; // 向上抛出错误，让视图可以处理
    } finally {
      uiStore.isProcessing = false;
    }
  }

  /**
   * [核心重构] submitAction 只负责“触发”，不再等待或处理结果
   */
  async function submitAction(gameId, type, payload) {
    if (isAiThinking.value) {
      showToast('AI 正在思考中，请稍候...', 'info');
      return;
    }
    try {
      // [注释] 异步发送API请求来“触发”后台任务。
      // 我们不关心它的返回值，因为结果将通过WebSocket推送。
      await apiService.games.submitAction(gameId, { type, payload });
      // [注释] 成功触发后，我们只需等待'processing_started'事件即可。
      // isAiThinking 的状态将由 handleProcessingStarted 来设置。
    } catch (error) {
      // 只有在触发API本身失败时才会进入这里
      const userFriendlyError = getUserFriendlyError(error.message);
      showToast(`行动请求失败: ${userFriendlyError}`, 'error');
      isAiThinking.value = false; // 确保在触发失败时重置状态
    }
  }

  // --- [新增] 被动处理器 Actions (供 realtime.store 调用) ---

  /**
   * 处理器：当收到 'processing_started' 事件时被调用
   */
  function handleProcessingStarted(data) {
    console.log('[GameStore] AI processing started:', data);
    isAiThinking.value = true;
    narrativeLog.value.push({
      text: data.message || 'AI 正在思考...',
      isMeta: true,
    });
  }

  /**
   * 处理器：当收到 'processing_completed' 事件时被调用
   */
  function handleProcessingCompleted(data) {
    console.log('[GameStore] AI processing completed:', data);
    const { progression } = data;
    if (!progression) {
      return;
    }

    // 从叙事日志中移除最后一条“正在思考”的消息
    if (narrativeLog.value.length > 0 && narrativeLog.value.at(-1).isMeta) {
      narrativeLog.value.pop();
    }

    if (progression.narrative) {
      narrativeLog.value.push({ text: progression.narrative, isMeta: false });
    }
    // [重要] 后端微服务架构中，角色状态的更新由 RuleEngine 精确完成，
    // 叙事AI不再返回 characterUpdate。我们需要在接收到事件后，
    // 主动重新获取最新的角色状态。
    // (这是一个高级优化，暂时我们可以先依赖前端的乐观更新)

    if (progression.options && currentGame.value) {
      currentGame.value.options = progression.options;
    }
    isAiThinking.value = false;
  }

  /**
   * 处理器：当收到 'processing_failed' 事件时被调用
   */
  function handleProcessingFailed(data) {
    console.error('[GameStore] AI processing failed:', data);
    isAiThinking.value = false;
    // 移除"正在思考"的消息
    if (narrativeLog.value.length > 0 && narrativeLog.value.at(-1).isMeta) {
      narrativeLog.value.pop();
    }

    // [优化] 使用用户友好的错误消息
    const userFriendlyError = getUserFriendlyError(data.error);
    addNarrativeEntry(`❌ 处理失败: ${userFriendlyError}`, true);
    showToast(`行动失败: ${userFriendlyError}`, 'error');
  }

  // 其他 action，例如手动更新角色状态
  async function updateCharacterState(gameId, updateData) {
    try {
      const updatedCharacter = await apiService.games.updateCharacter(gameId, updateData);
      if (currentGame.value && currentGame.value.character) {
        Object.assign(currentGame.value.character, updatedCharacter);
      }
      showToast('角色状态已通过织世者控制台更新。', 'success');
      uiStore.hideWeaverConsole();
    } catch (error) {
      const userFriendlyError = getUserFriendlyError(error.message);
      showToast(`更新角色失败: ${userFriendlyError}`, 'error');
    }
  }

  /**
   * [新增] 添加叙事条目到日志 - 用于即时反馈
   */
  function addNarrativeEntry(text, isMeta = false) {
    narrativeLog.value.push({ text, isMeta });
    // 自动滚动到最新消息（如果有对应的DOM元素）
    setTimeout(() => {
      const narrativeWindow = document.getElementById('narrative-window');
      if (narrativeWindow) {
        narrativeWindow.scrollTop = narrativeWindow.scrollHeight;
      }
    }, 0);
  }

  return {
    currentGame,
    narrativeLog,
    commandInputValue,
    isAiThinking,
    loadGame,
    submitAction,
    updateCharacterState,
    addNarrativeEntry, // 新增方法导出
    getUserFriendlyError, // 新增错误转换方法导出
    // 导出新的处理器方法
    handleProcessingStarted,
    handleProcessingCompleted,
    handleProcessingFailed,
  };
});
