import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Upload,
  Brain,
  DatabaseZap,
  FileCheck,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "Upload Evidence",
    description:
      "Upload your digital evidence file (images, screenshots, or documents) through our secure platform. The file is encrypted immediately upon upload.",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Analysis",
    description:
      "Our advanced AI models analyze the evidence for tampering, manipulation, or forgery by examining pixel patterns, metadata, and compression artifacts.",
  },
  {
    step: 3,
    icon: DatabaseZap,
    title: "Blockchain Storage",
    description:
      "Once verified, the evidence is stored on an immutable blockchain ledger, creating a tamper-proof record with a unique hash for future verification.",
  },
  {
    step: 4,
    icon: FileCheck,
    title: "Get Verification Report",
    description:
      "Receive a comprehensive report detailing the authenticity analysis, blockchain proof, and evidence integrity score for your records.",
  },
];

const HowItWorks = () => {
  return (
    <div
      id="how-it-works"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto">
        How It Works
      </h2>
      <p className="mt-4 md:text-center xs:text-lg text-muted-foreground sm:max-w-2xl sm:mx-auto">
        A simple, secure process to verify and protect your digital evidence
      </p>

      <div className="mt-12 xs:mt-16 w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <Card className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-card">
                <CardHeader className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {step.step}
                    </div>
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm xs:text-base mt-2">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 z-10">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;

