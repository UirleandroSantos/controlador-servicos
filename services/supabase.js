import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dmaxdcetcbdppidjvyfl.supabase.co";
const supabaseAnonKey = "sb_publishable_mzMB0r-nUMjqIlbh-yLjVw_REiwkg42";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);