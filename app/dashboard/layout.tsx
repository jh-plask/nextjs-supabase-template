import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth - middleware should handle this
  if (!user) {
    redirect("/auth?op=login");
  }

  // Fetch organizations server-side to avoid client-side waterfall
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">Dashboard</h1>
            <OrgSwitcher organizations={organizations ?? []} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
