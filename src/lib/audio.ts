/**
 * WebAudio 로 직접 합성하는 효과음·BGM.
 * 오디오 파일을 두지 않으므로 오프라인에서도 그대로 동작한다.
 */

export type SfxName = 'click' | 'correct' | 'wrong' | 'combo' | 'finish' | 'levelup' | 'tick'

type Wave = OscillatorType

interface ToneOptions {
  freq: number
  duration: number
  type?: Wave
  gain?: number
  delay?: number
  /** 목표 주파수까지 미끄러지듯 변화 */
  glideTo?: number
}

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private bgmBus: GainNode | null = null
  private bgmTimer: number | null = null
  private bgmStep = 0

  sfxEnabled = true
  bgmEnabled = false

  /** 사용자 제스처 이후에만 호출 — 브라우저 자동재생 정책 때문 */
  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.85
      this.master.connect(this.ctx.destination)

      this.sfxBus = this.ctx.createGain()
      this.sfxBus.gain.value = 0.6
      this.sfxBus.connect(this.master)

      this.bgmBus = this.ctx.createGain()
      this.bgmBus.gain.value = 0.14
      this.bgmBus.connect(this.master)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** 첫 클릭 등에서 호출해 오디오 컨텍스트를 깨운다 */
  unlock(): void {
    this.ensure()
    if (this.bgmEnabled && this.bgmTimer === null) this.startBgm()
  }

  private tone(bus: GainNode, opts: ToneOptions): void {
    const ctx = this.ctx
    if (!ctx) return
    const { freq, duration, type = 'sine', gain = 0.3, delay = 0, glideTo } = opts
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), start + duration)

    env.gain.setValueAtTime(0.0001, start)
    env.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, duration * 0.25))
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    osc.connect(env)
    env.connect(bus)
    osc.start(start)
    osc.stop(start + duration + 0.05)
  }

  private noise(bus: GainNode, duration: number, gain: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const frames = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const env = ctx.createGain()
    env.gain.value = gain
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1400
    src.connect(filter)
    filter.connect(env)
    env.connect(bus)
    src.start()
  }

  play(name: SfxName, intensity = 0): void {
    if (!this.sfxEnabled) return
    const ctx = this.ensure()
    if (!ctx || !this.sfxBus) return
    const bus = this.sfxBus

    switch (name) {
      case 'click':
        this.tone(bus, { freq: 620, duration: 0.06, type: 'triangle', gain: 0.18 })
        break
      case 'tick':
        this.tone(bus, { freq: 1200, duration: 0.04, type: 'square', gain: 0.07 })
        break
      case 'correct':
        this.tone(bus, { freq: 659.25, duration: 0.12, type: 'sine', gain: 0.28 })
        this.tone(bus, { freq: 987.77, duration: 0.18, type: 'sine', gain: 0.24, delay: 0.09 })
        break
      case 'wrong':
        this.tone(bus, { freq: 220, duration: 0.22, type: 'sawtooth', gain: 0.18, glideTo: 110 })
        this.noise(bus, 0.16, 0.09)
        break
      case 'combo': {
        const step = Math.min(intensity, 7)
        for (let i = 0; i <= 2; i++) {
          this.tone(bus, {
            freq: SCALE[Math.min(SCALE.length - 1, step + i)] * 2,
            duration: 0.1,
            type: 'triangle',
            gain: 0.2,
            delay: i * 0.055,
          })
        }
        break
      }
      case 'levelup':
        ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.tone(bus, { freq: f, duration: 0.26, type: 'triangle', gain: 0.24, delay: i * 0.09 })
        })
        break
      case 'finish':
        ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.tone(bus, { freq: f, duration: 0.34, type: 'sine', gain: 0.22, delay: i * 0.12 })
        })
        break
    }
  }

  /* -------------------------------- BGM -------------------------------- */

  private BGM_PATTERN = [0, 2, 4, 2, 5, 4, 2, 0, 3, 5, 7, 5]

  startBgm(): void {
    const ctx = this.ensure()
    if (!ctx || !this.bgmBus || this.bgmTimer !== null) return
    const bus = this.bgmBus
    const stepMs = 380

    const tick = () => {
      if (!this.bgmEnabled) return
      const idx = this.BGM_PATTERN[this.bgmStep % this.BGM_PATTERN.length]
      const bar = Math.floor(this.bgmStep / this.BGM_PATTERN.length)
      this.tone(bus, {
        freq: SCALE[idx] * (bar % 2 === 0 ? 1 : 1.5),
        duration: 0.5,
        type: 'sine',
        gain: 0.22,
      })
      if (this.bgmStep % 4 === 0) {
        this.tone(bus, { freq: SCALE[idx] / 2, duration: 1.2, type: 'triangle', gain: 0.16 })
      }
      this.bgmStep++
    }

    tick()
    this.bgmTimer = window.setInterval(tick, stepMs)
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer)
      this.bgmTimer = null
    }
  }

  setBgm(enabled: boolean): void {
    this.bgmEnabled = enabled
    if (enabled) this.startBgm()
    else this.stopBgm()
  }

  setSfx(enabled: boolean): void {
    this.sfxEnabled = enabled
  }
}

export const audio = new AudioEngine()
