import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const examCenters = [
  { id: 'ec1', name: '县一中考点' },
  { id: 'ec2', name: '县二中考点' },
  { id: 'ec3', name: '实验高中考点' },
  { id: 'ec4', name: '职教中心考点' },
  { id: 'ec5', name: '城关中学考点' },
]

const centerColors = {
  ec1: '#42a5f5',
  ec2: '#66bb6a',
  ec3: '#ab47bc',
  ec4: '#ef5350',
  ec5: '#ffa726',
}

const vehiclePrefixes = ['陕A', '陕B', '陕C', '陕D', '陕E']

function genVehicleNo(i) {
  const prefix = vehiclePrefixes[i % vehiclePrefixes.length]
  const num = String(10001 + i).slice(1)
  return `${prefix}${num}`
}

function fmtMin(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const busRoutes = Array.from({ length: 23 }, (_, i) => {
  const centerId = examCenters[i % examCenters.length].id
  const baseDepart = 5 * 60 + 30
  const offset = Math.floor(i / 5) * 10
  const departMin = baseDepart + offset + (i % 3) * 5
  const arriveStartMin = departMin + 25 + (i % 4) * 5
  const arriveEndMin = arriveStartMin + 10

  return {
    id: `route_${i + 1}`,
    vehicleNo: genVehicleNo(i),
    examCenterId: centerId,
    hasSpecialStudent: i % 7 === 0,
    plannedDepart: fmtMin(departMin),
    plannedArriveStart: fmtMin(arriveStartMin),
    plannedArriveEnd: fmtMin(arriveEndMin),
    color: centerColors[centerId],
  }
})

function generateGpsSamples() {
  const samples = []
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
      const speed = Math.max(
        0,
        45 - progress * 20 - (delayOffset > 0 && progress > 0.5 ? 30 : 0) + Math.random() * 15
      )
      const condIdx =
        delayOffset > 0 && progress > 0.4
          ? Math.min(4, 2 + Math.floor(Math.random() * 3))
          : Math.floor(Math.random() * 2)

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

function generateDelayEvents(samples) {
  const events = []
  const routeSampleMap = new Map()
  samples.forEach((s) => {
    if (!routeSampleMap.has(s.routeId)) routeSampleMap.set(s.routeId, [])
    routeSampleMap.get(s.routeId).push(s)
  })

  busRoutes.forEach((route, ri) => {
    if (ri % 5 !== 2 && ri % 7 !== 3) return
    const routeSamples = routeSampleMap.get(route.id) || []
    const delayMin = ri % 5 === 2 ? 8 + (ri % 3) * 3 : 5
    const startIdx = Math.floor(routeSamples.length * 0.4)
    const endIdx = Math.min(
      routeSamples.length - 1,
      startIdx + Math.floor(delayMin / 2) + 1
    )

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

const gpsSamples = generateGpsSamples()
const delayEvents = generateDelayEvents(gpsSamples)

app.get('/api/exam-centers', (_req, res) => {
  res.json(examCenters)
})

app.get('/api/routes', (_req, res) => {
  res.json(busRoutes)
})

app.get('/api/routes/:id', (req, res) => {
  const route = busRoutes.find((r) => r.id === req.params.id)
  if (!route) return res.status(404).json({ error: 'Not found' })
  res.json(route)
})

app.get('/api/gps-samples', (_req, res) => {
  res.json(gpsSamples)
})

app.get('/api/gps-samples/route/:routeId', (req, res) => {
  const samples = gpsSamples.filter((s) => s.routeId === req.params.routeId)
  res.json(samples)
})

app.get('/api/delay-events', (_req, res) => {
  res.json(delayEvents)
})

app.get('/api/delay-events/route/:routeId', (req, res) => {
  const events = delayEvents.filter((e) => e.routeId === req.params.routeId)
  res.json(events)
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Mock API running on port ${PORT}`)
})
