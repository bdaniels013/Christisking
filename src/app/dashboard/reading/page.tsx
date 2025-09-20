'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, Calendar, Plus } from 'lucide-react'

export default function ReadingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [myPlans, setMyPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, my, public

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await Promise.all([loadPlans(), loadMyPlans()])
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_plans')
        .select(`
          *,
          created_by_user:users(first_name, last_name),
          assignments:reading_plan_assignments(count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlans(data || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const loadMyPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_plan_assignments')
        .select(`
          plan:reading_plans(
            id, name, description, duration_days,
            created_by_user:users(first_name, last_name)
          ),
          start_date,
          progress:reading_progress(count)
        `)
        .eq('user_id', user?.id)

      if (error) throw error
      setMyPlans(data?.map(item => ({
        ...item.plan,
        assignment: item,
        progress_count: item.progress?.[0]?.count || 0
      })) || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const joinPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('reading_plan_assignments')
        .insert({
          plan_id: planId,
          user_id: user.id,
          start_date: new Date().toISOString().split('T')[0]
        })

      if (error) throw error
      loadMyPlans()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const getProgressPercentage = (plan: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!plan.assignment) return 0
    const daysPassed = Math.floor((new Date().getTime() - new Date(plan.assignment.start_date).getTime()) / (1000 * 60 * 60 * 24))
    const totalDays = plan.duration_days
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  }

  const filteredPlans = filter === 'my' ? myPlans : plans

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reading plans...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Reading Plans</h1>
              <p className="text-gray-600">Grow in your understanding of God's word</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/reading/create')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Plan
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Plans
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'my' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Plans
          </button>
        </div>
      </div>

      {/* Reading Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'my' ? 'No reading plans yet' : 'No reading plans available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'my' 
                ? 'Join a reading plan to get started!'
                : 'Be the first to create a reading plan!'
              }
            </p>
            {filter === 'my' ? (
              <button
                onClick={() => setFilter('all')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Browse All Plans
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/reading/create')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Create Your First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        by {plan.created_by_user?.first_name} {plan.created_by_user?.last_name}
                      </p>
                    </div>
                  </div>
                  {filter === 'my' && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">
                        {plan.progress_count}/{plan.duration_days} days
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {plan.description || 'No description provided'}
                </p>

                {/* Duration */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  {plan.duration_days} days
                </div>

                {/* Progress Bar (for my plans) */}
                {filter === 'my' && plan.assignment && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage(plan))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(plan)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{plan.assignments?.[0]?.count || 0} participants</span>
                  <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {filter === 'my' ? (
                    <button
                      onClick={() => router.push(`/dashboard/reading/${plan.id}`)}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Continue Reading
                    </button>
                  ) : (
                    <button
                      onClick={() => joinPlan(plan.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Join Plan
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/reading/${plan.id}`)}
                    className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
