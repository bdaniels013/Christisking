'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, BookOpen, Calendar, Church, Cross, Heart, LogOut, Plus, Settings, Star, User, Users } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    circles: 0,
    testimonies: 0,
    prayers: 0,
    events: 0
  })

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await loadStats()
      setLoading(false)
    }

    loadData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadStats()
      } else {
        router.push('/auth/signin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const loadStats = async () => {
    try {
      const [circlesResult, testimoniesResult, prayersResult, eventsResult] = await Promise.all([
        supabase.from('circles').select('id', { count: 'exact' }),
        supabase.from('testimonies').select('id', { count: 'exact' }),
        supabase.from('prayer_requests').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' })
      ])

      setStats({
        circles: circlesResult.count || 0,
        testimonies: testimoniesResult.count || 0,
        prayers: prayersResult.count || 0,
        events: eventsResult.count || 0
      })
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Cross className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Connect with Christ</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-red-600">
                    {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.first_name || 'Friend'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your journey of faith and community
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Circles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.circles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Prayer Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prayers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Testimonies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.testimonies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Circles */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/circles')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Circles</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Join or create faith-based communities
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View Circles
              </button>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Testimonies */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/testimonies')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Testimonies</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Share your faith journey with others
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                View Testimonies
              </button>
              <button className="px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prayer */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/prayer')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Prayer</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Share prayer requests and support others
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                View Prayers
              </button>
              <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Events */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/events')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Events</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Find and create community events
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                View Events
              </button>
              <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Churches */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/churches')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Church className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Churches</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Discover local churches and communities
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                View Churches
              </button>
              <button className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reading */}
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/reading')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Reading</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Bible reading plans and devotionals
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                View Plans
              </button>
              <button className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
