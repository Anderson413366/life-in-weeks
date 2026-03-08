import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bqoqjixsdqrqsxasyifa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxb3FqaXhzZHFycXN4YXN5aWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTY4MjAsImV4cCI6MjA4NjQ5MjgyMH0.1lsqHXpkAoOoMo1GDDiki4Xo2Z773KK2flbvP3d-iXc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: "life_in_weeks" },
});
