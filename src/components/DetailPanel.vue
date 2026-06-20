<script setup lang="ts">
import type { DelayEvent } from '@/types'
import { ref, watch } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { useIpadReadOnly } from '@/composables/useIpadReadOnly'

const props = defineProps<{
  event: DelayEvent | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useFilterStore()
const { isReadOnly } = useIpadReadOnly()
const visible = ref(false)

watch(
  () => props.event,
  (val) => {
    visible.value = !!val
  }
)

function close() {
  visible.value = false
  emit('close')
}

function toggleReport() {
  if (props.event && !isReadOnly.value) {
    store.toggleRainReported(props.event.routeId)
  }
}
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible && event"
      class="fixed right-0 top-0 h-full w-[320px] bg-[#0f172a]/98 border-l border-[#1e293b] shadow-2xl z-50 flex flex-col"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
        <span class="text-sm font-mono text-[#e2e8f0]">晚点详情</span>
        <button
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1e293b] text-[#94a3b8] transition-colors text-lg"
          @click="close"
        >
          ×
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">线路</div>
          <div class="text-sm text-[#e2e8f0] font-mono">{{ event.routeId }}</div>
        </div>

        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">晚点时段</div>
          <div class="text-sm text-[#e2e8f0] font-mono">{{ event.segmentStart }} — {{ event.segmentEnd }}</div>
        </div>

        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">晚点时长</div>
          <div class="text-lg font-mono" :class="event.isReported ? 'text-[#9e9e9e]' : 'text-[#ff9100]'">
            +{{ event.delayMinutes }} 分钟
          </div>
        </div>

        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">类型</div>
          <div class="text-sm text-[#e2e8f0] font-mono">{{ event.type }}</div>
        </div>

        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">最近三次采样</div>
          <div class="space-y-2">
            <div
              v-for="(sample, idx) in event.recentSamples.slice(-3)"
              :key="idx"
              class="bg-[#1e293b] rounded px-3 py-2"
            >
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-[#94a3b8]">{{ sample.timestamp }}</span>
                <span class="text-[#00e676]">{{ sample.speed }} km/h</span>
              </div>
              <div class="text-[10px] text-[#64748b] mt-0.5 font-mono">{{ sample.roadCondition }}</div>
            </div>
          </div>
        </div>

        <div v-if="!isReadOnly" class="pt-2">
          <button
            :class="[
              'w-full px-4 py-2 rounded text-xs font-mono transition-colors',
              event.isReported
                ? 'bg-[#9e9e9e]/20 text-[#9e9e9e] border border-[#9e9e9e]/30 hover:bg-[#9e9e9e]/30'
                : 'bg-[#ffa726]/20 text-[#ffa726] border border-[#ffa726]/30 hover:bg-[#ffa726]/30'
            ]"
            @click="toggleReport"
          >
            {{ event.isReported ? '取消暴雨封路报备' : '标记为暴雨封路已报备' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
