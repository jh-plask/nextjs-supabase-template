import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch current org info
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("current_organization_id")
    .eq("user_id", user?.id || "")
    .single();

  let currentOrg: { id: string; name: string; slug: string } | null = null;
  let memberCount = 0;
  let projectCount = 0;

  if (prefs?.current_organization_id) {
    const [orgResult, memberResult, projectResult] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", prefs.current_organization_id)
        .single(),
      supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", prefs.current_organization_id),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", prefs.current_organization_id),
    ]);

    currentOrg = orgResult.data;
    memberCount = memberResult.count || 0;
    projectCount = projectResult.count || 0;
  }

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      {currentOrg && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold text-muted-foreground text-sm">
              Current Organization
            </h3>
            <p className="font-bold text-2xl">{currentOrg.name}</p>
            <p className="text-muted-foreground text-sm">/{currentOrg.slug}</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold text-muted-foreground text-sm">
              Team Members
            </h3>
            <p className="font-bold text-2xl">{memberCount}</p>
            <Link
              className="text-primary text-sm hover:underline"
              href="/dashboard/org/members"
            >
              Manage members
            </Link>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold text-muted-foreground text-sm">
              Projects
            </h3>
            <p className="font-bold text-2xl">{projectCount}</p>
            <p className="text-muted-foreground text-sm">In this workspace</p>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Your Profile</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-muted-foreground text-sm">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">User ID</dt>
            <dd className="font-mono text-sm">{user?.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Auth Provider</dt>
            <dd>{user?.app_metadata?.provider || "email"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Last Sign In</dt>
            <dd>
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
