'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Church, Clock, Edit, Globe, Mail, MapPin, Phone, Plus, Search, Trash2 } from 'lucide-react'

export default function ChurchesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [churches, setChurches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      await loadChurches()
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadChurches = async () => {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select(`
          *,
          created_by_user:users(first_name, last_name)
        `)
        .order('name')

      if (error) throw error
      setChurches(data || [])
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const handleDelete = async (churchId: string) => {
    if (!confirm('Are you sure you want to delete this church?')) return

    try {
      const { error } = await supabase
        .from('churches')
        .delete()
        .eq('id', churchId)

      if (error) throw error
      loadChurches()
    } catch (_error) {
      console.error('Error:', _error)
    }
  }

  const filteredChurches = churches.filter(church =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.state?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading churches...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Churches</h1>
              <p className="text-gray-600">Discover local churches and communities</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/churches/new')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Church
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search churches by name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Churches Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredChurches.length === 0 ? (
          <div className="text-center py-12">
            <Church className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No churches found' : 'No churches yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Be the first to add a church!'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/dashboard/churches/new')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Add Your First Church
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChurches.map((church) => (
              <div key={church.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Church className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{church.name}</h3>
                      <p className="text-sm text-gray-500">
                        Added by {church.created_by_user?.first_name} {church.created_by_user?.last_name}
                      </p>
                    </div>
                  </div>
                  {church.created_by === user?.id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => router.push(`/dashboard/churches/edit/${church.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(church.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {church.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {church.description}
                  </p>
                )}

                {/* Pastor */}
                {church.pastor_name && (
                  <div className="text-sm text-gray-500 mb-2">
                    <strong>Pastor:</strong> {church.pastor_name}
                  </div>
                )}

                {/* Service Times */}
                {church.service_times && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    {church.service_times}
                  </div>
                )}

                {/* Location */}
                {(church.address || church.city) && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <div>
                      {church.address && <div>{church.address}</div>}
                      {church.city && church.state && (
                        <div>{church.city}, {church.state} {church.zip_code}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {church.phone && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-2" />
                      <a href={`tel:${church.phone}`} className="hover:text-red-600">
                        {church.phone}
                      </a>
                    </div>
                  )}
                  {church.email && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="w-4 h-4 mr-2" />
                      <a href={`mailto:${church.email}`} className="hover:text-red-600">
                        {church.email}
                      </a>
                    </div>
                  )}
                  {church.website && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="w-4 h-4 mr-2" />
                      <a 
                        href={church.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-red-600"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/churches/${church.id}`)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/circles?church=${church.id}`)}
                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 text-sm"
                  >
                    Find Circles
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
