import { AuthForm } from "@/components/auth/auth-form";
import { type Operation, operations } from "@/domains/auth";

interface Props {
  searchParams: Promise<{ op?: string; error?: string }>;
}

export default async function AuthPage({ searchParams }: Props) {
  const { op, error } = await searchParams;
  const operation: Operation = operations.includes(op as Operation)
    ? (op as Operation)
    : "login";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}
        <AuthForm operation={operation} />
      </div>
    </div>
  );
}
