'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, CheckCircle, Clock, Edit, MapPin, Plus, Trash2, XCircle } from 'lucide-react'

export default function EventsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [_circles, setCircles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming') // upcoming, past, my

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await Promise.all([loadEvents(), loadCircles()])
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:users(first_name, last_name, avatar_url),
          circle:circles(name),
          church:churches(name),
          attendees:event_attendees(count),
          my_attendance:event_attendees(status, user_id)
        `)
        .order('event_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const loadCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('circle:circles(id, name)')
        .eq('user_id', user?.id)

      if (error) throw error
      setCircles(data?.map(item => item.circle) || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleRSVP = async (eventId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        })

      if (error) throw error
      loadEvents()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      loadEvents()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const getMyAttendance = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return event.my_attendance?.find((attendance: any) => attendance.user_id === user?.id)?.status // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const filteredEvents = events.filter(event => {
    const now = new Date()
    const eventDate = new Date(event.event_date)
    
    if (filter === 'upcoming') return eventDate >= now
    if (filter === 'past') return eventDate < now
    if (filter === 'my') return event.organizer_id === user?.id
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600">Discover and create community events</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/events/create')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'upcoming' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'past' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'my' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Events
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'upcoming' ? 'No upcoming events' : 
               filter === 'past' ? 'No past events' : 'No events created yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'my' 
                ? 'Create your first event!'
                : 'Check back later for new events'
              }
            </p>
            {filter === 'my' && (
              <button
                onClick={() => router.push('/dashboard/events/create')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        by {event.organizer?.first_name} {event.organizer?.last_name}
                      </p>
                    </div>
                  </div>
                  {event.organizer_id === user?.id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => router.push(`/dashboard/events/edit/${event.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.description || 'No description provided'}
                </p>

                {/* Date & Time */}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                )}

                {/* Circle/Church */}
                {(event.circle || event.church) && (
                  <div className="text-sm text-gray-500 mb-4">
                    {event.circle && <span>Circle: {event.circle.name}</span>}
                    {event.church && <span>Church: {event.church.name}</span>}
                  </div>
                )}

                {/* Attendees */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{event.attendees?.[0]?.count || 0} attending</span>
                  {event.max_attendees && (
                    <span>Max {event.max_attendees}</span>
                  )}
                </div>

                {/* RSVP Actions */}
                {event.organizer_id !== user?.id && (
                  <div className="flex space-x-2">
                    {getMyAttendance(event) === 'attending' ? (
                      <button
                        onClick={() => handleRSVP(event.id, 'not_attending')}
                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 text-sm flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Not Attending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRSVP(event.id, 'attending')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        RSVP
                      </button>
                    )}
                    <button
                      onClick={() => handleRSVP(event.id, 'maybe')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Maybe
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
