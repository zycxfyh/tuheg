// 视频渲染器
// 将视频内容渲染到DOM中

import type {
  MultimodalContent,
  MultimodalRenderer,
  MultimodalType,
  RenderOptions,
  VideoContent,
} from '../types'

export class VideoRenderer implements MultimodalRenderer {
  canRender(type: MultimodalType): boolean {
    return type === 'video'
  }

  async render(
    content: MultimodalContent,
    container: HTMLElement,
    options: RenderOptions = {
      format: 'html',
      includeAssets: true,
      compressAssets: false,
      optimizeFor: 'web',
      quality: 'medium',
    }
  ): Promise<void> {
    if (!content.video) {
      throw new Error('No video content to render')
    }

    container.innerHTML = ''

    const videoContainer = document.createElement('div')
    videoContainer.className = 'multimodal-video-content'
    this.applyVideoStyles(videoContainer, options)

    // 创建视频播放器
    const playerElement = await this.createVideoPlayer(content.video, options)
    videoContainer.appendChild(playerElement)

    // 添加转录文本
    if (content.video.transcript && options.includeAssets) {
      const transcriptElement = this.createTranscriptElement(content.video)
      videoContainer.appendChild(transcriptElement)
    }

    // 添加元数据
    if (this.shouldShowMetadata(options)) {
      const metadataElement = this.createMetadataElement(content.video)
      videoContainer.appendChild(metadataElement)
    }

    container.appendChild(videoContainer)
    this.applyVideoAnimations(videoContainer)
  }

  cleanup(container: HTMLElement): void {
    const videoContainer = container.querySelector('.multimodal-video-content')
    if (videoContainer) {
      const video = videoContainer.querySelector('video') as HTMLVideoElement
      if (video) {
        video.pause()
        video.src = ''
      }
    }
  }

  private applyVideoStyles(container: HTMLElement, options: RenderOptions): void {
    Object.assign(container.style, {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#000',
      boxShadow: options.optimizeFor === 'web' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
      maxWidth: '800px',
      margin: '0 auto',
    })
  }

  private async createVideoPlayer(
    video: VideoContent,
    options: RenderOptions
  ): Promise<HTMLElement> {
    const playerContainer = document.createElement('div')
    playerContainer.className = 'video-player'

    const videoElement = document.createElement('video')
    videoElement.src = video.url
    videoElement.controls = true
    videoElement.poster = video.thumbnail
    videoElement.preload = options.optimizeFor === 'web' ? 'metadata' : 'none'
    videoElement.style.cssText = 'width: 100%; border-radius: 4px;'

    // 自定义播放器界面
    const customControls = this.createCustomControls(videoElement, video)
    playerContainer.appendChild(videoElement)
    playerContainer.appendChild(customControls)

    return playerContainer
  }

  private createCustomControls(videoElement: HTMLVideoElement, _video: VideoContent): HTMLElement {
    const controls = document.createElement('div')
    controls.className = 'video-controls'
    controls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 0 0 6px 6px;
    `

    // 播放/暂停按钮
    const playButton = document.createElement('button')
    playButton.innerHTML = '▶️'
    playButton.style.cssText = 'background: none; border: none; color: white; font-size: 18px;'
    playButton.onclick = () => {
      if (videoElement.paused) {
        videoElement.play()
        playButton.innerHTML = '⏸️'
      } else {
        videoElement.pause()
        playButton.innerHTML = '▶️'
      }
    }

    // 进度条
    const progressContainer = document.createElement('div')
    progressContainer.style.cssText = 'flex: 1; height: 4px; background: #666; border-radius: 2px;'
    const progressBar = document.createElement('div')
    progressBar.style.cssText = 'height: 100%; background: #007bff; border-radius: 2px; width: 0%;'
    progressContainer.appendChild(progressBar)

    // 时间显示
    const timeDisplay = document.createElement('span')
    timeDisplay.textContent = '0:00 / 0:00'
    timeDisplay.style.fontSize = '12px'

    // 全屏按钮
    const fullscreenButton = document.createElement('button')
    fullscreenButton.innerHTML = '⛶'
    fullscreenButton.style.cssText =
      'background: none; border: none; color: white; font-size: 16px;'
    fullscreenButton.onclick = () => this.toggleFullscreen(videoElement)

    controls.appendChild(playButton)
    controls.appendChild(progressContainer)
    controls.appendChild(timeDisplay)
    controls.appendChild(fullscreenButton)

    // 绑定事件
    videoElement.addEventListener('timeupdate', () => {
      const progress = (videoElement.currentTime / videoElement.duration) * 100
      progressBar.style.width = `${progress}%`
      timeDisplay.textContent = `${this.formatTime(videoElement.currentTime)} / ${this.formatTime(videoElement.duration)}`
    })

    return controls
  }

  private createTranscriptElement(video: VideoContent): HTMLElement {
    const transcript = document.createElement('div')
    transcript.className = 'video-transcript'
    transcript.style.cssText = `
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.5;
      max-height: 200px;
      overflow-y: auto;
    `
    transcript.textContent = video.transcript || '暂无视频转录文本'
    return transcript
  }

  private createMetadataElement(video: VideoContent): HTMLElement {
    const metadata = document.createElement('div')
    metadata.className = 'video-metadata'
    metadata.style.cssText = `
      margin-top: 10px;
      font-size: 12px;
      color: #ccc;
      display: flex;
      gap: 15px;
      justify-content: center;
    `

    if (video.generated) {
      metadata.innerHTML += '<span>🤖 AI生成</span>'
    }
    if (video.duration) {
      metadata.innerHTML += `<span>⏱️ ${Math.round(video.duration)}秒</span>`
    }
    if (video.format) {
      metadata.innerHTML += `<span>🎬 ${video.format.toUpperCase()}</span>`
    }

    return metadata
  }

  private applyVideoAnimations(container: HTMLElement): void {
    container.style.opacity = '0'
    container.style.transform = 'scale(0.95)'
    container.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

    requestAnimationFrame(() => {
      container.style.opacity = '1'
      container.style.transform = 'scale(1)'
    })
  }

  private shouldShowMetadata(options: RenderOptions): boolean {
    return options.quality === 'high'
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private toggleFullscreen(videoElement: HTMLVideoElement): void {
    if (!document.fullscreenElement) {
      videoElement.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen().catch(console.error)
    }
  }
}
