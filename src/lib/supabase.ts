import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecgqsaodfjunmdczmdzo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ3FzYW9kZmp1bm1kY3ptZHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODYwNTYsImV4cCI6MjA3Mzk2MjA1Nn0.Vy9vTYMgPVzCy3Pf52IeJpBi16cT5YIo1UVITnCyWPw'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
