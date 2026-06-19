import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wnsuuazwcxmuwqyphvse.supabase.co'
const supabaseKey = 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C'

export const supabase = createClient(supabaseUrl, supabaseKey)
