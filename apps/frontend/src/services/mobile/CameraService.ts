// 相机服务 - 移动端相机功能封装

import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import { PlatformService } from './PlatformService'

export interface CameraOptions {
  quality?: number // 0-100
  allowEditing?: boolean
  resultType?: CameraResultType
  source?: CameraSource
  direction?: CameraDirection
  saveToGallery?: boolean
  width?: number
  height?: number
  preserveAspectRatio?: boolean
}

export interface CameraResult {
  dataUrl?: string
  path?: string
  webPath?: string
  format: string
  exif?: any
}

export class CameraService {
  private platformService: PlatformService

  constructor() {
    this.platformService = new PlatformService()
  }

  // 检查相机权限
  async checkPermissions(): Promise<{
    camera: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
    photos: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  }> {
    const platformInfo = await this.platformService.getPlatformInfo()

    if (!platformInfo.isNative) {
      // Web平台使用MediaDevices API
      try {
        const result = await navigator.mediaDevices.getUserMedia({ video: true })
        result.getTracks().forEach((track) => track.stop())
        return { camera: 'granted', photos: 'granted' }
      } catch {
        return { camera: 'denied', photos: 'denied' }
      }
    }

    // 原生平台使用Capacitor权限检查
    try {
      const permissions = await Camera.checkPermissions()
      return permissions
    } catch (error) {
      console.warn('Failed to check camera permissions:', error)
      return { camera: 'denied', photos: 'denied' }
    }
  }

  // 请求相机权限
  async requestPermissions(): Promise<{
    camera: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
    photos: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  }> {
    const platformInfo = await this.platformService.getPlatformInfo()

    if (!platformInfo.isNative) {
      // Web平台权限已在checkPermissions中处理
      return this.checkPermissions()
    }

    try {
      const permissions = await Camera.requestPermissions()
      return permissions
    } catch (error) {
      console.warn('Failed to request camera permissions:', error)
      return { camera: 'denied', photos: 'denied' }
    }
  }

  // 拍照
  async takePhoto(options: CameraOptions = {}): Promise<CameraResult> {
    const platformInfo = await this.platformService.getPlatformInfo()

    if (!platformInfo.isNative) {
      return this.takePhotoWeb(options)
    }

    return this.takePhotoNative(options)
  }

  private async takePhotoNative(options: CameraOptions): Promise<CameraResult> {
    const cameraOptions = {
      quality: options.quality || 85,
      allowEditing: options.allowEditing || false,
      resultType: options.resultType || CameraResultType.DataUrl,
      source: options.source || CameraSource.Camera,
      direction: options.direction || CameraDirection.Rear,
      saveToGallery: options.saveToGallery || false,
      width: options.width,
      height: options.height,
      preserveAspectRatio: options.preserveAspectRatio !== false,
    }

    try {
      const result = await Camera.getPhoto(cameraOptions)

      return {
        dataUrl: result.dataUrl,
        path: result.path,
        webPath: result.webPath,
        format: result.format,
        exif: result.exif,
      }
    } catch (error) {
      console.error('Failed to take photo:', error)
      throw error
    }
  }

  private async takePhotoWeb(options: CameraOptions): Promise<CameraResult> {
    return new Promise((resolve, reject) => {
      // 创建文件输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // 使用后置摄像头（如果支持）

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) {
          reject(new Error('No file selected'))
          return
        }

        // 转换为Data URL
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type.split('/')[1] || 'jpeg',
          })
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      }

      input.oncancel = () => reject(new Error('User cancelled photo selection'))

      // 触发文件选择
      input.click()
    })
  }

  // 从相册选择照片
  async pickFromGallery(options: CameraOptions = {}): Promise<CameraResult> {
    return this.takePhoto({
      ...options,
      source: CameraSource.Photos,
    })
  }

  // 录制视频
  async recordVideo(
    options: {
      quality?: number
      duration?: number // 秒
      saveToGallery?: boolean
    } = {}
  ): Promise<CameraResult> {
    const platformInfo = await this.platformService.getPlatformInfo()

    if (!platformInfo.isNative) {
      return this.recordVideoWeb(options)
    }

    // 原生平台视频录制（Capacitor Camera插件不支持视频录制）
    // 需要使用MediaCapture插件或其他专门的视频录制插件
    throw new Error('Video recording not supported on this platform')
  }

  private async recordVideoWeb(
    options: { quality?: number; duration?: number } = {}
  ): Promise<CameraResult> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
          })

          const chunks: Blob[] = []

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data)
            }
          }

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)

            // 停止所有媒体轨道
            stream.getTracks().forEach((track) => track.stop())

            resolve({
              dataUrl: url,
              format: 'webm',
            })
          }

          mediaRecorder.onerror = (event) => {
            reject(new Error('Video recording failed'))
          }

          // 开始录制
          mediaRecorder.start()

          // 设置录制时长限制
          if (options.duration) {
            setTimeout(() => {
              mediaRecorder.stop()
            }, options.duration * 1000)
          }

          // 显示录制UI（简化实现）
          setTimeout(() => {
            if (confirm('停止录制？')) {
              mediaRecorder.stop()
            }
          }, 5000) // 5秒后询问是否停止
        })
        .catch((error) => {
          reject(new Error(`Failed to access camera: ${error.message}`))
        })
    })
  }

  // 获取相机信息
  async getCameraInfo(): Promise<{
    hasFrontCamera: boolean
    hasBackCamera: boolean
    maxResolution: { width: number; height: number }
  }> {
    const platformInfo = await this.platformService.getPlatformInfo()

    if (!platformInfo.isNative) {
      // Web平台检测
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === 'videoinput')

        return {
          hasFrontCamera: videoDevices.some(
            (device) =>
              device.label.toLowerCase().includes('front') ||
              device.label.toLowerCase().includes('前置')
          ),
          hasBackCamera: videoDevices.some(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('后置') ||
              device.label.toLowerCase().includes('facing back')
          ),
          maxResolution: { width: 1920, height: 1080 }, // 默认值
        }
      } catch {
        return {
          hasFrontCamera: false,
          hasBackCamera: false,
          maxResolution: { width: 640, height: 480 },
        }
      }
    }

    // 原生平台信息（简化实现）
    return {
      hasFrontCamera: true,
      hasBackCamera: true,
      maxResolution: { width: 4032, height: 3024 }, // 4K
    }
  }
}

export const cameraService = new CameraService()
