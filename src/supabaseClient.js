import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl
})

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('saved_tweets')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
    } else {
      console.log('Supabase connection successful')
    }
  } catch (err) {
    console.error('Supabase connection test error:', err)
  }
}

testConnection()

export { supabase } 