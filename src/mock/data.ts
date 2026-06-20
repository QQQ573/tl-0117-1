import type { ExamCenter, BusRoute, GpsSample, DelayEvent } from '@/types'

export const examCenters: ExamCenter[] = [
  { id: 'ec1', name: '县一中考点' },
  { id: 'ec2', name: '县二中考点' },
  { id: 'ec3', name: '实验高中考点' },
  { id: 'ec4', name: '职教中心考点' },
  { id: 'ec5', name: '城关中学考点' },
]

const centerColors: Record<string, string> = {
  ec1: '#42a5f5',
  ec2: '#66bb6a',
  ec3: '#ab47bc',
  ec4: '#ef5350',
  ec5: '#ffa726',
}

const vehiclePrefixes = [
  '陕A', '陕B', '陕C', '陕D', '陕E',
]

function genVehicleNo(i: number): string {
  const prefix = vehiclePrefixes[i % vehiclePrefixes.length]
  const num = String(10001 + i).slice(1)
  return `${prefix}${num}`
}

function genPlannedTimes(i: number): { depart: string; arriveStart: string; arriveEnd: string } {
  const baseDepart = 5 * 60 + 30
  const offset = Math.floor(i / 5) * 10
  const departMin = baseDepart + offset + (i % 3) * 5
  const arriveStartMin = departMin + 25 + (i % 4) * 5
  const arriveEndMin = arriveStartMin + 10
  return {
    depart: fmtMin(departMin),
    arriveStart: fmtMin(arriveStartMin),
    arriveEnd: fmtMin(arriveEndMin),
  }
}

function fmtMin(totalMin: number): string {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const busRoutes: BusRoute[] = Array.from({ length: 23 }, (_, i) => {
  const centerId = examCenters[i % examCenters.length].id
  const times = genPlannedTimes(i)
  return {
    id: `route_${i + 1}`,
    vehicleNo: genVehicleNo(i),
    examCenterId: centerId,
    hasSpecialStudent: i % 7 === 0,
    plannedDepart: times.depart,
    plannedArriveStart: times.arriveStart,
    plannedArriveEnd: times.arriveEnd,
    color: centerColors[centerId],
  }
})

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function generateGpsSamples(): GpsSample[] {
  const samples: GpsSample[] = []
  const conditions = ['畅通', '缓行', '拥堵', '施工路段', '事故路段']

  busRoutes.forEach((route, ri) => {
    const departMin = timeToMin(route.plannedDepart)
    const arriveEndMin = timeToMin(route.plannedArriveEnd)
    const totalDuration = arriveEndMin - departMin
    const sampleCount = Math.max(5, Math.floor(totalDuration / 2))

    let currentMin = departMin
    const delayOffset = ri % 5 === 2 ? 8 + (ri % 3) * 3 : ri % 7 === 3 ? 5 : 0

    for (let s = 0; s < sampleCount; s++) {
      const progress = s / (sampleCount - 1)
      const speed = Math.max(0, 45 - progress * 20 - (delayOffset > 0 && progress > 0.5 ? 30 : 0) + Math.random() * 15)
      const condIdx = delayOffset > 0 && progress > 0.4 ? Math.min(4, 2 + Math.floor(Math.random() * 3)) : Math.floor(Math.random() * 2)

      samples.push({
        routeId: route.id,
        timestamp: fmtMin(currentMin),
        speed: Math.round(speed * 10) / 10,
        lng: 108.9 + Math.random() * 0.1,
        lat: 34.2 + Math.random() * 0.1,
        roadCondition: conditions[condIdx],
      })
      currentMin += 2
    }
  })

  return samples
}

export function generateDelayEvents(samples: GpsSample[]): DelayEvent[] {
  const events: DelayEvent[] = []
  const routeSampleMap = new Map<string, GpsSample[]>()
  samples.forEach((s) => {
    if (!routeSampleMap.has(s.routeId)) routeSampleMap.set(s.routeId, [])
    routeSampleMap.get(s.routeId)!.push(s)
  })

  busRoutes.forEach((route, ri) => {
    if (ri % 5 !== 2 && ri % 7 !== 3) return
    const routeSamples = routeSampleMap.get(route.id) || []
    const delayMin = ri % 5 === 2 ? 8 + (ri % 3) * 3 : 5
    const startIdx = Math.floor(routeSamples.length * 0.4)
    const endIdx = Math.min(routeSamples.length - 1, startIdx + Math.floor(delayMin / 2) + 1)

    if (startIdx >= routeSamples.length || endIdx >= routeSamples.length) return

    const recentSamples = routeSamples.slice(Math.max(0, endIdx - 3), endIdx + 1)

    events.push({
      routeId: route.id,
      segmentStart: routeSamples[startIdx].timestamp,
      segmentEnd: routeSamples[endIdx].timestamp,
      delayMinutes: delayMin,
      isReported: false,
      type: ri % 5 === 2 ? '堵车' : '司机误点',
      recentSamples,
    })
  })

  return events
}

export const gpsSamples = generateGpsSamples()
export const delayEvents = generateDelayEvents(gpsSamples)
