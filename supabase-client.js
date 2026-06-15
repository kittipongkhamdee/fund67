/* ============================================================
   Supabase client initialization
   ============================================================ */
const SUPABASE_URL = "https://vorivchylikcmtdlpqtq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvcml2Y2h5bGlrY210ZGxwcXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjEzNzMsImV4cCI6MjA5NzA5NzM3M30.OmFQWm8KrXziy0_r-loLYPSIAi9Qx_0eHfi14GxI78k";

// Create Supabase client using the JS library
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

Object.assign(window, { SUPABASE_URL, SUPABASE_ANON_KEY });
