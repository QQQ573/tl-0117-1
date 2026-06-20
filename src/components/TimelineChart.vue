<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useFilterStore } from '@/stores/filter'
import { usePlaybackStore } from '@/stores/playback'
import { useRiskStore } from '@/stores/risk'
import type { DelayEvent, RouteRisk } from '@/types'

const filterStore = useFilterStore()
const playbackStore = usePlaybackStore()
const riskStore = useRiskStore()
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
const emit = defineEmits<{
  (e: 'selectDelay', event: DelayEvent): void
}>()

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function buildOption() {
  const routes = filterStore.filteredRoutes
  const delays = filterStore.filteredDelayEvents
  const samples = filterStore.gpsSamples
  const centers = filterStore.examCenters
  const centerMap = new Map(centers.map((c) => [c.id, c.name]))
  const playbackCutoff = playbackStore.currentMinute

  const risks = riskStore.calculateRisks(routes, samples, playbackCutoff)

  const grouped = new Map<string, typeof routes>()
  routes.forEach((r) => {
    const cname = centerMap.get(r.examCenterId) || r.examCenterId
    if (!grouped.has(cname)) grouped.set(cname, [])
    grouped.get(cname)!.push(r)
  })

  const yCategories: string[] = []
  const routeYIndex = new Map<string, number>()

  for (const [cname, rs] of grouped) {
    rs.forEach((r) => {
      routeYIndex.set(r.id, yCategories.length)
      yCategories.push(`${r.vehicleNo} → ${cname}`)
    })
  }

  const planBandData: any[] = []
  const delayMarkData: any[] = []
  const gpsLineSeries: any[] = []
  const riskDotData: any[] = []
  const predictionLineData: any[] = []

  routes.forEach((route) => {
    const yIdx = routeYIndex.get(route.id)!
    const startMin = timeToMinutes(route.plannedArriveStart)
    const endMin = timeToMinutes(route.plannedArriveEnd)
    const risk = risks.get(route.id)

    planBandData.push({
      value: [startMin, yIdx, endMin - startMin, route.id],
      itemStyle: {
        color: route.color,
        opacity: 0.25,
      },
    })

    const riskColor = risk ? riskStore.riskColor[risk.level] : '#64748b'
    riskDotData.push({
      value: [startMin - 25, yIdx, route.id],
      itemStyle: { color: riskColor },
      riskLevel: risk?.level || 'normal',
      routeId: route.id,
    })

    const routeSamples = samples.filter((s) => s.routeId === route.id)
    const points: number[][] = []
    routeSamples.forEach((s) => {
      const t = timeToMinutes(s.timestamp)
      if (t >= startMin - 30 && t <= endMin + 30 && t <= playbackCutoff) {
        points.push([t, yIdx, s.speed])
      }
    })
    points.sort((a, b) => a[0] - b[0])

    if (points.length > 0) {
      gpsLineSeries.push({
        name: `GPS_${route.id}`,
        type: 'line',
        data: points,
        encode: { x: 0, y: 1 },
        symbolSize: 5,
        lineStyle: { width: 2, color: '#00e676' },
        itemStyle: { color: '#00e676' },
        z: 10,
        symbol: 'circle',
        showSymbol: true,
        hoverAnimation: false,
      })

      if (risk && risk.level === 'critical' && points.length > 0) {
        const lastPoint = points[points.length - 1]
        const predictEnd = Math.min(risk.estimatedArrive, 9 * 60 + 30)
        predictionLineData.push({
          value: [lastPoint[0], yIdx, predictEnd, route.id],
          lineStyle: {
            color: '#ef4444',
            width: 2,
            type: 'dashed',
          },
          risk,
        })
      }
    }
  })

  delays.forEach((delay) => {
    const yIdx = routeYIndex.get(delay.routeId)
    if (yIdx === undefined) return
    const startT = timeToMinutes(delay.segmentStart)
    const endT = timeToMinutes(delay.segmentEnd)
    delayMarkData.push({
      value: [startT, yIdx, endT - startT, delay.routeId],
      itemStyle: {
        color: delay.isReported ? '#9e9e9e' : '#ff9100',
        opacity: 0.45,
      },
      delay,
    })
  })

  const xMin = 5 * 60 + 30
  const xMax = 9 * 60

  const series: any[] = [
    {
      name: '风险色点',
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const x = api.value(0)
        const yIdx = api.value(1)
        const coord = api.coord([x, yIdx])
        return {
          type: 'circle',
          shape: {
            cx: coord[0] - 15,
            cy: coord[1],
            r: 4,
          },
          style: api.style(),
        }
      },
      data: riskDotData,
      encode: { x: 0, y: 1 },
      z: 15,
      tooltip: {
        formatter: (params: any) => {
          const d = params.data
          const r = risks.get(d.routeId)
          if (!r) return ''
          const label = riskStore.riskLabel[d.riskLevel as keyof typeof riskStore.riskLabel]
          const color = riskStore.riskColor[d.riskLevel as keyof typeof riskStore.riskColor]
          return `<span style="color:${color}"><b>${label}</b></span><br/>` +
            `均速: ${r.avgSpeed} km/h<br/>` +
            `剩余: ${r.remainingKm} km<br/>` +
            `预计到达: ${minutesToTime(r.estimatedArrive)}<br/>` +
            `超计划: ${r.minutesBeyondPlan > 0 ? '+' : ''}${r.minutesBeyondPlan} min`
        },
      },
    },
    {
      name: '计划到达窗',
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const start = api.value(0)
        const yIdx = api.value(1)
        const duration = api.value(2)
        const bandStart = api.coord([start, yIdx])
        const bandEnd = api.coord([start + duration, yIdx])
        const height = api.size([0, 1])[1] * 0.6
        return {
          type: 'rect',
          shape: {
            x: bandStart[0],
            y: bandStart[1] - height / 2,
            width: bandEnd[0] - bandStart[0],
            height,
          },
          style: api.style(),
        }
      },
      data: planBandData,
      encode: { x: [0, 2], y: 1 },
      z: 5,
    },
    {
      name: '晚点区间',
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const start = api.value(0)
        const yIdx = api.value(1)
        const duration = api.value(2)
        const bandStart = api.coord([start, yIdx])
        const bandEnd = api.coord([start + duration, yIdx])
        const height = api.size([0, 1])[1] * 0.6
        return {
          type: 'rect',
          shape: {
            x: bandStart[0],
            y: bandStart[1] - height / 2,
            width: bandEnd[0] - bandStart[0],
            height,
          },
          style: api.style(),
        }
      },
      data: delayMarkData,
      encode: { x: [0, 2], y: 1 },
      z: 8,
    },
    {
      name: '预测延伸段',
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const startX = api.value(0)
        const yIdx = api.value(1)
        const endX = api.value(2)
        const startCoord = api.coord([startX, yIdx])
        const endCoord = api.coord([endX, yIdx])
        return {
          type: 'line',
          shape: {
            x1: startCoord[0],
            y1: startCoord[1],
            x2: endCoord[0],
            y2: endCoord[1],
          },
          style: {
            stroke: '#ef4444',
            lineWidth: 2,
            lineDash: [6, 4],
          },
        }
      },
      data: predictionLineData,
      encode: { x: [0, 2], y: 1 },
      z: 9,
      tooltip: {
        formatter: (params: any) => {
          const r = params.data.risk as RouteRisk
          if (!r) return ''
          return `<b style="color:#ef4444">高危预测</b><br/>` +
            `预计到达: ${minutesToTime(r.estimatedArrive)}<br/>` +
            `超计划: +${r.minutesBeyondPlan} min`
        },
      },
    },
    ...gpsLineSeries,
    {
      name: '当前时间线',
      type: 'custom',
      renderItem: (_params: any, api: any) => {
        const coord = api.coord([playbackCutoff, 0])
        const coordEnd = api.coord([playbackCutoff, yCategories.length - 1])
        return {
          type: 'line',
          shape: {
            x1: coord[0],
            y1: coord[1] - 20,
            x2: coordEnd[0],
            y2: coordEnd[1] + 20,
          },
          style: {
            stroke: '#00e676',
            lineWidth: 2,
            lineDash: [4, 4],
          },
          silent: true,
        }
      },
      data: [{ value: [playbackCutoff, 0] }],
      encode: { x: 0, y: 1 },
      z: 20,
      silent: true,
    },
  ]

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,35,50,0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
      formatter: (params: any) => {
        const d = params.data
        if (d.delay) {
          const dl = d.delay as DelayEvent
          return `<b>晚点待核实</b><br/>` +
            `线路: ${dl.routeId}<br/>` +
            `时段: ${dl.segmentStart} - ${dl.segmentEnd}<br/>` +
            `晚点: ${dl.delayMinutes} 分钟<br/>` +
            `类型: ${dl.type}<br/>` +
            `报备: ${dl.isReported ? '已报备' : '未报备'}`
        }
        if (d.value && d.value.length === 4 && !d.delay && !params.seriesName?.startsWith('GPS_') && params.seriesName !== '预测延伸段' && params.seriesName !== '风险色点') {
          return `计划窗口: ${minutesToTime(d.value[0])} - ${minutesToTime(d.value[0] + d.value[2])}`
        }
        if (params.seriesName?.startsWith('GPS_') && d.value) {
          return `GPS 采样<br/>时间: ${minutesToTime(d.value[0])}<br/>速度: ${d.value[2]} km/h`
        }
        return ''
      },
    },
    grid: {
      left: 180,
      right: 40,
      top: 30,
      bottom: 80,
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        minValue: xMin,
        maxValue: xMax,
        start: 0,
        end: 100,
        height: 20,
        bottom: 40,
        borderColor: '#334155',
        backgroundColor: '#0f172a',
        fillerColor: 'rgba(0, 230, 118, 0.15)',
        handleStyle: { color: '#00e676', borderColor: '#0f172a' },
        moveHandleStyle: { color: '#00e676' },
        selectedDataBackground: {
          lineStyle: { color: '#475569' },
          areaStyle: { color: 'rgba(71, 85, 105, 0.2)' },
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
        },
        labelFormatter: (v: number) => minutesToTime(v),
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        minValue: xMin,
        maxValue: xMax,
        start: 0,
        end: 100,
      },
    ],
    xAxis: {
      type: 'value',
      min: xMin,
      max: xMax,
      axisLabel: {
        formatter: (v: number) => minutesToTime(v),
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
      },
      splitLine: {
        lineStyle: { color: '#1e293b', type: 'dashed' as const },
      },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      inverse: true,
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        width: 150,
        overflow: 'truncate' as const,
      },
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
    },
    series,
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
    chart.on('click', (params: any) => {
      if (params.data?.delay) {
        emit('selectDelay', params.data.delay as DelayEvent)
      }
    })
  }
  chart.setOption(buildOption(), true)
  chart.resize()
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    chart?.resize()
  }, 280)
}

onMounted(() => {
  nextTick(renderChart)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})

watch(
  () => filterStore.filterState,
  () => {
    nextTick(renderChart)
  },
  { deep: true }
)

watch(
  () => filterStore.delayEvents,
  () => {
    nextTick(renderChart)
  },
  { deep: true }
)

watch(
  () => playbackStore.currentMinute,
  () => {
    nextTick(renderChart)
  }
)

watch(
  [() => filterStore.examCenters, () => filterStore.busRoutes, () => filterStore.gpsSamples],
  () => {
    nextTick(renderChart)
  },
  { deep: true }
)
</script>

<template>
  <div ref="chartRef" class="w-full h-full min-h-[500px]"></div>
</template>
