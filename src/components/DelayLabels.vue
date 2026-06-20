<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'
import { computed } from 'vue'
import type { DelayEvent } from '@/types'

const store = useFilterStore()
const emit = defineEmits<{
  (e: 'select', event: DelayEvent): void
}>()

const centerMap = computed(() => new Map(store.examCenters.map((c) => [c.id, c.name])))
const routeMap = computed(() => new Map(store.busRoutes.map((r) => [r.id, r])))

const labeledDelays = computed(() => {
  return store.filteredDelayEvents.map((ev) => {
    const route = routeMap.value.get(ev.routeId)
    return {
      ...ev,
      vehicleNo: route?.vehicleNo || ev.routeId,
      centerName: route ? centerMap.value.get(route.examCenterId) || '' : '',
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-1.5 py-2 px-2">
    <div class="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1 font-mono px-1">晚点待核实</div>
    <div
      v-for="ev in labeledDelays"
      :key="ev.routeId + ev.segmentStart"
      :class="[
        'px-2.5 py-1.5 rounded text-[11px] font-mono cursor-pointer transition-all',
        ev.isReported
          ? 'bg-[#9e9e9e]/15 text-[#9e9e9e] border border-[#9e9e9e]/30 hover:bg-[#9e9e9e]/25'
          : 'bg-[#ff9100]/15 text-[#ff9100] border border-[#ff9100]/30 hover:bg-[#ff9100]/25'
      ]"
      @click="emit('select', ev)"
    >
      <div class="flex items-center justify-between">
        <span>{{ ev.vehicleNo }}</span>
        <span class="text-[10px] opacity-70">+{{ ev.delayMinutes }}min</span>
      </div>
      <div class="text-[10px] opacity-60 mt-0.5">
        {{ ev.segmentStart }}–{{ ev.segmentEnd }} · {{ ev.type }}
      </div>
      <div v-if="ev.isReported" class="text-[9px] mt-0.5 opacity-50">已报备</div>
    </div>
    <div v-if="labeledDelays.length === 0" class="text-[11px] text-[#475569] font-mono px-1">
      暂无晚点记录
    </div>
  </div>
</template>
