import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from '@/lib/api'
import { formatDate, formatTimeRange, getSwimTypeLabel, getSwimTypeColor, getDayOfWeek } from '@/lib/utils'
import { Filter, MapPin, AlertCircle, RefreshCw, List, Table2 } from 'lucide-react'
import type { SwimType, Session } from '@/types'

type ViewMode = 'list' | 'table'

export default function ScheduleView() {
  const [swimType, setSwimType] = useState<SwimType | 'ALL'>('LANE_SWIM')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const { data: sessions, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['schedule', swimType],
    queryFn: () => scheduleApi.getSchedule({
      swim_type: swimType === 'ALL' ? undefined : swimType,
    }),
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to Load Schedule
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't load the swim schedule. This might be due to:
                </p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc list-inside">
                  <li>Network connectivity issues</li>
                  <li>API service temporarily unavailable</li>
                  <li>Server maintenance</li>
                </ul>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  {isRefetching ? 'Retrying...' : 'Try Again'}
                </button>
                {error instanceof Error && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      Technical details
                    </summary>
                    <p className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {error.message}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Group sessions by facility and weekday for table view
  const sessionsByFacilityAndDay = sessions?.reduce((acc, session) => {
    const facilityName = session.facility?.name || 'Unknown'
    const dayOfWeek = new Date(session.date).getDay()
    
    if (!acc[facilityName]) {
      acc[facilityName] = {
        facility: session.facility,
        sessions: {}
      }
    }
    
    if (!acc[facilityName].sessions[dayOfWeek]) {
      acc[facilityName].sessions[dayOfWeek] = []
    }
    
    acc[facilityName].sessions[dayOfWeek].push(session)
    return acc
  }, {} as Record<string, { facility: any; sessions: Record<number, Session[]> }>)

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50 to-primary-50/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-3">
            Swim Schedule
          </h1>
          <p className="text-gray-600 text-lg">Browse upcoming swim sessions across Toronto</p>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 font-semibold md:hidden hover:text-primary-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table2 className="w-5 h-5" />
                <span className="hidden sm:inline">Table View</span>
              </button>
            </div>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'LANE_SWIM', 'RECREATIONAL', 'ADULT_SWIM', 'SENIOR_SWIM'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSwimType(type as SwimType | 'ALL')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    swimType === type
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
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
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading schedule...</p>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-xl font-semibold">No sessions found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dateSessions = sessionsByDate[date]
              return (
                <div key={date} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 transform transition-all duration-300 hover:shadow-xl">
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
                    <p className="text-sm text-primary-100 font-medium">{getDayOfWeek(date)}</p>
                  </div>

                  {/* Sessions */}
                  <div className="divide-y divide-gray-200">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-5 hover:bg-primary-50/50 transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Time */}
                          <div className="md:w-48 flex-shrink-0">
                            <p className="text-lg font-bold text-gray-900">
                              {formatTimeRange(session.start_time, session.end_time)}
                            </p>
                          </div>

                          {/* Facility */}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 text-lg">
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
                                  className="hover:text-primary-600 hover:underline transition-colors"
                                >
                                  {session.facility.address}
                                </a>
                              </p>
                            )}
                          </div>

                          {/* Type */}
                          <div className="flex-shrink-0">
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getSwimTypeColor(session.swim_type)} shadow-sm`}>
                              {getSwimTypeLabel(session.swim_type)}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {session.notes && (
                          <p className="mt-3 text-sm text-gray-600 md:ml-48 bg-gray-50 p-3 rounded-lg">
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
        ) : (
          /* Table View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider sticky left-0 bg-primary-500 z-10">
                      Community Center
                    </th>
                    {weekdays.map((day) => (
                      <th key={day} className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider min-w-[120px]">
                        {day.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(sessionsByFacilityAndDay || {}).map(([facilityName, data]) => (
                    <tr key={facilityName} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-6 py-4 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-gray-200">
                        <div className="font-bold text-gray-900">{facilityName}</div>
                        {data.facility?.address && (
                          <div className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{data.facility.address}</span>
                          </div>
                        )}
                      </td>
                      {weekdays.map((_, dayIndex) => {
                        const daySessions = data.sessions[dayIndex] || []
                        return (
                          <td key={dayIndex} className="px-4 py-4 text-center align-top">
                            {daySessions.length > 0 ? (
                              <div className="space-y-2">
                                {daySessions.slice(0, 3).map((session) => (
                                  <div key={session.id} className="text-xs">
                                    <div className="font-semibold text-gray-900">
                                      {formatTimeRange(session.start_time, session.end_time)}
                                    </div>
                                    <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-[10px] font-bold ${getSwimTypeColor(session.swim_type)}`}>
                                      {getSwimTypeLabel(session.swim_type)}
                                    </span>
                                  </div>
                                ))}
                                {daySessions.length > 3 && (
                                  <div className="text-xs text-primary-600 font-semibold">
                                    +{daySessions.length - 3} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Object.keys(sessionsByFacilityAndDay || {}).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No facilities found with the selected filters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

