import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 없습니다. .env를 확인한 뒤 npm run dev를 다시 실행하세요.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
