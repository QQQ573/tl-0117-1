import { ref } from 'vue'
import type { ExamCenter, BusRoute, GpsSample, DelayEvent } from '@/types'
import {
  examCenters as localCenters,
  busRoutes as localRoutes,
  gpsSamples as localSamples,
  delayEvents as localDelays,
} from '@/mock/data'

const API_BASE = '/api'

export const dataLastRefresh = ref<string>('')
export const dataRefreshError = ref<string>('')
export const isDataLoading = ref(false)

export interface DataBundle {
  examCenters: ExamCenter[]
  busRoutes: BusRoute[]
  gpsSamples: GpsSample[]
  delayEvents: DelayEvent[]
}

export const dataCache: DataBundle = {
  examCenters: localCenters,
  busRoutes: localRoutes,
  gpsSamples: localSamples,
  delayEvents: localDelays,
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function formatRefreshTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAllData(showError = true): Promise<DataBundle> {
  isDataLoading.value = true
  dataRefreshError.value = ''
  try {
    const [centers, routes, samples, delays] = await Promise.all([
      fetchJson<ExamCenter[]>(`${API_BASE}/exam-centers`),
      fetchJson<BusRoute[]>(`${API_BASE}/routes`),
      fetchJson<GpsSample[]>(`${API_BASE}/gps-samples`),
      fetchJson<DelayEvent[]>(`${API_BASE}/delay-events`),
    ])

    dataCache.examCenters = centers.length ? centers : localCenters
    dataCache.busRoutes = routes.length ? routes : localRoutes
    dataCache.gpsSamples = samples.length ? samples : localSamples
    dataCache.delayEvents = delays.length ? delays : localDelays

    dataLastRefresh.value = formatRefreshTime(new Date())
    isDataLoading.value = false
    return { ...dataCache }
  } catch (e) {
    if (showError) {
      dataRefreshError.value = '数据刷新失败，已沿用缓存'
      setTimeout(() => {
        dataRefreshError.value = ''
      }, 3000)
    }
    dataLastRefresh.value = dataLastRefresh.value || formatRefreshTime(new Date())
    isDataLoading.value = false
    return { ...dataCache }
  }
}

export function startPolling(intervalMs: number = 10000) {
  stopPolling()
  fetchAllData(true).catch(() => {})
  pollTimer = setInterval(() => {
    fetchAllData(true).catch(() => {})
  }, intervalMs)
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
