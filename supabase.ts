import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || 'https://vvndogbmygllhpxjeuwm.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmRvZ2JteWdsbGhweGpldXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDYxNTgsImV4cCI6MjA4NDc4MjE1OH0.QTI8M466PnxmVB5GvlDJv41uJRy7PS4c_vii-HUz57U'

if (!supabaseKey) {
  console.warn('SUPABASE_ANON_KEY not set. Database operations will fail.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
