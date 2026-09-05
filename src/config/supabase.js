const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY in backend/.env');
    process.exit(1);
}

const supabase = createClient(
    `https://${supabaseUrl}`,
    supabaseKey
);

module.exports = { supabase };
