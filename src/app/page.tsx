'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
        setMessage('Success! Check your email to verify your account.')
      }
    } catch (_error) {
      setMessage('Error: ' + _error)
    }
    
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
        setMessage('Successfully signed in!')
      }
    } catch (_error) {
      setMessage('Error: ' + _error)
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('Signed out successfully!')
  }

  const testDatabase = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase
        .from('circles')
        .select('*')
        .limit(5)
      
      if (error) {
        setMessage('Database Error: ' + error.message)
      } else {
        setMessage('Database working! Found ' + (data?.length || 0) + ' circles.')
      }
    } catch (_error) {
      setMessage('Database Error: ' + _error)
    }
    
    setLoading(false)
  }

  if (user) {
  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-red-600">Connect with Christ</h1>
          
          <div className="mb-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={testDatabase}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
          
          {message && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-red-600">Connect with Christ</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
            
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
        
        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {message}
          </div>
        )}
        </div>
    </div>
  )
}