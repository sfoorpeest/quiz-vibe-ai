const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Avatar upload will fail until configured.');
} else {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = {
    supabase,
};
