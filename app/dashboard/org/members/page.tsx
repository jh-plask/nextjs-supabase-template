"use client";

import { Plus, Trash2, UserMinus } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { processInvitation } from "@/actions/invitations";
import { InvitationSchema } from "@/actions/invitations/schema";
import { processMember } from "@/actions/members";
import { MemberSchema } from "@/actions/members/schema";
import { InviteMemberDialog } from "@/components/org/invite-member-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequirePermission, useOrgContext } from "@/lib/rbac";
import { getZodDefaults } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  role: string;
  user_id: string;
  user_email: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
}

const inviteInitialState = getZodDefaults(InvitationSchema);
const memberInitialState = getZodDefaults(MemberSchema);

function MembersContent() {
  const { orgId, refreshClaims } = useOrgContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [inviteState, inviteAction, isInviting] = useActionState(
    processInvitation,
    inviteInitialState
  );
  const [memberState, memberAction, isMemberPending] = useActionState(
    processMember,
    memberInitialState
  );

  const fetchData = useCallback(async () => {
    if (!orgId) {
      return;
    }

    const supabase = createClient();

    // Fetch members with user emails (RLS filters by org_id from JWT claims)
    const { data: membersData } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        role,
        user_id,
        users:user_id (
          email
        )
      `
      );

    if (membersData) {
      setMembers(
        membersData.map((m) => {
          // Supabase join can return single object or array depending on relationship
          const users = m.users as
            | { email: string }
            | { email: string }[]
            | null;
          const userEmail = Array.isArray(users)
            ? users[0]?.email
            : users?.email;
          return {
            id: m.id,
            role: m.role,
            user_id: m.user_id,
            user_email: userEmail || "Unknown",
          };
        })
      );
    }

    // Fetch pending invitations (RLS filters by org_id from JWT claims)
    const { data: invitationsData } = await supabase
      .from("organization_invitations")
      .select("id, email, role, status, expires_at")
      .eq("status", "pending");

    if (invitationsData) {
      setInvitations(invitationsData);
    }

    setIsLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (inviteState.status === "success" || memberState.status === "success") {
      fetchData();
      refreshClaims();
    }
  }, [inviteState.status, memberState.status, refreshClaims, fetchData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Invite Button with Dialog */}
      <RequirePermission permission="members.invite">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Team Members</h2>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
          <InviteMemberDialog
            onOpenChange={setInviteDialogOpen}
            onSuccess={fetchData}
            open={inviteDialogOpen}
          />
        </div>
      </RequirePermission>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 font-semibold">Pending Invitations</h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                className="flex items-center justify-between rounded bg-muted/50 p-3"
                key={inv.id}
              >
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-muted-foreground text-sm">
                    {inv.role} · Expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <RequirePermission permission="members.invite">
                  <form action={inviteAction}>
                    <input name="operation" type="hidden" value="revoke" />
                    <input name="invitationId" type="hidden" value={inv.id} />
                    <Button size="sm" type="submit" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </RequirePermission>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Members */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Members ({members.length})</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              className="flex items-center justify-between rounded bg-muted/50 p-3"
              key={member.id}
            >
              <div>
                <p className="font-medium">{member.user_email}</p>
                <p className="text-muted-foreground text-sm capitalize">
                  {member.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RequirePermission permission="members.update_role">
                  {member.role !== "owner" && (
                    <form action={memberAction}>
                      <input
                        name="operation"
                        type="hidden"
                        value="update-role"
                      />
                      <input name="memberId" type="hidden" value={member.id} />
                      <Select defaultValue={member.role} name="role">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </form>
                  )}
                </RequirePermission>

                <RequirePermission permission="members.remove">
                  {member.role !== "owner" && (
                    <form action={memberAction}>
                      <input name="operation" type="hidden" value="remove" />
                      <input name="memberId" type="hidden" value={member.id} />
                      <Button
                        disabled={isMemberPending}
                        onClick={(e) => {
                          if (
                            !confirm(
                              "Remove this member from the organization?"
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                        size="sm"
                        type="submit"
                        variant="ghost"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </RequirePermission>
              </div>
            </div>
          ))}
        </div>
      </div>

      {memberState.status === "error" && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
          {memberState.message}
        </div>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <RequirePermission
      fallback={
        <div className="text-center">
          <h2 className="font-semibold text-lg">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to manage members.
          </p>
        </div>
      }
      permission="members.invite"
    >
      <MembersContent />
    </RequirePermission>
  );
}
