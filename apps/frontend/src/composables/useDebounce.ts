import { ref, Ref, watch, customRef } from 'vue'

export interface DebounceOptions {
  delay?: number
  immediate?: boolean
}

export function useDebounce<T>(value: Ref<T>, options: DebounceOptions = {}): Ref<T> {
  const { delay = 300, immediate = false } = options

  let timeoutId: number | null = null
  let lastExecuted = 0

  return customRef((track, trigger) => ({
    get() {
      track()
      return value.value
    },
    set(newValue) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const now = Date.now()
      const shouldExecuteImmediately = immediate && now - lastExecuted > delay

      if (shouldExecuteImmediately) {
        value.value = newValue
        lastExecuted = now
        trigger()
      } else {
        timeoutId = window.setTimeout(() => {
          value.value = newValue
          lastExecuted = Date.now()
          trigger()
          timeoutId = null
        }, delay)
      }
    },
  }))
}

export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
} {
  let timeoutId: number | null = null
  let lastArgs: Parameters<T> | null = null
  let lastExecuted = 0

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const now = Date.now()
    const shouldExecuteImmediately = immediate && now - lastExecuted > delay

    if (shouldExecuteImmediately) {
      fn(...args)
      lastExecuted = now
    } else {
      timeoutId = window.setTimeout(() => {
        if (lastArgs) {
          fn(...lastArgs)
          lastExecuted = Date.now()
        }
        timeoutId = null
        lastArgs = null
      }, delay)
    }
  }

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
    }
  }

  debouncedFn.flush = () => {
    if (timeoutId && lastArgs) {
      fn(...lastArgs)
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
      lastExecuted = Date.now()
    }
  }

  return debouncedFn
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastExecuted = 0
  let timeoutId: number | null = null
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    lastArgs = args
    const now = Date.now()

    if (now - lastExecuted > delay) {
      fn(...args)
      lastExecuted = now
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(
        () => {
          if (lastArgs) {
            fn(...lastArgs)
            lastExecuted = Date.now()
          }
          timeoutId = null
          lastArgs = null
        },
        delay - (now - lastExecuted)
      )
    }
  }
}
