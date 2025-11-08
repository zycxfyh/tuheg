import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Job {
  id: string
  type: 'creation' | 'logic' | 'narrative' | 'plugin'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  title: string
  description: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  result?: any
  metadata?: Record<string, any>
}

export const useJobsStore = defineStore('jobs', () => {
  // 状态
  const jobs = ref<Job[]>([])
  const activeJobs = ref<Set<string>>(new Set())

  // 计算属性
  const pendingJobs = computed(() =>
    jobs.value.filter(job => job.status === 'pending')
  )

  const runningJobs = computed(() =>
    jobs.value.filter(job => job.status === 'running')
  )

  const completedJobs = computed(() =>
    jobs.value.filter(job => job.status === 'completed')
  )

  const failedJobs = computed(() =>
    jobs.value.filter(job => job.status === 'failed')
  )

  const totalProgress = computed(() => {
    if (jobs.value.length === 0) return 0
    const total = jobs.value.reduce((sum, job) => sum + job.progress, 0)
    return Math.round(total / jobs.value.length)
  })

  // 任务管理方法
  const createJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'progress' | 'status'>): string => {
    const job: Job = {
      ...jobData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    }

    jobs.value.push(job)
    saveToLocalStorage()

    return job.id
  }

  const startJob = (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job && job.status === 'pending') {
      job.status = 'running'
      job.startedAt = new Date()
      activeJobs.value.add(jobId)
      saveToLocalStorage()
    }
  }

  const updateJobProgress = (jobId: string, progress: number, metadata?: Record<string, any>) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.progress = Math.max(0, Math.min(100, progress))
      if (metadata) {
        job.metadata = { ...job.metadata, ...metadata }
      }
      saveToLocalStorage()
    }
  }

  const completeJob = (jobId: string, result?: any) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.status = 'completed'
      job.progress = 100
      job.completedAt = new Date()
      job.result = result
      activeJobs.value.delete(jobId)
      saveToLocalStorage()
    }
  }

  const failJob = (jobId: string, error: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.status = 'failed'
      job.error = error
      job.completedAt = new Date()
      activeJobs.value.delete(jobId)
      saveToLocalStorage()
    }
  }

  const cancelJob = (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job && (job.status === 'pending' || job.status === 'running')) {
      job.status = 'cancelled'
      job.completedAt = new Date()
      activeJobs.value.delete(jobId)
      saveToLocalStorage()
    }
  }

  const removeJob = (jobId: string) => {
    const index = jobs.value.findIndex(j => j.id === jobId)
    if (index > -1) {
      jobs.value.splice(index, 1)
      activeJobs.value.delete(jobId)
      saveToLocalStorage()
    }
  }

  const clearCompletedJobs = () => {
    jobs.value = jobs.value.filter(job => job.status !== 'completed')
    saveToLocalStorage()
  }

  const retryJob = (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job && job.status === 'failed') {
      job.status = 'pending'
      job.progress = 0
      job.error = undefined
      job.startedAt = undefined
      job.completedAt = undefined
      saveToLocalStorage()
    }
  }

  // 批量操作
  const cancelAllJobs = () => {
    jobs.value.forEach(job => {
      if (job.status === 'pending' || job.status === 'running') {
        job.status = 'cancelled'
        job.completedAt = new Date()
      }
    })
    activeJobs.value.clear()
    saveToLocalStorage()
  }

  const removeAllCompletedJobs = () => {
    jobs.value = jobs.value.filter(job => job.status !== 'completed')
    saveToLocalStorage()
  }

  // 本地存储
  const saveToLocalStorage = () => {
    try {
      const jobsToSave = jobs.value.map(job => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString()
      }))
      localStorage.setItem('jobs', JSON.stringify(jobsToSave))
    } catch (error) {
      console.error('Failed to save jobs to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedJobs = localStorage.getItem('jobs')
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs)
        jobs.value = parsedJobs.map((job: any) => ({
          ...job,
          createdAt: new Date(job.createdAt),
          startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined
        }))

        // 恢复活跃任务状态
        activeJobs.value = new Set(
          jobs.value
            .filter(job => job.status === 'running')
            .map(job => job.id)
        )
      }
    } catch (error) {
      console.error('Failed to load jobs from localStorage:', error)
    }
  }

  // 初始化
  const init = () => {
    loadFromLocalStorage()
  }

  return {
    // 状态
    jobs,
    activeJobs,

    // 计算属性
    pendingJobs,
    runningJobs,
    completedJobs,
    failedJobs,
    totalProgress,

    // 任务管理方法
    createJob,
    startJob,
    updateJobProgress,
    completeJob,
    failJob,
    cancelJob,
    removeJob,
    clearCompletedJobs,
    retryJob,

    // 批量操作
    cancelAllJobs,
    removeAllCompletedJobs,

    // 存储方法
    saveToLocalStorage,
    loadFromLocalStorage,

    // 初始化
    init
  }
})
