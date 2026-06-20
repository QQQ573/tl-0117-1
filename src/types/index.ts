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
}

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
