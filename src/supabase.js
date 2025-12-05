import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oeihnseragstfwhfhrco.supabase.co";  // <-- NO /rest/v1
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9laWhuc2VyYWdzdGZ3aGZocmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDE2MTgsImV4cCI6MjA4MDUxNzYxOH0.WhJYubkNs9oNoA78INnB4Oy4kHR8R3Q0KuyZB3Ky4ko";             // <-- Must be anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
