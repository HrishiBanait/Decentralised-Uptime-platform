import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  Brain,
  DatabaseZap,
  SearchCheck,
  Lock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    image: "/data-integrityy.gif",
    title: "Evidence Integrity Verification",
    description:
      "Verify whether an image or digital evidence has been tampered with using advanced AI-based analysis.",
  },
  {
    icon: Brain,
    image: "/detectionn.gif",
    title: "AI-Powered Forgery Detection",
    description:
      "Utilizes deep learning models to detect subtle manipulations, inconsistencies, and forged patterns in images.",
  },
  {
    icon: DatabaseZap,
    image: "/blockchain.gif",
    title: "Blockchain-Backed Storage",
    description:
      "Securely store verified evidence on a blockchain ledger to ensure immutability, transparency, and traceability.",
  },
  {
    icon: SearchCheck,
    image: "/metadataa.gif",
    title: "Metadata and Authenticity Analysis",
    description:
      "Automatically extract and analyze EXIF metadata, pixel-level anomalies, and image compression artifacts.",
  },
  {
    icon: Lock,
    image: "/security.gif",
    title: "Secure Access Control",
    description:
      "Implements multi-level authentication and role-based permissions to protect sensitive case information.",
  },
  {
    icon: BarChart3,
    image: "/reportt.gif",
    title: "Detailed Verification Reports",
    description:
      "Generate comprehensive reports containing detection results, blockchain proof, and evidence authenticity scores.",
  },
];

const Features = () => {
  return (
    <div
      id="features"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto">
        Core Features of Evidence Verification System
      </h2>

      <div className="mt-8 xs:mt-14 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="flex flex-col border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-card"
          >
            {/* Header with GIF */}
            <CardHeader className="p-0 relative">
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-t-xl"
                />
              </div>
              <div className="p-6">
                <feature.icon className="w-7 h-7 text-foreground mb-2" />
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm xs:text-[17px] mt-1">
                  {feature.description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;
