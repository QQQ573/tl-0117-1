<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { usePlaybackStore } from '@/stores/playback'
import { useRiskStore } from '@/stores/risk'
import { useIpadReadOnly } from '@/composables/useIpadReadOnly'
import { DISPOSAL_ACTIONS } from '@/types'
import type { DisposalActionType, BusRoute } from '@/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const filterStore = useFilterStore()
const playbackStore = usePlaybackStore()
const riskStore = useRiskStore()
const { isReadOnly } = useIpadReadOnly()

const isOpen = ref(props.open)
const actionRemark = ref<Map<string, string>>(new Map())

watch(
  () => props.open,
  (val) => {
    isOpen.value = val
  }
)

watch(isOpen, (val) => {
  emit('update:open', val)
})

const criticalRoutes = computed(() => {
  const routes = filterStore.filteredRoutes
  const samples = filterStore.gpsSamples
  const currentMin = playbackStore.currentMinute
  const risks = riskStore.calculateRisks(routes, samples, currentMin)
  const result: { route: BusRoute; level: string }[] = []
  risks.forEach((risk, routeId) => {
    if (risk.level === 'critical') {
      const route = routes.find((r) => r.id === routeId)
      if (route) {
        result.push({ route, level: risk.level })
      }
    }
  })
  return result
})

const recentLogs = computed(() => {
  return riskStore.actionLogs.slice(0, 15)
})

const canUndo = computed(() => {
  if (isReadOnly) return false
  return riskStore.actionLogs.some((l) => !l.undone)
})

function performAction(route: BusRoute, actionType: DisposalActionType) {
  if (isReadOnly) return
  const remark = actionRemark.value.get(route.id) || ''
  riskStore.addActionLog(route.id, route.vehicleNo, actionType, remark)
  actionRemark.value.set(route.id, '')
}

function undoLast() {
  if (isReadOnly) return
  riskStore.undoLastLog()
}
</script>

<template>
  <div
    :class="[
      'absolute top-0 right-0 h-full transition-all duration-300 z-30 flex',
      isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-32px)]'
    ]"
    style="pointer-events: auto"
  >
    <button
      class="w-8 h-full bg-[#1e293b] hover:bg-[#334155] border-l border-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-[#cbd5e1] transition-colors flex-shrink-0"
      @click="isOpen = !isOpen"
      :title="isOpen ? '收起台账' : '展开台账'"
    >
      <span class="text-xs font-mono" :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }">
        ❯
      </span>
    </button>

    <div class="w-[320px] h-full bg-[#0f172a] border-l border-[#1e293b] flex flex-col overflow-hidden">
      <div class="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-base">📋</span>
          <span class="text-xs font-mono text-[#cbd5e1] font-semibold uppercase tracking-widest">处置台账</span>
        </div>
        <span class="text-[10px] font-mono text-[#64748b]">{{ criticalRoutes.length }} 条高危</span>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="p-3 border-b border-[#1e293b]">
          <div class="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-2">高危线路</div>
          <div v-if="criticalRoutes.length === 0" class="text-[11px] text-[#475569] font-mono py-2">
            暂无高危线路
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="item in criticalRoutes"
              :key="item.route.id"
              class="p-2.5 rounded bg-[#1a2332] border border-[#ef4444]/30"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono text-[#ef4444] font-semibold">
                  {{ item.route.vehicleNo }}
                </span>
                <span class="text-[9px] font-mono text-[#64748b]">
                  {{ item.route.hasSpecialStudent ? '含特殊考生' : '普通' }}
                </span>
              </div>
              <div v-if="!isReadOnly" class="mb-2">
                <input
                  type="text"
                  :value="actionRemark.get(item.route.id) || ''"
                  @input="actionRemark.set(item.route.id, ($event.target as HTMLInputElement).value)"
                  placeholder="备注（选填）..."
                  class="w-full px-2 py-1.5 text-[11px] font-mono bg-[#0f172a] border border-[#334155] rounded text-[#cbd5e1] placeholder-[#475569] focus:outline-none focus:border-[#ef4444]/50"
                />
              </div>
              <div class="flex gap-1 flex-wrap">
                <button
                  v-for="action in DISPOSAL_ACTIONS"
                  :key="action.type"
                  :disabled="isReadOnly"
                  :class="[
                    'flex-1 min-w-[80px] px-2 py-1.5 rounded text-[10px] font-mono transition-colors flex items-center justify-center gap-1',
                    isReadOnly
                      ? 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                      : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/25'
                  ]"
                  @click="performAction(item.route, action.type)"
                >
                  <span>{{ action.icon }}</span>
                  <span>{{ action.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">操作日志</div>
            <button
              v-if="canUndo"
              class="px-2 py-0.5 rounded text-[9px] font-mono bg-[#334155] text-[#94a3b8] hover:bg-[#475569] transition-colors"
              @click="undoLast"
            >
              ↶ 撤销
            </button>
          </div>
          <div v-if="recentLogs.length === 0" class="text-[11px] text-[#475569] font-mono py-2">
            暂无操作记录
          </div>
          <div v-else class="flex flex-col gap-1.5">
            <div
              v-for="log in recentLogs"
              :key="log.id"
              :class="[
                'p-2 rounded text-[11px] font-mono border-l-2',
                log.undone
                  ? 'bg-[#1a2332]/50 border-l-[#64748b] opacity-50 line-through'
                  : 'bg-[#1a2332] border-l-[#00e676]'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="text-[#00e676]">{{ log.actionLabel }}</span>
                <span class="text-[#64748b]">{{ log.timestamp }}</span>
              </div>
              <div class="text-[#cbd5e1] mt-0.5">
                {{ log.vehicleNo }} · {{ log.operator }}
              </div>
              <div v-if="log.remark !== '—'" class="text-[#94a3b8] text-[10px] mt-0.5">
                {{ log.remark }}
              </div>
              <div v-if="log.undone" class="text-[#64748b] text-[10px] mt-0.5">
                已撤销
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isReadOnly" class="px-4 py-2 bg-[#ffa726]/10 border-t border-[#ffa726]/20 text-center flex-shrink-0">
        <span class="text-[10px] font-mono text-[#ffa726]">只读模式 · 操作已禁用</span>
      </div>
    </div>
  </div>
</template>
