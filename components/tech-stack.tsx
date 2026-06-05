import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Code2,
  Database,
  Brain,
  Shield,
  Cloud,
  Lock,
  Layers,
  Zap,
} from "lucide-react";

const techStack = [
  {
    category: "Frontend",
    icon: Code2,
    technologies: [
      { name: "Next.js", description: "React framework for production" },
      { name: "TypeScript", description: "Type-safe JavaScript" },
      { name: "Tailwind CSS", description: "Utility-first CSS framework" },
      { name: "Framer Motion", description: "Animation library" },
    ],
  },
  {
    category: "Backend",
    icon: Database,
    technologies: [
      { name: "Node.js", description: "Server-side runtime" },
      { name: "Express.js", description: "Web application framework" },
      { name: "RESTful API", description: "API architecture" },
      { name: "Microservices", description: "Scalable architecture" },
    ],
  },
  {
    category: "AI/ML",
    icon: Brain,
    technologies: [
      { name: "TensorFlow", description: "Deep learning framework" },
      { name: "PyTorch", description: "Machine learning library" },
      { name: "Computer Vision", description: "Image analysis models" },
      { name: "Neural Networks", description: "Deep learning models" },
    ],
  },
  {
    category: "Blockchain",
    icon: Layers,
    technologies: [
      { name: "Ethereum", description: "Smart contract platform" },
      { name: "IPFS", description: "Decentralized storage" },
      { name: "Web3.js", description: "Blockchain integration" },
      { name: "Smart Contracts", description: "Automated verification" },
    ],
  },
  {
    category: "Security",
    icon: Shield,
    technologies: [
      { name: "AES-256", description: "Encryption standard" },
      { name: "JWT", description: "Token-based authentication" },
      { name: "OAuth 2.0", description: "Authorization protocol" },
      { name: "HTTPS/TLS", description: "Secure communication" },
    ],
  },
  {
    category: "Infrastructure",
    icon: Cloud,
    technologies: [
      { name: "AWS/Azure", description: "Cloud hosting" },
      { name: "Docker", description: "Containerization" },
      { name: "Kubernetes", description: "Orchestration" },
      { name: "CI/CD", description: "Automated deployment" },
    ],
  },
];

const TechStack = () => {
  return (
    <div
      id="tech-stack"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight">
          System Architecture & Tech Stack
        </h2>
        <p className="mt-4 xs:text-lg text-muted-foreground max-w-2xl mx-auto">
          Built with cutting-edge technologies to ensure security, scalability, and performance
        </p>
      </div>

      <div className="mt-12 xs:mt-16 w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((stack) => {
            const IconComponent = stack.icon;
            return (
              <Card
                key={stack.category}
                className="flex flex-col border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-card"
              >
                <CardHeader className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      {stack.category}
                    </CardTitle>
                  </div>
                  <div className="space-y-3">
                    {stack.technologies.map((tech) => (
                      <div key={tech.name} className="border-l-2 border-primary/20 pl-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          {tech.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tech.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-16 xs:mt-20">
        <div className="text-center mb-8">
          <h3 className="text-2xl xs:text-3xl font-bold text-foreground">
            System Architecture
          </h3>
          <p className="mt-2 text-muted-foreground">
            A robust, scalable architecture designed for enterprise use
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border rounded-xl p-6 bg-card hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground">High Performance</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Optimized for speed with caching, CDN integration, and efficient algorithms
            </p>
          </Card>

          <Card className="border rounded-xl p-6 bg-card hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground">Enterprise Security</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Multi-layer security with encryption, authentication, and audit logging
            </p>
          </Card>

          <Card className="border rounded-xl p-6 bg-card hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground">Scalable Infrastructure</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Cloud-native architecture that scales automatically with demand
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TechStack;

