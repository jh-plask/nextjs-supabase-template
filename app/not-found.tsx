import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-6xl">404</h1>
      <h2 className="text-muted-foreground text-xl">Page not found</h2>
      <p className="text-muted-foreground text-sm">
        The page you are looking for does not exist.
      </p>
      <Button render={<Link href="/" />}>Return Home</Button>
    </div>
  );
}
