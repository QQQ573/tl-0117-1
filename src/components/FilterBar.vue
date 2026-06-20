<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'
import { useIpadReadOnly } from '@/composables/useIpadReadOnly'
import { computed } from 'vue'

const store = useFilterStore()
const { isReadOnly } = useIpadReadOnly()

const centerOptions = computed(() =>
  store.examCenters.map((c) => ({ label: c.name, value: c.id }))
)
const vehicleOptions = computed(() =>
  store.busRoutes.map((r) => ({ label: `${r.vehicleNo} (${r.id})`, value: r.id }))
)

const centerSelectAll = computed({
  get: () => store.selectedCenters.length === store.examCenters.length,
  set: (v: boolean) => store.setCenters(v ? store.examCenters.map((c) => c.id) : []),
})

const vehicleSelectAll = computed({
  get: () => store.selectedVehicles.length === store.busRoutes.length,
  set: (v: boolean) => store.setVehicles(v ? store.busRoutes.map((r) => r.id) : []),
})

function toggleCenter(id: string) {
  const idx = store.selectedCenters.indexOf(id)
  if (idx >= 0) {
    const next = [...store.selectedCenters]
    next.splice(idx, 1)
    store.setCenters(next)
  } else {
    store.setCenters([...store.selectedCenters, id])
  }
}

function toggleVehicle(id: string) {
  const idx = store.selectedVehicles.indexOf(id)
  if (idx >= 0) {
    const next = [...store.selectedVehicles]
    next.splice(idx, 1)
    store.setVehicles(next)
  } else {
    store.setVehicles([...store.selectedVehicles, id])
  }
}

const specialLabel = computed(() => (store.specialStudentOnly ? '仅特殊考生' : '全部考生'))
const rainLabel = computed(() => (store.rainReported ? '暴雨封路已报备 ✓' : '暴雨封路报备'))
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 px-5 py-3 bg-[#0f172a] border-b border-[#1e293b]">
    <div class="relative group">
      <button
        class="px-3 py-1.5 rounded bg-[#1e293b] text-[#cbd5e1] text-xs font-mono hover:bg-[#334155] transition-colors flex items-center gap-1"
      >
        考点 ({{ store.selectedCenters.length }}/{{ store.examCenters.length }})
        <span class="text-[10px]">▾</span>
      </button>
      <div class="absolute top-full left-0 mt-1 bg-[#1e293b] border border-[#334155] rounded shadow-xl z-50 min-w-[180px] hidden group-hover:block">
        <label class="flex items-center gap-2 px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#334155] cursor-pointer border-b border-[#334155]">
          <input type="checkbox" :checked="centerSelectAll" @change="centerSelectAll = !centerSelectAll" class="accent-[#00e676]" />
          全选/取消
        </label>
        <label v-for="c in centerOptions" :key="c.value" class="flex items-center gap-2 px-3 py-1.5 text-xs text-[#cbd5e1] hover:bg-[#334155] cursor-pointer">
          <input type="checkbox" :checked="store.selectedCenters.includes(c.value)" @change="toggleCenter(c.value)" class="accent-[#00e676]" />
          {{ c.label }}
        </label>
      </div>
    </div>

    <div class="relative group">
      <button
        class="px-3 py-1.5 rounded bg-[#1e293b] text-[#cbd5e1] text-xs font-mono hover:bg-[#334155] transition-colors flex items-center gap-1"
      >
        车辆 ({{ store.selectedVehicles.length }}/{{ store.busRoutes.length }})
        <span class="text-[10px]">▾</span>
      </button>
      <div class="absolute top-full left-0 mt-1 bg-[#1e293b] border border-[#334155] rounded shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto hidden group-hover:block">
        <label class="flex items-center gap-2 px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#334155] cursor-pointer border-b border-[#334155]">
          <input type="checkbox" :checked="vehicleSelectAll" @change="vehicleSelectAll = !vehicleSelectAll" class="accent-[#00e676]" />
          全选/取消
        </label>
        <label v-for="v in vehicleOptions" :key="v.value" class="flex items-center gap-2 px-3 py-1.5 text-xs text-[#cbd5e1] hover:bg-[#334155] cursor-pointer">
          <input type="checkbox" :checked="store.selectedVehicles.includes(v.value)" @change="toggleVehicle(v.value)" class="accent-[#00e676]" />
          {{ v.label }}
        </label>
      </div>
    </div>

    <button
      :class="[
        'px-3 py-1.5 rounded text-xs font-mono transition-colors',
        store.specialStudentOnly ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40' : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
      ]"
      @click="store.setSpecialStudentOnly(!store.specialStudentOnly)"
    >
      {{ specialLabel }}
    </button>

    <button
      v-if="!isReadOnly"
      :class="[
        'px-3 py-1.5 rounded text-xs font-mono transition-colors',
        store.rainReported ? 'bg-[#ffa726]/20 text-[#ffa726] border border-[#ffa726]/40' : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
      ]"
      @click="store.setRainReported(!store.rainReported)"
    >
      {{ rainLabel }}
    </button>

    <div v-if="store.dataLastRefresh" class="ml-auto flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
      <span class="text-[10px] font-mono text-[#64748b]">
        刷新于 {{ store.dataLastRefresh }}
      </span>
    </div>

    <div v-if="isReadOnly" class="px-3 py-1.5 rounded bg-[#ffa726]/15 text-[#ffa726] text-xs font-mono border border-[#ffa726]/30">
      只读模式 (iPad)
    </div>
  </div>
</template>
