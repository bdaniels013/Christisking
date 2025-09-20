'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Globe, Lock, Star, Upload, User, Users, Video, X } from 'lucide-react'

export default function CreateTestimonyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'public',
    circle_id: ''
  })
  const [_circles, setCircles] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 5)) // Max 5 files
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('testimonies')
        .upload(fileName, file)

      if (error) throw error

      return {
        url: data.path,
        type: file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('image/') ? 'image' : 'other'
      }
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) return

    setLoading(true)
    try {
      let mediaUrls: string[] = []
      let mediaTypes: string[] = []

      if (files.length > 0) {
        setUploading(true)
        const uploads = await uploadFiles(files)
        mediaUrls = uploads.map(upload => upload.url)
        mediaTypes = uploads.map(upload => upload.type)
        setUploading(false)
      }

      const { error } = await supabase
        .from('testimonies')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: user.id,
          circle_id: formData.visibility === 'circle' ? formData.circle_id : null,
          visibility: formData.visibility,
          media_urls: mediaUrls,
          media_types: mediaTypes
        })

      if (error) throw error

      router.push('/dashboard/testimonies')
    } catch (_error) {
      console.error('Error:', _error)
      alert('Error creating testimony. Please try again.')
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
              <h1 className="text-2xl font-bold text-gray-900">Share Your Testimony</h1>
              <p className="text-gray-600">Inspire others with your faith journey</p>
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
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Give your testimony a meaningful title"
                required
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Testimony *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Share your story of faith, how God has worked in your life, or what you've learned on your spiritual journey..."
                required
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos & Videos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload photos or videos
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, MP4 up to 10MB each (max 5 files)
                  </p>
                </label>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who can see this testimony?
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="mr-3"
                  />
                  <Globe className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-sm text-gray-500">Everyone can see this testimony</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="circle"
                    checked={formData.visibility === 'circle'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="mr-3"
                  />
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Circle Only</p>
                    <p className="text-sm text-gray-500">Only members of your circle can see this</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="mr-3"
                  />
                  <Lock className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-sm text-gray-500">Only you can see this testimony</p>
                  </div>
                </label>
              </div>

              {/* Circle Selection */}
              {formData.visibility === 'circle' && (
                <div className="mt-4">
                  <label htmlFor="circle" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Circle
                  </label>
                  <select
                    id="circle"
                    value={formData.circle_id}
                    onChange={(e) => setFormData({ ...formData, circle_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
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
                disabled={loading || uploading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : loading ? (
                  'Creating...'
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Share Testimony
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
