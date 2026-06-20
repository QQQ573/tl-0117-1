import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState, DelayEvent } from '@/types'
import { busRoutes, examCenters, gpsSamples, delayEvents as mockDelayEvents } from '@/mock/data'

export const useFilterStore = defineStore('filter', () => {
  const selectedCenters = ref<string[]>(examCenters.map((c) => c.id))
  const selectedVehicles = ref<string[]>(busRoutes.map((r) => r.id))
  const specialStudentOnly = ref(false)
  const rainReported = ref(false)

  const delayEvents = ref<DelayEvent[]>(JSON.parse(JSON.stringify(mockDelayEvents)))

  const filteredRoutes = computed(() => {
    return busRoutes.filter((r) => {
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
    selectedCenters,
    selectedVehicles,
    specialStudentOnly,
    rainReported,
    delayEvents,
    filteredRoutes,
    filteredDelayEvents,
    filterState,
    toggleRainReported,
    setCenters,
    setVehicles,
    setSpecialStudentOnly,
    setRainReported,
  }
})
