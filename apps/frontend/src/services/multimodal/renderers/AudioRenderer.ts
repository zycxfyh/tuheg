// 音频渲染器
// 将音频内容渲染到DOM中

import type {
  AudioContent,
  MultimodalContent,
  MultimodalRenderer,
  MultimodalType,
  RenderOptions,
} from '../types'

export class AudioRenderer implements MultimodalRenderer {
  canRender(type: MultimodalType): boolean {
    return type === 'audio'
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
    if (!content.audio) {
      throw new Error('No audio content to render')
    }

    container.innerHTML = ''

    const audioContainer = document.createElement('div')
    audioContainer.className = 'multimodal-audio-content'
    this.applyAudioStyles(audioContainer, options)

    // 创建音频播放器
    const playerElement = await this.createAudioPlayer(content.audio, options)
    audioContainer.appendChild(playerElement)

    // 添加转录文本
    if (content.audio.transcript && options.includeAssets) {
      const transcriptElement = this.createTranscriptElement(content.audio)
      audioContainer.appendChild(transcriptElement)
    }

    // 添加元数据
    if (this.shouldShowMetadata(options)) {
      const metadataElement = this.createMetadataElement(content.audio)
      audioContainer.appendChild(metadataElement)
    }

    container.appendChild(audioContainer)
    this.applyAudioAnimations(audioContainer)
  }

  cleanup(container: HTMLElement): void {
    const audioContainer = container.querySelector('.multimodal-audio-content')
    if (audioContainer) {
      const audio = audioContainer.querySelector('audio') as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }

  private applyAudioStyles(container: HTMLElement, options: RenderOptions): void {
    Object.assign(container.style, {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      boxShadow: options.optimizeFor === 'web' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      maxWidth: '600px',
      margin: '0 auto',
    })
  }

  private async createAudioPlayer(
    audio: AudioContent,
    options: RenderOptions
  ): Promise<HTMLElement> {
    const playerContainer = document.createElement('div')
    playerContainer.className = 'audio-player'

    const audioElement = document.createElement('audio')
    audioElement.src = audio.url
    audioElement.controls = true
    audioElement.preload = options.optimizeFor === 'web' ? 'metadata' : 'none'

    // 自定义播放器界面
    const customControls = this.createCustomControls(audioElement, audio)
    playerContainer.appendChild(customControls)

    return playerContainer
  }

  private createCustomControls(audioElement: HTMLAudioElement, _audio: AudioContent): HTMLElement {
    const controls = document.createElement('div')
    controls.className = 'audio-controls'
    controls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: white;
      border-radius: 6px;
    `

    // 播放/暂停按钮
    const playButton = document.createElement('button')
    playButton.innerHTML = '▶️'
    playButton.onclick = () => {
      if (audioElement.paused) {
        audioElement.play()
        playButton.innerHTML = '⏸️'
      } else {
        audioElement.pause()
        playButton.innerHTML = '▶️'
      }
    }

    // 进度条
    const progressContainer = document.createElement('div')
    progressContainer.style.cssText =
      'flex: 1; height: 4px; background: #e0e0e0; border-radius: 2px;'
    const progressBar = document.createElement('div')
    progressBar.style.cssText = 'height: 100%; background: #007bff; border-radius: 2px; width: 0%;'
    progressContainer.appendChild(progressBar)

    // 时间显示
    const timeDisplay = document.createElement('span')
    timeDisplay.textContent = '0:00 / 0:00'
    timeDisplay.style.fontSize = '12px'

    // 音量控制
    const volumeControl = document.createElement('input')
    volumeControl.type = 'range'
    volumeControl.min = '0'
    volumeControl.max = '1'
    volumeControl.step = '0.1'
    volumeControl.value = '1'
    volumeControl.oninput = (e) => {
      audioElement.volume = parseFloat((e.target as HTMLInputElement).value)
    }

    controls.appendChild(playButton)
    controls.appendChild(progressContainer)
    controls.appendChild(timeDisplay)
    controls.appendChild(volumeControl)

    // 绑定事件
    audioElement.addEventListener('timeupdate', () => {
      const progress = (audioElement.currentTime / audioElement.duration) * 100
      progressBar.style.width = `${progress}%`
      timeDisplay.textContent = `${this.formatTime(audioElement.currentTime)} / ${this.formatTime(audioElement.duration)}`
    })

    return controls
  }

  private createTranscriptElement(audio: AudioContent): HTMLElement {
    const transcript = document.createElement('div')
    transcript.className = 'audio-transcript'
    transcript.style.cssText = `
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.5;
      max-height: 200px;
      overflow-y: auto;
    `
    transcript.textContent = audio.transcript || '暂无转录文本'
    return transcript
  }

  private createMetadataElement(audio: AudioContent): HTMLElement {
    const metadata = document.createElement('div')
    metadata.className = 'audio-metadata'
    metadata.style.cssText = `
      margin-top: 10px;
      font-size: 12px;
      color: #666;
      display: flex;
      gap: 15px;
    `

    if (audio.generated) {
      metadata.innerHTML += '<span>🤖 AI生成</span>'
    }
    if (audio.voice) {
      metadata.innerHTML += `<span>🎤 ${audio.voice}</span>`
    }
    if (audio.duration) {
      metadata.innerHTML += `<span>⏱️ ${Math.round(audio.duration)}秒</span>`
    }

    return metadata
  }

  private applyAudioAnimations(container: HTMLElement): void {
    container.style.opacity = '0'
    container.style.transform = 'translateY(20px)'
    container.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

    requestAnimationFrame(() => {
      container.style.opacity = '1'
      container.style.transform = 'translateY(0)'
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
}
