<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { usePlaybackStore } from '@/stores/playback'
import { useRiskStore } from '@/stores/risk'

const filterStore = useFilterStore()
const playbackStore = usePlaybackStore()
const riskStore = useRiskStore()

const kpis = computed(() => {
  const routes = filterStore.filteredRoutes
  const samples = filterStore.gpsSamples
  const currentMin = playbackStore.currentMinute
  const risks = riskStore.calculateRisks(routes, samples, currentMin)

  let normal = 0
  let warning = 0
  let critical = 0
  risks.forEach((r) => {
    if (r.level === 'normal') normal++
    else if (r.level === 'warning') warning++
    else if (r.level === 'critical') critical++
  })

  const reported = filterStore.filteredDelayEvents.filter((e) => e.isReported).length

  return [
    { label: '正常', value: normal, color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.4)' },
    { label: '预警', value: warning, color: '#ffd600', bg: 'rgba(255, 214, 0, 0.15)', border: 'rgba(255, 214, 0, 0.4)' },
    { label: '高危', value: critical, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
    { label: '已报备', value: reported, color: '#9e9e9e', bg: 'rgba(158, 158, 158, 0.15)', border: 'rgba(158, 158, 158, 0.4)' },
  ]
})
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <div
      v-for="kpi in kpis"
      :key="kpi.label"
      class="px-3 py-1.5 rounded text-xs font-mono border flex items-center gap-1.5"
      :style="{ backgroundColor: kpi.bg, borderColor: kpi.border, color: kpi.color }"
    >
      <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: kpi.color }"></span>
      <span class="opacity-80">{{ kpi.label }}</span>
      <span class="font-semibold text-sm">{{ kpi.value }}</span>
    </div>
  </div>
</template>
