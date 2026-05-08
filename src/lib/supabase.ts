import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://phfmzkscbhlorhpstpcy.supabase.co";
const supabaseAnonKey = "sb_publishable_LcJUflOU2NcslGQM9xUHzw_lX-cb--E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);