"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import { authDomain } from "@/domains/auth";
import { invitationDomain } from "@/domains/invitations";
import type { ActionState } from "@/lib/safe-action";

interface InviteAcceptClientProps {
  token: string;
  email: string;
  organizationName: string;
  isLoggedIn: boolean;
  userEmail?: string;
}

export function InviteAcceptClient({
  token,
  email,
  organizationName,
  isLoggedIn,
  userEmail,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [acceptState, acceptAction, isAccepting] = useActionState(
    invitationDomain.action,
    invitationDomain.getInitialState()
  );

  // Handle successful acceptance
  useEffect(() => {
    if (acceptState.status === "success") {
      router.push("/dashboard");
    }
  }, [acceptState.status, router]);

  // If user is logged in, show accept button
  if (isLoggedIn) {
    const emailMatch = userEmail?.toLowerCase() === email.toLowerCase();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            {emailMatch
              ? `You're logged in as ${userEmail}. Click below to join.`
              : `You're logged in as ${userEmail}, but this invitation is for ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailMatch && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700 text-sm">
              The invitation was sent to a different email address. You may want
              to log out and use the correct account.
            </div>
          )}

          {acceptState.message && acceptState.status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
              {acceptState.message}
            </div>
          )}

          <form action={acceptAction}>
            <input name="operation" type="hidden" value="accept" />
            <input name="token" type="hidden" value={token} />
            <Button className="w-full" disabled={isAccepting} type="submit">
              {isAccepting ? "Joining..." : `Join ${organizationName}`}
            </Button>
          </form>

          <div className="text-center">
            <Button
              onClick={() => router.push("/auth?op=login")}
              variant="link"
            >
              Log in with a different account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User not logged in - show signup/login options
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Sign up with <span className="font-semibold">{email}</span> to accept
          this invitation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConfigDrivenForm
          action={async (
            prevState: ActionState<unknown>,
            formData: FormData
          ) => {
            // After signup, redirect back to this page to accept
            const result = await authDomain.action(prevState, formData);
            if (result.status === "success") {
              // Refresh the page to show the accept button
              router.refresh();
            }
            return result;
          }}
          fields={authDomain.fields}
          hiddenFields={{ operation: "signup" }}
          initialState={authDomain.getInitialState()}
          initialValues={{ email }}
          uiConfig={authDomain.getFormConfig("signup")}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Already have an account?
            </span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push("/auth?op=login")}
          variant="outline"
        >
          Log in instead
        </Button>
      </CardContent>
    </Card>
  );
}
