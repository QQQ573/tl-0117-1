import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const PLAYBACK_START = 5 * 60 + 30
export const PLAYBACK_END = 9 * 60

export function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  const s = Math.floor((min % 1) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const usePlaybackStore = defineStore('playback', () => {
  const currentMinute = ref(PLAYBACK_START)
  const isPlaying = ref(false)
  const speed = ref(1)
  let tickTimer: ReturnType<typeof setInterval> | null = null

  const currentTimeStr = computed(() => {
    const m = Math.floor(currentMinute.value)
    const h = Math.floor(m / 60)
    const mm = m % 60
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  })

  const progressPercent = computed(() => {
    return ((currentMinute.value - PLAYBACK_START) / (PLAYBACK_END - PLAYBACK_START)) * 100
  })

  function startTick() {
    stopTick()
    tickTimer = setInterval(() => {
      if (currentMinute.value >= PLAYBACK_END) {
        stopTick()
        isPlaying.value = false
        return
      }
      currentMinute.value = Math.min(
        PLAYBACK_END,
        currentMinute.value + (1 / 60) * speed.value
      )
    }, 1000)
  }

  function stopTick() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function play() {
    if (currentMinute.value >= PLAYBACK_END) {
      currentMinute.value = PLAYBACK_START
    }
    isPlaying.value = true
    startTick()
  }

  function pause() {
    isPlaying.value = false
    stopTick()
  }

  function toggle() {
    if (isPlaying.value) pause()
    else play()
  }

  function seek(min: number) {
    currentMinute.value = Math.max(PLAYBACK_START, Math.min(PLAYBACK_END, min))
  }

  function reset() {
    pause()
    currentMinute.value = PLAYBACK_START
  }

  function setSpeed(s: number) {
    speed.value = s
    if (isPlaying.value) {
      startTick()
    }
  }

  function dispose() {
    stopTick()
  }

  return {
    currentMinute,
    isPlaying,
    speed,
    currentTimeStr,
    progressPercent,
    play,
    pause,
    toggle,
    seek,
    reset,
    setSpeed,
    dispose,
  }
})
