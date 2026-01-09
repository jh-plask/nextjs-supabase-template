"use client";

import Link from "next/link";
import { DomainForm } from "@/components/views";
import { authDomain, authLinks, type Operation } from "@/domains/auth";
import { OAuthButtons } from "./oauth-buttons";

export function AuthForm({ operation }: { operation: Operation }) {
  const links = authLinks[operation];

  return (
    <DomainForm
      domain={authDomain}
      footer={
        <>
          <OAuthButtons />
          {links?.map(({ href, label, testId }) => (
            <p className="text-center text-muted-foreground text-sm" key={href}>
              <Link
                className="font-medium text-primary hover:underline"
                data-testid={testId}
                href={href}
              >
                {label}
              </Link>
            </p>
          ))}
        </>
      }
      operation={operation}
      testIdPrefix="auth"
    />
  );
}
