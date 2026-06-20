import { ref, onMounted, onUnmounted } from 'vue'

export function useIpadReadOnly() {
  const isIpadPortrait = ref(false)
  const isReadOnly = ref(false)

  function check() {
    const ua = navigator.userAgent
    const isIpad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isPortrait = window.innerHeight > window.innerWidth
    isIpadPortrait.value = isIpad && isPortrait
    isReadOnly.value = isIpadPortrait.value
  }

  onMounted(() => {
    check()
    window.addEventListener('resize', check)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', check)
  })

  return { isIpadPortrait, isReadOnly }
}
