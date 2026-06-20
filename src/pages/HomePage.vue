<script setup lang="ts">
import FilterBar from '@/components/FilterBar.vue'
import TimelineChart from '@/components/TimelineChart.vue'
import DelayLabels from '@/components/DelayLabels.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import PlaybackBar from '@/components/PlaybackBar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import type { DelayEvent } from '@/types'
import { useFilterStore } from '@/stores/filter'
import { usePlaybackStore } from '@/stores/playback'
import { startPolling, stopPolling, dataRefreshError } from '@/services/dataService'

const filterStore = useFilterStore()
const playbackStore = usePlaybackStore()

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

onMounted(() => {
  filterStore.loadData()
  startPolling(10000)
})

onUnmounted(() => {
  stopPolling()
  playbackStore.dispose()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-[#1a2332] text-[#e2e8f0] relative">
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

    <PlaybackBar />

    <DetailPanel :event="selectedDelay" @close="closePanel" />

    <Transition name="toast">
      <div
        v-if="dataRefreshError"
        class="fixed top-4 right-4 px-4 py-2.5 rounded bg-[#ef4444]/90 text-white text-xs font-mono shadow-xl z-50 border border-[#ef4444]"
      >
        ⚠ {{ dataRefreshError }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
