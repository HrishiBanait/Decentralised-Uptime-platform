import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import Link from "next/link";

export const NavigationSheet = () => {
  return (
    <Sheet>
      <VisuallyHiddenPrimitive.Root>
        <SheetTitle>Navigation Drawer</SheetTitle>
      </VisuallyHiddenPrimitive.Root>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Logo />
        <NavMenu orientation="vertical" className="mt-12" />

        <div className="mt-8 space-y-4">
          <Button variant="outline" className="w-full sm:hidden bg-foreground text-background hover:bg-foreground/90 border-foreground" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="w-full xs:hidden" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
