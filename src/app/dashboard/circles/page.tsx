'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Edit, Globe, Lock, MessageCircle, Plus, Search, Settings, Trash2, User, UserPlus, Users } from 'lucide-react'

export default function CirclesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [_circles, setCircles] = useState<any[]>([])
  const [allCircles, setAllCircles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('my') // my, all, public, private

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await Promise.all([loadMyCircles(), loadAllCircles()])
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadMyCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle:circles(
            id, name, description, privacy, created_at,
            owner:users(first_name, last_name),
            members:circle_members(count),
            church:churches(name)
          )
        `)
        .eq('user_id', user?.id)

      if (error) throw error
      setCircles(data?.map(item => item.circle) || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const loadAllCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          id, name, description, privacy, created_at,
          owner:users(first_name, last_name),
          members:circle_members(count),
          church:churches(name)
        `)
        .eq('privacy', 'public')

      if (error) throw error
      setAllCircles(data || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const joinCircle = async (circleId: string) => {
    try {
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member'
        })

      if (error) throw error
      loadMyCircles()
      loadAllCircles()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const leaveCircle = async (circleId: string) => {
    try {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', user.id)

      if (error) throw error
      loadMyCircles()
      loadAllCircles()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const deleteCircle = async (circleId: string) => {
    if (!confirm('Are you sure you want to delete this circle?')) return

    try {
      const { error } = await supabase
        .from('circles')
        .delete()
        .eq('id', circleId)

      if (error) throw error
      loadMyCircles()
      loadAllCircles()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const isMember = (circleId: string) => {
    return _circles.some(circle => circle.id === circleId)
  }

  const filteredCircles = (filter === 'my' ? _circles : allCircles).filter(circle =>
    circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circle.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading circles...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Circles</h1>
              <p className="text-gray-600">Connect with faith-based communities</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/circles/create')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Circle
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search circles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-3 rounded-lg ${
                filter === 'my' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Circles
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 rounded-lg ${
                filter === 'all' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Browse All
            </button>
          </div>
        </div>
      </div>

      {/* Circles Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredCircles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'my' ? 'No circles yet' : 'No circles found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'my' 
                ? 'Create your first circle or join existing ones!'
                : 'Try adjusting your search terms'
              }
            </p>
            {filter === 'my' && (
              <button
                onClick={() => router.push('/dashboard/circles/create')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Create Your First Circle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCircles.map((circle) => (
              <div key={circle.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{circle.name}</h3>
                      <p className="text-sm text-gray-500">
                        by {circle.owner?.first_name} {circle.owner?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {circle.privacy === 'private' ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500" />
                    )}
                    {isMember(circle.id) && circle.owner?.id === user?.id && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => router.push(`/dashboard/circles/edit/${circle.id}`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCircle(circle.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {circle.description || 'No description provided'}
                </p>

                {/* Church */}
                {circle.church && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Settings className="w-4 h-4 mr-2" />
                    {circle.church.name}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{circle.members?.[0]?.count || 0} members</span>
                  <span>{new Date(circle.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {isMember(circle.id) ? (
                    <>
                      <button
                        onClick={() => router.push(`/dashboard/circles/${circle.id}`)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        View Circle
                      </button>
                      <button
                        onClick={() => leaveCircle(circle.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Leave
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => joinCircle(circle.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Circle
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
