export interface ExamCenter {
  id: string
  name: string
}

export interface BusRoute {
  id: string
  vehicleNo: string
  examCenterId: string
  hasSpecialStudent: boolean
  plannedDepart: string
  plannedArriveStart: string
  plannedArriveEnd: string
  color: string
}

export interface GpsSample {
  routeId: string
  timestamp: string
  speed: number
  lng: number
  lat: number
  roadCondition: string
}

export interface DelayEvent {
  routeId: string
  segmentStart: string
  segmentEnd: string
  delayMinutes: number
  isReported: boolean
  type: '堵车' | '司机误点' | '其他'
  recentSamples: GpsSample[]
  remark?: string
}

export type RiskLevel = 'normal' | 'warning' | 'critical'

export interface RouteRisk {
  routeId: string
  level: RiskLevel
  avgSpeed: number
  remainingKm: number
  estimatedArrive: number
  plannedArriveStart: number
  plannedArriveEnd: number
  minutesBeyondPlan: number
}

export type DisposalActionType = 'call_driver' | 'notify_center' | 'dispatch_spare'

export interface DisposalAction {
  type: DisposalActionType
  label: string
  icon: string
}

export interface ActionLog {
  id: string
  routeId: string
  vehicleNo: string
  actionType: DisposalActionType
  actionLabel: string
  operator: string
  timestamp: string
  remark: string
  undone: boolean
}

export const DISPOSAL_ACTIONS: DisposalAction[] = [
  { type: 'call_driver', label: '呼叫司机', icon: '📞' },
  { type: 'notify_center', label: '通知考点', icon: '📢' },
  { type: 'dispatch_spare', label: '派备用车', icon: '🚐' },
]

export const OPERATORS = ['张调度', '李主任', '王值班', '赵协调']

export interface FilterState {
  selectedCenters: string[]
  selectedVehicles: string[]
  specialStudentOnly: boolean
  rainReported: boolean
}

export interface TimelineSegment {
  routeId: string
  vehicleNo: string
  examCenterName: string
  examCenterId: string
  hasSpecialStudent: boolean
  plannedStart: number
  plannedEnd: number
  actualPoints: { time: number; speed: number }[]
  delaySegments: {
    start: number
    end: number
    delayMinutes: number
    isReported: boolean
    type: '堵车' | '司机误点' | '其他'
    recentSamples: GpsSample[]
  }[]
  color: string
}
