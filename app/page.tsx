import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="font-bold text-4xl">Welcome</h1>
        <p className="mt-2 text-muted-foreground">
          Next.js 16 + Supabase + React 19 Template
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          href="/auth?op=login"
        >
          Sign In
        </Link>
        <Link
          className="rounded-md border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground"
          href="/auth?op=signup"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}
