<script setup lang="ts">
import FilterBar from '@/components/FilterBar.vue'
import TimelineChart from '@/components/TimelineChart.vue'
import DelayLabels from '@/components/DelayLabels.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import { ref } from 'vue'
import type { DelayEvent } from '@/types'

const selectedDelay = ref<DelayEvent | null>(null)

function onSelectDelay(event: DelayEvent) {
  selectedDelay.value = event
}

function onLabelSelect(event: DelayEvent) {
  selectedDelay.value = event
}

function closePanel() {
  selectedDelay.value = null
}
</script>

<template>
  <div class="h-screen flex flex-col bg-[#1a2332] text-[#e2e8f0]">
    <header class="flex-shrink-0">
      <FilterBar />
    </header>

    <div class="flex-1 flex overflow-hidden">
      <aside class="w-[160px] flex-shrink-0 border-r border-[#1e293b] overflow-y-auto bg-[#0f172a]/50">
        <DelayLabels @select="onLabelSelect" />
      </aside>

      <main class="flex-1 overflow-hidden p-3">
        <TimelineChart @select-delay="onSelectDelay" />
      </main>
    </div>

    <DetailPanel :event="selectedDelay" @close="closePanel" />
  </div>
</template>
