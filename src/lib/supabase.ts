import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bqoqjixsdqrqsxasyifa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxb3FqaXhzZHFycXN4YXN5aWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTY4MjAsImV4cCI6MjA4NjQ5MjgyMH0.1lsqHXpkAoOoMo1GDDiki4Xo2Z773KK2flbvP3d-iXc';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
