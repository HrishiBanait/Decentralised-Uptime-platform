import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import ThemeToggle from "../theme-toggle";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="relative h-16 bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md border-b border-border/50 shadow-sm">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,primary/5,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,secondary/5,transparent_50%)]"></div>
      
      <div className="relative z-10 h-full flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" className="hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90 border-foreground" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="hidden xs:inline-flex" asChild>
            <Link href="/login">Get Started</Link>
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
