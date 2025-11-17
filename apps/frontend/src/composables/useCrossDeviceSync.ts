import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useToast } from './useToast'

export interface DeviceInfo {
  id: string
  name: string
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  platform: string
  userAgent: string
  screenSize: { width: number; height: number }
  online: boolean
  lastSeen: Date
  capabilities: {
    touch: boolean
    camera: boolean
    microphone: boolean
    geolocation: boolean
    notifications: boolean
  }
}

export interface SyncSession {
  id: string
  name: string
  owner: string
  devices: DeviceInfo[]
  createdAt: Date
  lastActivity: Date
  status: 'active' | 'inactive' | 'expired'
  settings: {
    autoSync: boolean
    syncInterval: number
    conflictResolution: 'manual' | 'last_write_wins' | 'merge'
    dataTypes: string[]
  }
}

export interface SyncData {
  id: string
  type: string
  data: any
  timestamp: Date
  deviceId: string
  version: number
  checksum: string
}

export interface SyncConflict {
  id: string
  dataId: string
  localData: SyncData
  remoteData: SyncData
  conflictType: 'version' | 'content' | 'deletion'
  resolution?: 'local' | 'remote' | 'merge' | 'manual'
}

export function useCrossDeviceSync(userId?: string) {
  const { show: showToast } = useToast()

  // 状态
  const currentDevice = reactive<DeviceInfo>({
    id: '',
    name: '',
    type: 'unknown',
    platform: '',
    userAgent: '',
    screenSize: { width: 0, height: 0 },
    online: navigator.onLine,
    lastSeen: new Date(),
    capabilities: {
      touch: false,
      camera: false,
      microphone: false,
      geolocation: false,
      notifications: false,
    },
  })

  const syncSession = ref<SyncSession | null>(null)
  const connectedDevices = ref<DeviceInfo[]>([])
  const pendingSyncs = ref<SyncData[]>([])
  const syncConflicts = ref<SyncConflict[]>([])
  const isOnline = ref(navigator.onLine)
  const lastSyncTime = ref<Date | null>(null)
  const syncInProgress = ref(false)

  // Socket.io 连接
  const socket = ref<Socket | null>(null)

  // 计算属性
  const isSyncEnabled = computed(() => !!syncSession.value)
  const hasConflicts = computed(() => syncConflicts.value.length > 0)
  const onlineDevices = computed(() =>
    connectedDevices.value.filter(device => device.online)
  )

  // 初始化设备信息
  const initializeDevice = () => {
    const deviceId = localStorage.getItem('deviceId') ||
                     `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    localStorage.setItem('deviceId', deviceId)
    currentDevice.id = deviceId

    // 检测设备类型
    const userAgent = navigator.userAgent
    currentDevice.userAgent = userAgent

    if (/android/i.test(userAgent)) {
      currentDevice.type = 'mobile'
      currentDevice.platform = 'Android'
    } else if (/ipad|iphone|ipod/i.test(userAgent)) {
      currentDevice.type = 'mobile'
      currentDevice.platform = 'iOS'
    } else if (/tablet/i.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth < 1024)) {
      currentDevice.type = 'tablet'
      currentDevice.platform = 'Unknown'
    } else {
      currentDevice.type = 'desktop'
      currentDevice.platform = navigator.platform
    }

    // 设备名称
    currentDevice.name = `${currentDevice.type === 'mobile' ? '手机' :
                          currentDevice.type === 'tablet' ? '平板' : '电脑'} ${currentDevice.platform}`

    // 屏幕尺寸
    currentDevice.screenSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // 检测能力
    currentDevice.capabilities = {
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
    }

    currentDevice.online = navigator.onLine
    currentDevice.lastSeen = new Date()
  }

  // 初始化Socket连接
  const initializeSocket = () => {
    if (!userId) return

    socket.value = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
      auth: {
        userId,
        deviceId: currentDevice.id,
      },
      transports: ['websocket', 'polling'],
    })

    socket.value.on('connect', () => {
      console.log('Cross-device sync connected')
      currentDevice.online = true
      emitDeviceInfo()
    })

    socket.value.on('disconnect', () => {
      console.log('Cross-device sync disconnected')
      currentDevice.online = false
    })

    // 同步会话事件
    socket.value.on('sync_session_created', (session: SyncSession) => {
      syncSession.value = session
      showToast(`已加入同步会话: ${session.name}`, 'success')
    })

    socket.value.on('sync_session_updated', (session: SyncSession) => {
      syncSession.value = session
    })

    socket.value.on('device_joined', (device: DeviceInfo) => {
      const existingIndex = connectedDevices.value.findIndex(d => d.id === device.id)
      if (existingIndex >= 0) {
        connectedDevices.value[existingIndex] = device
      } else {
        connectedDevices.value.push(device)
      }
      showToast(`设备 ${device.name} 已连接`, 'info')
    })

    socket.value.on('device_left', (deviceId: string) => {
      const device = connectedDevices.value.find(d => d.id === deviceId)
      if (device) {
        connectedDevices.value = connectedDevices.value.filter(d => d.id !== deviceId)
        showToast(`设备 ${device.name} 已断开`, 'info')
      }
    })

    // 数据同步事件
    socket.value.on('data_sync', (syncData: SyncData) => {
      handleIncomingSync(syncData)
    })

    socket.value.on('sync_conflict', (conflict: SyncConflict) => {
      syncConflicts.value.push(conflict)
      showToast('检测到数据冲突，需要手动解决', 'warning')
    })

    socket.value.on('sync_ack', (dataId: string) => {
      // 移除已确认的同步数据
      pendingSyncs.value = pendingSyncs.value.filter(sync => sync.id !== dataId)
    })
  }

  // 创建同步会话
  const createSyncSession = async (name: string, settings?: Partial<SyncSession['settings']>) => {
    if (!socket.value) return

    const session: Partial<SyncSession> = {
      name,
      settings: {
        autoSync: true,
        syncInterval: 5000,
        conflictResolution: 'last_write_wins',
        dataTypes: ['game', 'character', 'settings'],
        ...settings,
      },
    }

    socket.value.emit('create_sync_session', session)
  }

  // 加入同步会话
  const joinSyncSession = async (sessionId: string) => {
    if (!socket.value) return

    socket.value.emit('join_sync_session', { sessionId })
  }

  // 离开同步会话
  const leaveSyncSession = () => {
    if (!socket.value || !syncSession.value) return

    socket.value.emit('leave_sync_session', { sessionId: syncSession.value.id })
    syncSession.value = null
    connectedDevices.value = []
    showToast('已离开同步会话', 'info')
  }

  // 同步数据
  const syncData = async (data: Omit<SyncData, 'id' | 'timestamp' | 'deviceId' | 'version' | 'checksum'>) => {
    if (!socket.value || !syncSession.value) {
      showToast('未连接到同步会话', 'error')
      return
    }

    const syncData: SyncData = {
      ...data,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      deviceId: currentDevice.id,
      version: 1,
      checksum: await generateChecksum(data.data),
    }

    // 添加到待同步队列
    pendingSyncs.value.push(syncData)

    // 发送同步数据
    socket.value.emit('sync_data', syncData)

    lastSyncTime.value = new Date()
  }

  // 处理传入的同步数据
  const handleIncomingSync = async (syncData: SyncData) => {
    try {
      // 验证校验和
      const calculatedChecksum = await generateChecksum(syncData.data)
      if (calculatedChecksum !== syncData.checksum) {
        showToast('同步数据校验失败', 'error')
        return
      }

      // 检查版本冲突
      const localVersion = await getLocalDataVersion(syncData.id)
      if (localVersion > syncData.version) {
        // 创建冲突
        const conflict: SyncConflict = {
          id: `conflict_${Date.now()}`,
          dataId: syncData.id,
          localData: await getLocalData(syncData.id),
          remoteData: syncData,
          conflictType: 'version',
        }
        syncConflicts.value.push(conflict)
        return
      }

      // 应用同步数据
      await applySyncData(syncData)

      // 发送确认
      socket.value?.emit('sync_ack', syncData.id)

      lastSyncTime.value = new Date()

    } catch (error) {
      console.error('Failed to handle incoming sync:', error)
      showToast('同步数据处理失败', 'error')
    }
  }

  // 解决同步冲突
  const resolveConflict = async (conflictId: string, resolution: SyncConflict['resolution']) => {
    const conflict = syncConflicts.value.find(c => c.id === conflictId)
    if (!conflict) return

    conflict.resolution = resolution

    try {
      switch (resolution) {
        case 'local':
          // 保持本地数据，重新发送
          await syncData({
            type: conflict.localData.type,
            data: conflict.localData.data,
          })
          break
        case 'remote':
          // 应用远程数据
          await applySyncData(conflict.remoteData)
          break
        case 'merge':
          // 合并数据
          const mergedData = await mergeData(conflict.localData.data, conflict.remoteData.data)
          await applySyncData({
            ...conflict.remoteData,
            data: mergedData,
          })
          break
      }

      // 移除已解决的冲突
      syncConflicts.value = syncConflicts.value.filter(c => c.id !== conflictId)
      showToast('冲突已解决', 'success')

    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      showToast('冲突解决失败', 'error')
    }
  }

  // 获取设备列表
  const getDevices = () => {
    return connectedDevices.value
  }

  // 发送设备信息
  const emitDeviceInfo = () => {
    if (!socket.value) return

    socket.value.emit('device_info', currentDevice)
  }

  // 工具函数
  const generateChecksum = async (data: any): Promise<string> => {
    const dataStr = JSON.stringify(data)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(dataStr)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const getLocalDataVersion = async (dataId: string): Promise<number> => {
    // 从本地存储获取数据版本
    const localData = localStorage.getItem(`sync_${dataId}`)
    if (!localData) return 0

    try {
      const parsed = JSON.parse(localData)
      return parsed.version || 0
    } catch {
      return 0
    }
  }

  const getLocalData = async (dataId: string): Promise<SyncData> => {
    const localData = localStorage.getItem(`sync_${dataId}`)
    if (!localData) {
      throw new Error('Local data not found')
    }

    return JSON.parse(localData)
  }

  const applySyncData = async (syncData: SyncData) => {
    // 根据数据类型应用同步数据
    switch (syncData.type) {
      case 'game':
        // 应用游戏数据同步
        localStorage.setItem(`sync_${syncData.id}`, JSON.stringify(syncData))
        break
      case 'character':
        // 应用角色数据同步
        localStorage.setItem(`sync_${syncData.id}`, JSON.stringify(syncData))
        break
      case 'settings':
        // 应用设置数据同步
        localStorage.setItem(`sync_${syncData.id}`, JSON.stringify(syncData))
        break
      default:
        // 通用数据同步
        localStorage.setItem(`sync_${syncData.id}`, JSON.stringify(syncData))
    }

    // 触发数据更新事件
    window.dispatchEvent(new CustomEvent('sync-data-updated', {
      detail: syncData
    }))
  }

  const mergeData = async (localData: any, remoteData: any): Promise<any> => {
    // 简单的数据合并策略
    if (typeof localData === 'object' && typeof remoteData === 'object') {
      return { ...localData, ...remoteData }
    }
    return remoteData // 默认使用远程数据
  }

  // 网络状态监听
  const handleOnlineStatusChange = () => {
    isOnline.value = navigator.onLine
    currentDevice.online = navigator.onLine

    if (socket.value) {
      if (navigator.onLine) {
        socket.value.connect()
      } else {
        // 处理离线状态
      }
    }
  }

  // 清理资源
  const cleanup = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  // 生命周期
  onMounted(() => {
    initializeDevice()
    initializeSocket()

    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnlineStatusChange)
    window.removeEventListener('offline', handleOnlineStatusChange)
    cleanup()
  })

  return {
    // 状态
    currentDevice,
    syncSession,
    connectedDevices,
    pendingSyncs,
    syncConflicts,
    isOnline,
    lastSyncTime,
    syncInProgress,

    // 计算属性
    isSyncEnabled,
    hasConflicts,
    onlineDevices,

    // 方法
    createSyncSession,
    joinSyncSession,
    leaveSyncSession,
    syncData,
    resolveConflict,
    getDevices,
    emitDeviceInfo,
    cleanup,
  }
}
