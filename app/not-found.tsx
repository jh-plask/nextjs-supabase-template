import Link from "next/link";
import { Icon, NotFoundIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Empty>
        <EmptyMedia variant="icon">
          <Icon icon={NotFoundIcon} />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle className="font-bold text-4xl">404</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist.
          </EmptyDescription>
        </EmptyContent>
        <Button render={<Link href="/" />}>Return Home</Button>
      </Empty>
    </div>
  );
}
