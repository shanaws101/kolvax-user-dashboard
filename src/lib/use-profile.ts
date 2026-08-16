import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";
import { MOCK_PROFILE } from "./mock-data";

export function useProfile() {
  const { user, loading } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id ?? "standalone-demo"],
    queryFn: async () => {
      if (!user) {
        // Standalone / preview fallback
        return {
          profile: MOCK_PROFILE,
          roles: ["customer_owner"],
          isOwner: true,
        };
      }
      try {
        const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
          supabase.from("profiles").select("*, business:businesses(*)").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]);
        if (profileError || !profile) {
          // If remote DB is unavailable, gracefully fall back to mock profile for seamless UI preview
          return {
            profile: MOCK_PROFILE,
            roles: ["customer_owner"],
            isOwner: true,
          };
        }
        const roleList = (roles ?? []).map((r) => r.role);
        return {
          profile,
          roles: roleList,
          isOwner: roleList.includes("customer_owner"),
        };
      } catch (err) {
        console.warn("[Profile] Falling back to standalone demo profile:", err);
        return {
          profile: MOCK_PROFILE,
          roles: ["customer_owner"],
          isOwner: true,
        };
      }
    },
  });
}
