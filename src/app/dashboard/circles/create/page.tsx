&apos;use client&apos;

import { useState, useEffect } from &apos;react&apos;
import { useRouter } from &apos;next/navigation&apos;
import { supabase } from &apos;@/lib/supabase&apos;
import { ArrowLeft } from 'lucide-react';lucide-react&apos;

export default function CreateCirclePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: &apos;&apos;,
    description: &apos;&apos;,
    privacy: &apos;public&apos;,
    church_id: &apos;&apos;
  })
  const [churches, setChurches] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push(&apos;/auth/signin&apos;)
        return
      }
      
      setUser(session.user)
      await loadChurches()
    }

    loadData()
  }, [router])

  const loadChurches = async () => {
    try {
      const { data, error } = await supabase
        .from(&apos;churches&apos;)
        .select(&apos;id, name, city, state&apos;)
        .order(&apos;name&apos;)

      if (error) throw error
      setChurches(data || [])
    } catch (error) {
      console.error(&apos;Error loading churches:&apos;, error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(&apos;circles&apos;)
        .insert({
          name: formData.name,
          description: formData.description,
          privacy: formData.privacy,
          owner_id: user.id,
          church_id: formData.church_id || null
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as owner
      await supabase
        .from(&apos;circle_members&apos;)
        .insert({
          circle_id: data.id,
          user_id: user.id,
          role: &apos;owner&apos;
        })

      router.push(&apos;/dashboard/circles&apos;)
    } catch (error) {
      console.error(&apos;Error creating circle:&apos;, error)
      alert(&apos;Error creating circle. Please try again.&apos;)
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
              <h1 className="text-2xl font-bold text-gray-900">Create Circle</h1>
              <p className="text-gray-600">Start a new faith-based community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Circle Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Circle Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Young Adults Bible Study, Prayer Warriors, etc."
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Describe what this circle is about, its purpose, and what members can expect..."
              />
            </div>

            {/* Privacy */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Privacy Setting
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === &apos;public&apos;}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                    className="mr-3"
                  />
                  <Globe className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-sm text-gray-500">Anyone can find and join this circle</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === &apos;private&apos;}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                    className="mr-3"
                  />
                  <Lock className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-sm text-gray-500">Only invited members can join</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Church Association */}
            <div className="mb-6">
              <label htmlFor="church" className="block text-sm font-medium text-gray-700 mb-2">
                Associated Church (Optional)
              </label>
              <select
                id="church"
                value={formData.church_id}
                onChange={(e) => setFormData({ ...formData, church_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">No church association</option>
                {churches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name} - {church.city}, {church.state}
                  </option>
                ))}
              </select>
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
                  &apos;Creating...&apos;
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create Circle
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
