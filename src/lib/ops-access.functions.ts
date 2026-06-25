import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side verification that the calling user holds an ops role.
 * RLS-backed: relies on the user JWT and user_roles policy.
 * Returns true only when an ops_admin/ops_staff role row exists for the user.
 */
export const verifyOpsAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["ops_admin", "ops_staff"]);
    if (error) throw error;
    return { allowed: !!data && data.length > 0 };
  });
