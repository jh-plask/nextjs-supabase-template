import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-2xl">Welcome to your dashboard</h2>

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
