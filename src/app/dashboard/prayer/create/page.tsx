'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ArrowLeft, Globe, Heart, User, Users } from 'lucide-react'

export default function CreatePrayerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_urgent: false,
    is_public: true,
    circle_id: ''
  })
  const [_circles, setCircles] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await loadCircles()
    }

    loadData()
  }, [router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: user.id,
          circle_id: formData.is_public ? null : formData.circle_id,
          is_public: formData.is_public,
          is_urgent: formData.is_urgent,
          status: 'active'
        })

      if (error) throw error

      router.push('/dashboard/prayer')
    } catch (_error) {
      console.error('Error:', _error)
      alert('Error creating prayer request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request Prayer</h1>
              <p className="text-gray-600">Share your prayer needs with the community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Prayer Request Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Brief description of your prayer need"
                required
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Prayer Details *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Share the details of your prayer request. Be as specific as you&apos;re comfortable with..."
                required
              />
            </div>

            {/* Urgent Checkbox */}
            <div className="mb-6">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="mr-3"
                />
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Urgent Prayer Request</p>
                  <p className="text-sm text-gray-500">Mark this as urgent for immediate prayer support</p>
                </div>
              </label>
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who can see this prayer request?
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: true })}
                    className="mr-3"
                  />
                  <Globe className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-sm text-gray-500">Everyone can see and pray for this request</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="circle"
                    checked={!formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: false })}
                    className="mr-3"
                  />
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Circle Only</p>
                    <p className="text-sm text-gray-500">Only members of your circle can see this</p>
                  </div>
                </label>
              </div>

              {/* Circle Selection */}
              {!formData.is_public && (
                <div className="mt-4">
                  <label htmlFor="circle" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Circle
                  </label>
                  <select
                    id="circle"
                    value={formData.circle_id}
                    onChange={(e) => setFormData({ ...formData, circle_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required={!formData.is_public}
                  >
                    <option value="">Choose a circle</option>
                    {_circles.map((circle) => (
                      <option key={circle.id} value={circle.id}>
                        {circle.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Request Prayer
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
