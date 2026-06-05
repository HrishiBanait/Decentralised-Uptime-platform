import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden border-b border-border/50">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/5"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px]"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--primary)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,transparent_0%,hsl(var(--primary)/0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer"></div>
      
      <div className="relative z-10 max-w-(--breakpoint-xl) w-full flex flex-col lg:flex-row mx-auto items-center justify-between gap-y-14 gap-x-10 px-6 py-12 lg:py-0">
        
        {/* Left Section */}
        <div className="max-w-xl">
          <Badge className="rounded-full py-1 border-none bg-foreground text-background">
            Now Live — EvidenceCheck v1.0
          </Badge>
          
          <h1 className="mt-6 max-w-[22ch] text-3xl xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold leading-[1.2]! tracking-tight text-foreground">
            Verify Digital Evidence with <br /> AI and Blockchain
          </h1>

          <p className="mt-6 max-w-[60ch] xs:text-lg text-muted-foreground">
            Ensure the authenticity and integrity of digital evidence using
            advanced AI tampering detection and blockchain-based verification.
            Secure, transparent, and tamper-proof — built for digital forensics.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full text-base"
              asChild
            >
              <Link href="/login">
                Get Started <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full text-base border-primary/20 hover:bg-primary/5"
              asChild
            >
              <Link href="/analyst">
                Quick Analysis
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative lg:max-w-2xl xl:max-w-3xl w-full bg-accent rounded-xl overflow-hidden">
  <img
    src="/hero.gif"
    alt="AI Evidence Verification Animation"
    className="object-cover w-full h-auto rounded-xl"
  />
</div>


      </div>
    </div>
  );
};

export default Hero;
