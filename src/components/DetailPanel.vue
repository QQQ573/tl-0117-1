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
  (e: 'saved'): void
}>()

const store = useFilterStore()
const { isReadOnly } = useIpadReadOnly()
const visible = ref(false)
const editedType = ref<'堵车' | '司机误点' | '其他'>('堵车')
const editedRemark = ref('')

watch(
  () => props.event,
  (val) => {
    visible.value = !!val
    if (val) {
      editedType.value = val.type
      editedRemark.value = val.remark || ''
    }
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

function saveEdits() {
  if (props.event && !isReadOnly.value) {
    const ev = store.delayEvents.find(e => e.routeId === props.event!.routeId)
    if (ev) {
      ev.type = editedType.value
      ev.remark = editedRemark.value.slice(0, 50)
    }
    emit('saved')
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
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">晚点原因</div>
          <select
            v-model="editedType"
            :disabled="isReadOnly"
            class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-sm text-[#e2e8f0] font-mono focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          >
            <option value="堵车">堵车</option>
            <option value="司机误点">司机误点</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div>
          <div class="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mb-1">
            备注
            <span class="text-[#f59e0b]">{{ editedRemark.length }}/50</span>
          </div>
          <textarea
            v-model="editedRemark"
            :disabled="isReadOnly"
            placeholder="请输入备注信息（最多50字）"
            maxlength="50"
            class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-sm text-[#e2e8f0] font-mono focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 resize-none h-[60px]"
          ></textarea>
        </div>

        <div v-if="event.remark" class="text-[10px] text-[#64748b] font-mono">
          当前备注：{{ event.remark }}
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

        <div v-if="!isReadOnly" class="pt-2 space-y-2">
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
          <button
            class="w-full px-4 py-2 rounded text-xs font-mono bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30 hover:bg-[#3b82f6]/30 transition-colors"
            @click="saveEdits"
          >
            保存修改
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
