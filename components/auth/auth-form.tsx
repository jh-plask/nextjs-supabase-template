"use client";

import Link from "next/link";
import { processAuth } from "@/actions/auth";
import {
  authUIConfig,
  fieldConfigs,
  type Operation,
} from "@/actions/auth/config";
import { AuthSchema } from "@/actions/auth/schema";
import {
  ConfigDrivenForm,
  FieldSeparator,
} from "@/components/ui/config-driven-form";
import { getZodDefaults } from "@/lib/safe-action";
import { OAuthButtons } from "./oauth-buttons";

const initialState = getZodDefaults(AuthSchema);

export function AuthForm({ operation }: { operation: Operation }) {
  const { fields, showOAuth, links, ...uiConfig } = authUIConfig[operation];

  return (
    <ConfigDrivenForm
      action={processAuth}
      fieldConfigs={fieldConfigs}
      footer={
        <>
          {showOAuth && (
            <>
              <FieldSeparator>OR CONTINUE WITH</FieldSeparator>
              <OAuthButtons />
            </>
          )}
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
      getFieldTestId={(field) => `auth-field-${field}`}
      hiddenFields={{ operation }}
      initialState={initialState}
      submitTestId={`auth-submit-${operation}`}
      uiConfig={{ ...uiConfig, fields }}
    />
  );
}
