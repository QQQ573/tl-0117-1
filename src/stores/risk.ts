import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RouteRisk,
  RiskLevel,
  ActionLog,
  DisposalActionType,
  BusRoute,
  GpsSample,
  DelayEvent,
} from '@/types'
import { DISPOSAL_ACTIONS, OPERATORS } from '@/types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTimeStr(m: number): string {
  const h = Math.floor(m / 60)
  const mm = Math.floor(m % 60)
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function genLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export const useRiskStore = defineStore('risk', () => {
  const actionLogs = ref<ActionLog[]>([])
  const remainingKmCache = ref<Map<string, number>>(new Map())

  function getRemainingKm(routeId: string): number {
    if (!remainingKmCache.value.has(routeId)) {
      const km = 8 + Math.random() * 7
      remainingKmCache.value.set(routeId, Math.round(km * 10) / 10)
    }
    return remainingKmCache.value.get(routeId)!
  }

  function calculateRouteRisk(
    route: BusRoute,
    samples: GpsSample[],
    currentMinute: number
  ): RouteRisk {
    const routeSamples = samples
      .filter((s) => s.routeId === route.id)
      .sort(
        (a, b) => timeToMinutes(b.timestamp) - timeToMinutes(a.timestamp)
      )
      .slice(0, 3)

    const plannedStart = timeToMinutes(route.plannedArriveStart)
    const plannedEnd = timeToMinutes(route.plannedArriveEnd)

    let avgSpeed = 0
    if (routeSamples.length > 0) {
      avgSpeed =
        routeSamples.reduce((sum, s) => sum + Math.max(s.speed, 5), 0) /
        routeSamples.length
    } else {
      avgSpeed = 30
    }

    const remainingKm = getRemainingKm(route.id)
    const hoursNeeded = remainingKm / Math.max(avgSpeed, 5)
    const minutesNeeded = hoursNeeded * 60
    const estimatedArrive = currentMinute + minutesNeeded
    const minutesBeyondPlan = estimatedArrive - plannedEnd

    let level: RiskLevel = 'normal'
    if (estimatedArrive > plannedEnd) {
      level = 'critical'
    } else if (estimatedArrive > plannedStart) {
      level = 'warning'
    }

    return {
      routeId: route.id,
      level,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      remainingKm,
      estimatedArrive: Math.round(estimatedArrive),
      plannedArriveStart: plannedStart,
      plannedArriveEnd: plannedEnd,
      minutesBeyondPlan: Math.round(minutesBeyondPlan),
    }
  }

  function calculateRisks(
    routes: BusRoute[],
    samples: GpsSample[],
    currentMinute: number
  ): Map<string, RouteRisk> {
    const result = new Map<string, RouteRisk>()
    routes.forEach((r) => {
      result.set(r.id, calculateRouteRisk(r, samples, currentMinute))
    })
    return result
  }

  function addActionLog(
    routeId: string,
    vehicleNo: string,
    actionType: DisposalActionType,
    remark: string
  ): ActionLog {
    const action = DISPOSAL_ACTIONS.find((a) => a.type === actionType)!
    const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)]
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const log: ActionLog = {
      id: genLogId(),
      routeId,
      vehicleNo,
      actionType,
      actionLabel: action.label,
      operator,
      timestamp: ts,
      remark: remark || '—',
      undone: false,
    }
    actionLogs.value.unshift(log)
    return log
  }

  function undoLastLog() {
    const lastIdx = actionLogs.value.findIndex((l) => !l.undone)
    if (lastIdx >= 0) {
      actionLogs.value[lastIdx].undone = true
    }
  }

  function updateDelayEvent(
    events: DelayEvent[],
    routeId: string,
    type: '堵车' | '司机误点' | '其他',
    remark: string
  ): DelayEvent | undefined {
    const ev = events.find((e) => e.routeId === routeId)
    if (ev) {
      ev.type = type
      ev.remark = remark
    }
    return ev
  }

  const riskColor: Record<RiskLevel, string> = {
    normal: '#00e676',
    warning: '#ffd600',
    critical: '#ef4444',
  }

  const riskLabel: Record<RiskLevel, string> = {
    normal: '正常',
    warning: '预警',
    critical: '高危',
  }

  return {
    actionLogs,
    calculateRouteRisk,
    calculateRisks,
    addActionLog,
    undoLastLog,
    updateDelayEvent,
    riskColor,
    riskLabel,
    getRemainingKm,
  }
})
