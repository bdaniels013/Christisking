'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, Edit, Heart, MessageCircle, Plus, Trash2 } from 'lucide-react'

export default function PrayerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [prayers, setPrayers] = useState<any[]>([])
  const [_circles, setCircles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, answered, urgent

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await Promise.all([loadPrayers(), loadCircles()])
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadPrayers = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          *,
          author:users(first_name, last_name, avatar_url),
          circle:circles(name),
          supporters:prayer_support(count),
          support:prayer_support(user_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrayers(data || [])
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

  const handleSupport = async (prayerId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_support')
        .upsert({
          prayer_id: prayerId,
          user_id: user.id
        })

      if (error) throw error
      loadPrayers()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleDelete = async (prayerId: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) return

    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', prayerId)

      if (error) throw error
      loadPrayers()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleStatusChange = async (prayerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ status })
        .eq('id', prayerId)

      if (error) throw error
      loadPrayers()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const isSupporting = (prayer: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return prayer.support?.some((s: any) => s.user_id === user?.id) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const filteredPrayers = prayers.filter(prayer => {
    if (filter === 'all') return true
    if (filter === 'active') return prayer.status === 'active'
    if (filter === 'answered') return prayer.status === 'answered'
    if (filter === 'urgent') return prayer.is_urgent
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading prayer requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
              <p className="text-gray-600">Share prayer needs and support others</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/prayer/create')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Request Prayer
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'answered' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Answered
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'urgent' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Urgent
          </button>
        </div>
      </div>

      {/* Prayer Requests */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredPrayers.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prayer requests yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share a prayer request!</p>
            <button
              onClick={() => router.push('/dashboard/prayer/create')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              Share Your First Prayer Request
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPrayers.map((prayer) => (
              <div key={prayer.id} className="bg-white rounded-xl shadow-sm border p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">
                        {prayer.author?.first_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">
                        {prayer.author?.first_name} {prayer.author?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(prayer.created_at).toLocaleDateString()}
                        {prayer.circle && ` • ${prayer.circle.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {prayer.is_urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      prayer.status === 'active' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : prayer.status === 'answered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prayer.status}
                    </span>
                    {prayer.author_id === user?.id && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => router.push(`/dashboard/prayer/edit/${prayer.id}`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prayer.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {prayer.title}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {prayer.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleSupport(prayer.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isSupporting(prayer)
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      <span>{prayer.supporters?.[0]?.count || 0} praying</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                      <MessageCircle className="w-5 h-5" />
                      <span>Comment</span>
                    </button>
                  </div>
                  
                  {prayer.author_id === user?.id && prayer.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(prayer.id, 'answered')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Answered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
