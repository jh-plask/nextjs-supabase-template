import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { PageHeader } from "@/components/sidebar/page-header";
import { SidebarRight } from "@/components/sidebar/sidebar-right";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <AppSidebar
        organizations={organizations ?? []}
        user={{ email: user.email ?? "" }}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator className="my-auto h-4" orientation="vertical" />
          <PageHeader />
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      <SidebarRight />
    </SidebarProvider>
  );
}
