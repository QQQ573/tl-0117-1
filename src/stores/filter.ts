import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { FilterState, DelayEvent, ExamCenter, BusRoute, GpsSample } from '@/types'
import { dataCache, fetchAllData, dataLastRefresh, dataRefreshError } from '@/services/dataService'

export const useFilterStore = defineStore('filter', () => {
  const examCenters = ref<ExamCenter[]>(dataCache.examCenters)
  const busRoutes = ref<BusRoute[]>(dataCache.busRoutes)
  const gpsSamples = ref<GpsSample[]>(dataCache.gpsSamples)
  const delayEvents = ref<DelayEvent[]>(JSON.parse(JSON.stringify(dataCache.delayEvents)))

  const selectedCenters = ref<string[]>(examCenters.value.map((c) => c.id))
  const selectedVehicles = ref<string[]>(busRoutes.value.map((r) => r.id))
  const specialStudentOnly = ref(false)
  const rainReported = ref(false)

  function refreshFromCache() {
    examCenters.value = dataCache.examCenters
    busRoutes.value = dataCache.busRoutes
    gpsSamples.value = dataCache.gpsSamples
    const newDelays = JSON.parse(JSON.stringify(dataCache.delayEvents))
    delayEvents.value.forEach((de) => {
      const existing = newDelays.find((nd: DelayEvent) => nd.routeId === de.routeId)
      if (existing && de.isReported) {
        existing.isReported = true
      }
    })
    delayEvents.value = newDelays

    selectedCenters.value = selectedCenters.value.filter((id) =>
      examCenters.value.some((c) => c.id === id)
    )
    if (selectedCenters.value.length === 0) {
      selectedCenters.value = examCenters.value.map((c) => c.id)
    }
    selectedVehicles.value = selectedVehicles.value.filter((id) =>
      busRoutes.value.some((r) => r.id === id)
    )
    if (selectedVehicles.value.length === 0) {
      selectedVehicles.value = busRoutes.value.map((r) => r.id)
    }
  }

  watch(
    () => dataLastRefresh.value,
    () => {
      refreshFromCache()
    }
  )

  async function loadData() {
    await fetchAllData(true)
    refreshFromCache()
  }

  const filteredRoutes = computed(() => {
    return busRoutes.value.filter((r) => {
      if (!selectedCenters.value.includes(r.examCenterId)) return false
      if (!selectedVehicles.value.includes(r.id)) return false
      if (specialStudentOnly.value && !r.hasSpecialStudent) return false
      return true
    })
  })

  const filteredDelayEvents = computed(() => {
    const routeIds = new Set(filteredRoutes.value.map((r) => r.id))
    return delayEvents.value.filter((e) => routeIds.has(e.routeId))
  })

  function toggleRainReported(routeId: string) {
    const ev = delayEvents.value.find((e) => e.routeId === routeId)
    if (ev) {
      ev.isReported = !ev.isReported
    }
  }

  function setCenters(ids: string[]) {
    selectedCenters.value = ids
  }

  function setVehicles(ids: string[]) {
    selectedVehicles.value = ids
  }

  function setSpecialStudentOnly(val: boolean) {
    specialStudentOnly.value = val
  }

  function setRainReported(val: boolean) {
    rainReported.value = val
    if (val) {
      delayEvents.value.forEach((e) => {
        e.isReported = true
      })
    }
  }

  const filterState = computed<FilterState>(() => ({
    selectedCenters: selectedCenters.value,
    selectedVehicles: selectedVehicles.value,
    specialStudentOnly: specialStudentOnly.value,
    rainReported: rainReported.value,
  }))

  return {
    examCenters,
    busRoutes,
    gpsSamples,
    delayEvents,
    selectedCenters,
    selectedVehicles,
    specialStudentOnly,
    rainReported,
    filteredRoutes,
    filteredDelayEvents,
    filterState,
    dataLastRefresh,
    dataRefreshError,
    toggleRainReported,
    setCenters,
    setVehicles,
    setSpecialStudentOnly,
    setRainReported,
    loadData,
  }
})
