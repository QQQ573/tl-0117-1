<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybackStore, PLAYBACK_START, PLAYBACK_END } from '@/stores/playback'

const store = usePlaybackStore()
const sliderRef = ref<HTMLInputElement>()

const totalMinutes = PLAYBACK_END - PLAYBACK_START

const ticks = computed(() => {
  const result: { min: number; label: string }[] = []
  for (let m = PLAYBACK_START; m <= PLAYBACK_END; m += 30) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    result.push({
      min: m,
      label: `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    })
  }
  return result
})

function onSliderInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  store.seek(PLAYBACK_START + (val / 100) * totalMinutes)
}

function onSliderChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  store.seek(PLAYBACK_START + (val / 100) * totalMinutes)
}

const speedOptions = [0.5, 1, 2, 4, 8]
</script>

<template>
  <div class="flex-shrink-0 px-5 py-3 bg-[#0f172a] border-t border-[#1e293b] flex items-center gap-4">
    <button
      class="w-9 h-9 rounded-full bg-[#00e676] hover:bg-[#00e676]/80 text-[#0f172a] flex items-center justify-center transition-colors flex-shrink-0"
      @click="store.toggle"
    >
      <span v-if="!store.isPlaying" class="text-sm">▶</span>
      <span v-else class="text-sm">❚❚</span>
    </button>

    <button
      class="w-8 h-8 rounded-full bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] flex items-center justify-center transition-colors flex-shrink-0 text-xs"
      @click="store.reset"
      title="重置"
    >
      ⏮
    </button>

    <div class="text-xs font-mono text-[#00e676] flex-shrink-0 w-[50px] text-right">
      {{ store.currentTimeStr }}
    </div>

    <div class="flex-1 relative">
      <div class="relative h-5 flex items-center">
        <div class="absolute w-full h-1 bg-[#1e293b] rounded"></div>
        <div
          class="absolute h-1 bg-[#00e676]/60 rounded"
          :style="{ width: store.progressPercent + '%' }"
        ></div>
        <input
          ref="sliderRef"
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="store.progressPercent"
          @input="onSliderInput"
          @change="onSliderChange"
          class="absolute w-full h-5 opacity-0 cursor-pointer z-10"
        />
        <div
          class="absolute w-3 h-3 rounded-full bg-[#00e676] shadow-lg -translate-x-1/2 pointer-events-none border-2 border-[#0f172a]"
          :style="{ left: store.progressPercent + '%' }"
        ></div>
      </div>
      <div class="flex justify-between mt-1 px-0.5">
        <span
          v-for="tick in ticks"
          :key="tick.min"
          class="text-[9px] font-mono text-[#64748b]"
        >
          {{ tick.label }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1 flex-shrink-0">
      <span class="text-[10px] font-mono text-[#64748b] mr-1">速度</span>
      <button
        v-for="s in speedOptions"
        :key="s"
        :class="[
          'px-2 py-1 rounded text-[10px] font-mono transition-colors',
          store.speed === s
            ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40'
            : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]'
        ]"
        @click="store.setSpeed(s)"
      >
        {{ s }}x
      </button>
    </div>
  </div>
</template>
