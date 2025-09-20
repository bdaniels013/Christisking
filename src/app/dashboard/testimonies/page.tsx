&apos;use client&apos;

import { useState, useEffect } from &apos;react&apos;
import { useRouter } from &apos;next/navigation&apos;
import { supabase } from &apos;@/lib/supabase&apos;
import { Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';lucide-react&apos;

export default function TestimoniesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [testimonies, setTestimonies] = useState<any[]>([])
  const [circles, setCircles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(&apos;all&apos;) // all, public, circle, private

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push(&apos;/auth/signin&apos;)
        return
      }
      
      setUser(session.user)
      await Promise.all([loadTestimonies(), loadCircles()])
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadTestimonies = async () => {
    try {
      const { data, error } = await supabase
        .from(&apos;testimonies&apos;)
        .select(`
          *,
          author:users(first_name, last_name, avatar_url),
          circle:circles(name),
          reactions:testimony_reactions(reaction_type, user_id),
          comments:testimony_comments(id, content, author_id, created_at, author:users(first_name, last_name))
        `)
        .order(&apos;created_at&apos;, { ascending: false })

      if (error) throw error
      setTestimonies(data || [])
    } catch (error) {
      console.error(&apos;Error loading testimonies:&apos;, error)
    }
  }

  const loadCircles = async () => {
    try {
      const { data, error } = await supabase
        .from(&apos;circle_members&apos;)
        .select(&apos;circle:circles(id, name)&apos;)
        .eq(&apos;user_id&apos;, user?.id)

      if (error) throw error
      setCircles(data?.map(item => item.circle) || [])
    } catch (error) {
      console.error(&apos;Error loading circles:&apos;, error)
    }
  }

  const handleReaction = async (testimonyId: string, reactionType: string) => {
    try {
      const { error } = await supabase
        .from(&apos;testimony_reactions&apos;)
        .upsert({
          testimony_id: testimonyId,
          user_id: user.id,
          reaction_type: reactionType
        })

      if (error) throw error
      loadTestimonies()
    } catch (error) {
      console.error(&apos;Error adding reaction:&apos;, error)
    }
  }

  const handleDelete = async (testimonyId: string) => {
    if (!confirm(&apos;Are you sure you want to delete this testimony?&apos;)) return

    try {
      const { error } = await supabase
        .from(&apos;testimonies&apos;)
        .delete()
        .eq(&apos;id&apos;, testimonyId)

      if (error) throw error
      loadTestimonies()
    } catch (error) {
      console.error(&apos;Error deleting testimony:&apos;, error)
    }
  }

  const filteredTestimonies = testimonies.filter(testimony => {
    if (filter === &apos;all&apos;) return true
    if (filter === &apos;public&apos;) return testimony.visibility === &apos;public&apos;
    if (filter === &apos;circle&apos;) return testimony.visibility === &apos;circle&apos;
    if (filter === &apos;private&apos;) return testimony.visibility === &apos;private&apos;
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading testimonies...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Testimonies</h1>
              <p className="text-gray-600">Share your faith journey with others</p>
            </div>
            <button
              onClick={() => router.push(&apos;/dashboard/testimonies/create&apos;)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Share Testimony
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter(&apos;all&apos;)}
            className={`px-4 py-2 rounded-lg ${
              filter === &apos;all&apos; 
                ? &apos;bg-red-600 text-white&apos; 
                : &apos;bg-white text-gray-700 hover:bg-gray-50&apos;
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter(&apos;public&apos;)}
            className={`px-4 py-2 rounded-lg ${
              filter === &apos;public&apos; 
                ? &apos;bg-red-600 text-white&apos; 
                : &apos;bg-white text-gray-700 hover:bg-gray-50&apos;
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setFilter(&apos;circle&apos;)}
            className={`px-4 py-2 rounded-lg ${
              filter === &apos;circle&apos; 
                ? &apos;bg-red-600 text-white&apos; 
                : &apos;bg-white text-gray-700 hover:bg-gray-50&apos;
            }`}
          >
            Circle
          </button>
          <button
            onClick={() => setFilter(&apos;private&apos;)}
            className={`px-4 py-2 rounded-lg ${
              filter === &apos;private&apos; 
                ? &apos;bg-red-600 text-white&apos; 
                : &apos;bg-white text-gray-700 hover:bg-gray-50&apos;
            }`}
          >
            Private
          </button>
        </div>
      </div>

      {/* Testimonies Feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredTestimonies.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonies yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share your faith journey!</p>
            <button
              onClick={() => router.push(&apos;/dashboard/testimonies/create&apos;)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              Share Your First Testimony
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTestimonies.map((testimony) => (
              <div key={testimony.id} className="bg-white rounded-xl shadow-sm border p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">
                        {testimony.author?.first_name?.[0] || &apos;U&apos;}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">
                        {testimony.author?.first_name} {testimony.author?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(testimony.created_at).toLocaleDateString()}
                        {testimony.circle && ` • ${testimony.circle.name}`}
                      </p>
                    </div>
                  </div>
                  {testimony.author_id === user?.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/testimonies/edit/${testimony.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(testimony.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {testimony.title}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {testimony.content}
                  </p>
                </div>

                {/* Media */}
                {testimony.media_urls && testimony.media_urls.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {testimony.media_urls.map((url: string, index: number) => (
                        <div key={index} className="relative">
                          {testimony.media_types?.[index] === &apos;video&apos; ? (
                            <video
                              src={url}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={url}
                              alt="Testimony media"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleReaction(testimony.id, &apos;like&apos;)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-red-600"
                    >
                      <Heart className="w-5 h-5" />
                      <span>{testimony.reactions?.filter((r: any // eslint-disable-line @typescript-eslint/no-explicit-any) => r.reaction_type === &apos;like&apos;).length || 0}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                      <MessageCircle className="w-5 h-5" />
                      <span>{testimony.comments?.length || 0}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      testimony.visibility === &apos;public&apos; 
                        ? &apos;bg-green-100 text-green-800&apos;
                        : testimony.visibility === &apos;circle&apos;
                        ? &apos;bg-blue-100 text-blue-800&apos;
                        : &apos;bg-gray-100 text-gray-800&apos;
                    }`}>
                      {testimony.visibility}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
