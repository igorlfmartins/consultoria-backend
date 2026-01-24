import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// URL fornecida pelo usuário
const supabaseUrl = process.env.SUPABASE_URL || 'https://vvndogbmygllhpxjeuwm.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.warn('SUPABASE_ANON_KEY not set. Database operations will fail.')
}

// Cria o cliente. Se a chave não existir, usa um placeholder para não quebrar o build,
// mas as chamadas falharão até a chave ser configurada.
export const supabase = createClient(supabaseUrl, supabaseKey || 'missing-key')
