import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzwdzmazpgwbpzifqytl.supabase.co'
const supabaseKey = 'sb_publishable_oVB1kw-szfUGaEhWCblwFQ_jrORh8D7'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  await supabase.from('settings').upsert({ id: 'global', geminiApiKey: '' })
}

test()
