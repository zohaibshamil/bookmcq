// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env file');
}

// Public client (for regular API calls)
const supabase = createClient(
    `https://${supabaseUrl}`,
    supabaseKey
);

// Service client (for admin operations - use sparingly)
const supabaseAdmin = createClient(
    `https://${supabaseUrl}`,
    supabaseServiceKey || supabaseKey
);

module.exports = { supabase, supabaseAdmin };
