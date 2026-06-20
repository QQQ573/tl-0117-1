import { ref, onMounted, onUnmounted } from 'vue'

export function useResizeDebounce(delay: number = 280) {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  let timer: ReturnType<typeof setTimeout> | null = null

  function onResize() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }, delay)
  }

  onMounted(() => {
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    if (timer) clearTimeout(timer)
  })

  return { width, height }
}
