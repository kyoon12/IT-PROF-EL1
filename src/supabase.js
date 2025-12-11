import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xgvtfcbgbhfolmiffmrj.supabase.co";  // <-- NO /rest/v1
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnRmY2JnYmhmb2xtaWZmbXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTEzOTgsImV4cCI6MjA4MDk4NzM5OH0.92jQgoIUu8V_aUK3WuI9wNooMaZCfHhAwrN3doC6zTg";             // <-- Must be anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
