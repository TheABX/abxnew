// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjiwreyvamyeapjgvsam.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXdyZXl2YW15ZWFwamd2c2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNzc1NTYsImV4cCI6MjA2NTg1MzU1Nn0.fUCRZnVuFTqBRGXJf9yfdWzBSHh8n0dnpL51OHusI7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

    