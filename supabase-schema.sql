-- Connect with Christ App - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  church_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  pastor_name TEXT,
  service_times TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles table
CREATE TABLE IF NOT EXISTS circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  privacy TEXT CHECK (privacy IN ('private', 'public')) DEFAULT 'public',
  owner_id UUID REFERENCES users(id) NOT NULL,
  church_id UUID REFERENCES churches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members table
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Testimonies table
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  circle_id UUID REFERENCES circles(id),
  visibility TEXT CHECK (visibility IN ('public', 'private', 'circle')) DEFAULT 'public',
  media_urls TEXT[], -- Array of media URLs
  media_types TEXT[], -- Array of media types (image, video, audio)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimony reactions table
CREATE TABLE IF NOT EXISTS testimony_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  testimony_id UUID REFERENCES testimonies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'pray', 'amen')) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testimony_id, user_id)
);

-- Testimony comments table
CREATE TABLE IF NOT EXISTS testimony_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  testimony_id UUID REFERENCES testimonies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  circle_id UUID REFERENCES circles(id),
  is_public BOOLEAN DEFAULT true,
  is_urgent BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'answered', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer support table (users supporting prayer requests)
CREATE TABLE IF NOT EXISTS prayer_support (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prayer_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prayer_id, user_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  organizer_id UUID REFERENCES users(id) NOT NULL,
  circle_id UUID REFERENCES circles(id),
  church_id UUID REFERENCES churches(id),
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('attending', 'maybe', 'not_attending')) DEFAULT 'attending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Reading plans table
CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading plan assignments table
CREATE TABLE IF NOT EXISTS reading_plan_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES reading_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id),
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, user_id, circle_id)
);

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES reading_plan_assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, day_number)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('prayer', 'testimony', 'event', 'circle', 'general')) DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_circles_owner_id ON circles(owner_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_testimonies_author_id ON testimonies(author_id);
CREATE INDEX IF NOT EXISTS idx_testimonies_circle_id ON testimonies(circle_id);
CREATE INDEX IF NOT EXISTS idx_testimonies_visibility ON testimonies(visibility);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author_id ON prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_circle_id ON prayer_requests(circle_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimony_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimony_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read and update their own profile
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Churches are public
CREATE POLICY "Churches are public" ON churches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create churches" ON churches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Church creators can update" ON churches FOR UPDATE USING (auth.uid() = created_by);

-- Circles policies
CREATE POLICY "Circles are public" ON circles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create circles" ON circles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Circle owners can update" ON circles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Circle owners can delete" ON circles FOR DELETE USING (auth.uid() = owner_id);

-- Circle members policies
CREATE POLICY "Circle members are public" ON circle_members FOR SELECT USING (true);
CREATE POLICY "Users can join circles" ON circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave circles" ON circle_members FOR DELETE USING (auth.uid() = user_id);

-- Testimonies policies
CREATE POLICY "Public testimonies are visible" ON testimonies FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can see their own testimonies" ON testimonies FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Circle members can see circle testimonies" ON testimonies FOR SELECT USING (
  visibility = 'circle' AND circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can create testimonies" ON testimonies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own testimonies" ON testimonies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own testimonies" ON testimonies FOR DELETE USING (auth.uid() = author_id);

-- Prayer requests policies
CREATE POLICY "Public prayer requests are visible" ON prayer_requests FOR SELECT USING (is_public = true);
CREATE POLICY "Users can see their own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Circle members can see circle prayer requests" ON prayer_requests FOR SELECT USING (
  circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own prayer requests" ON prayer_requests FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own prayer requests" ON prayer_requests FOR DELETE USING (auth.uid() = author_id);

-- Events policies
CREATE POLICY "Public events are visible" ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Users can see their own events" ON events FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Circle members can see circle events" ON events FOR SELECT USING (
  circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Event organizers can update" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Event organizers can delete" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Event attendees policies
CREATE POLICY "Users can see their own event attendance" ON event_attendees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own attendance" ON event_attendees FOR ALL USING (auth.uid() = user_id);

-- Reading plans policies
CREATE POLICY "Public reading plans are visible" ON reading_plans FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create reading plans" ON reading_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications policies
CREATE POLICY "Users can see their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonies', 'testimonies', true);

-- Create storage policies
CREATE POLICY "Anyone can view testimonies media" ON storage.objects FOR SELECT USING (bucket_id = 'testimonies');
CREATE POLICY "Authenticated users can upload testimonies media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'testimonies' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their own testimonies media" ON storage.objects FOR UPDATE USING (
  bucket_id = 'testimonies' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own testimonies media" ON storage.objects FOR DELETE USING (
  bucket_id = 'testimonies' AND auth.uid()::text = (storage.foldername(name))[1]
);
