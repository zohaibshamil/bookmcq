import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnsuuazwcxmuwqyphvse.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C'

export const supabase = createClient(supabaseUrl, supabaseKey)
