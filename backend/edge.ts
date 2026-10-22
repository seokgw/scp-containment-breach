import { createHandler } from "./app.mjs";
import { SupabaseRepository } from "./repository.mjs";
const handler = createHandler(
  new SupabaseRepository(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  ),
  { origin: "https://scp-containment-breach.vercel.app", secure: true },
);
Deno.serve(handler);
