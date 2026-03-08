import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://trfsuxvlykawydbctxsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZnN1eHZseWthd3lkYmN0eHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTc2MjYsImV4cCI6MjA4ODQzMzYyNn0.Pf4uDL2CVst1Dh2zXr6OLgIeJcSfbtYhQvUaVZQ2z9U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)