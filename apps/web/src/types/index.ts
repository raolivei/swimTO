export interface Facility {
  facility_id: string
  name: string
  address: string | null
  postal_code: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  is_indoor: boolean
  has_indoor?: boolean
  has_outdoor?: boolean
  phone: string | null
  website: string | null
  is_free_entry: boolean
  source: string | null
  created_at: string
  updated_at: string
  next_session?: Session | null
  session_count?: number
}

export interface Session {
  id: number
  facility_id: string
  swim_type: string
  date: string
  start_time: string
  end_time: string
  notes: string | null
  age_min: number | null
  age_max: number | null
  source: string | null
  created_at: string
  facility?: Facility
}

export interface SessionWithFacility extends Session {
  facility: Facility
}

export type SwimType = 'LANE_SWIM' | 'RECREATIONAL' | 'ADULT_SWIM' | 'SENIOR_SWIM' | 'AQUATIC_FITNESS' | 'OTHER'

export interface ScheduleFilters {
  facility_id?: string
  district?: string
  swim_type?: SwimType
  date_from?: string
  date_to?: string
  time_from?: string
  time_to?: string
  age_max?: number
  limit?: number
  offset?: number
}

