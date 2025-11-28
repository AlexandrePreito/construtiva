   import { createClient } from "@supabase/supabase-js";
   import type { Database } from "./types";

   const globalForSupabase = globalThis as unknown as {
     supabaseBrowser?: ReturnType<typeof createClient<Database>>;
   };

   export function getSupabaseBrowserClient() {
     if (!globalForSupabase.supabaseBrowser) {
       const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
       const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

       if (!url || !anonKey) {
         throw new Error(
           "As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não foram definidas.",
         );
       }

       globalForSupabase.supabaseBrowser = createClient<Database>(url, anonKey, {
         auth: { persistSession: true },
       });
     }

     return globalForSupabase.supabaseBrowser;
   }

