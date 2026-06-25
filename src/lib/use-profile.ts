import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";

export function useProfile() {
  const { user, loading } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !loading && !!user,
    queryFn: async () => {
      if (!user) return null;
      const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*, business:businesses(*)").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (profileError) throw profileError;
      if (rolesError) throw rolesError;
      const roleList = (roles ?? []).map((r) => r.role);
      return {
        profile,
        roles: roleList,
        isOps: roleList.includes("ops_admin") || roleList.includes("ops_staff"),
        isOpsAdmin: roleList.includes("ops_admin"),
      };
    },
  });
}
