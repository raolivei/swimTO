import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from '@/lib/api'
import { formatDate, formatTimeRange, getSwimTypeLabel, getSwimTypeColor, getDayOfWeek } from '@/lib/utils'
import { Filter, MapPin } from 'lucide-react'
import type { SwimType } from '@/types'

export default function ScheduleView() {
  const [swimType, setSwimType] = useState<SwimType | 'ALL'>('LANE_SWIM')
  const [showFilters, setShowFilters] = useState(false)

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['schedule', swimType],
    queryFn: () => scheduleApi.getSchedule({
      swim_type: swimType === 'ALL' ? undefined : swimType,
    }),
  })

  // Group sessions by date
  const sessionsByDate = sessions?.reduce((acc, session) => {
    const date = session.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {} as Record<string, typeof sessions>)

  const sortedDates = Object.keys(sessionsByDate || {}).sort()

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load schedule</p>
          <p className="text-gray-600 mt-2">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swim Schedule</h1>
          <p className="text-gray-600">Browse upcoming swim sessions across Toronto</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 font-semibold mb-4 md:hidden"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'LANE_SWIM', 'RECREATIONAL', 'ADULT_SWIM', 'SENIOR_SWIM'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSwimType(type as SwimType | 'ALL')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    swimType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'ALL' ? 'All Types' : getSwimTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No sessions found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dateSessions = sessionsByDate[date]
              return (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-primary-500 text-white px-6 py-3">
                    <h2 className="text-xl font-semibold">{formatDate(date)}</h2>
                    <p className="text-sm text-primary-100">{getDayOfWeek(date)}</p>
                  </div>

                  {/* Sessions */}
                  <div className="divide-y divide-gray-200">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Time */}
                          <div className="md:w-48 flex-shrink-0">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatTimeRange(session.start_time, session.end_time)}
                            </p>
                          </div>

                          {/* Facility */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {session.facility?.name}
                            </h3>
                            {session.facility?.address && (
                              <p className="text-sm text-gray-600 flex items-start gap-1">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    session.facility.address
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary-500 hover:underline"
                                >
                                  {session.facility.address}
                                </a>
                              </p>
                            )}
                          </div>

                          {/* Type */}
                          <div className="flex-shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSwimTypeColor(session.swim_type)}`}>
                              {getSwimTypeLabel(session.swim_type)}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {session.notes && (
                          <p className="mt-2 text-sm text-gray-600 md:ml-48">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

