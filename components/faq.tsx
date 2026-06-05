import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faq = [
  {
    question: "What is the purpose of this platform?",
    answer: (
      <>
        <p className="mb-3">
          EvidenceCheck is a comprehensive digital forensics platform designed to verify the authenticity and integrity of digital evidence, primarily images and documents. Our platform combines cutting-edge AI-based tampering detection with blockchain-backed storage to create an immutable, verifiable record of evidence.
        </p>
        <p className="mb-3">
          This system is specifically built for legal professionals, forensic analysts, investigators, and law enforcement agencies who need to ensure that digital evidence maintains its integrity throughout legal proceedings.
        </p>
        <p>
          By providing a transparent, tamper-proof verification system, we help maintain the credibility of digital evidence in courtrooms and investigations.
        </p>
      </>
    ),
  },
  {
    question: "How does the AI detect image tampering?",
    answer: (
      <>
        <p className="mb-3">
          Our advanced AI detection system employs multiple deep learning models and computer vision techniques to identify tampering. The system analyzes pixel-level inconsistencies, compression artifacts, and statistical patterns that indicate manipulation.
        </p>
        <p className="mb-3">
          It examines EXIF metadata for discrepancies, checks for cloning artifacts, and identifies areas where content-aware fill or other editing tools may have been used. The AI also performs frequency domain analysis to detect resampling, recompression, or geometric transformations.
        </p>
        <p>
          Our models are trained on millions of authentic and manipulated images, achieving over 95% accuracy in detecting various types of forgeries including copy-move, splicing, and retouching. Each analysis generates a detailed confidence score and highlights suspicious regions in the image.
        </p>
      </>
    ),
  },
  {
    question: "What role does blockchain play in this system?",
    answer: (
      <>
        <p className="mb-3">
          Blockchain technology serves as the foundation for ensuring evidence immutability and creating an auditable trail. When evidence is verified, a cryptographic hash of the file is generated and stored on a distributed blockchain ledger. This hash acts as a unique fingerprint that cannot be altered without detection.
        </p>
        <p className="mb-3">
          Once recorded, the evidence&apos;s authenticity can be verified at any time by comparing the current file&apos;s hash with the stored hash. The blockchain also maintains a complete audit trail showing when the evidence was uploaded, who verified it, and any subsequent access or verification attempts.
        </p>
        <p>
          This decentralized approach eliminates single points of failure and ensures that even if our servers are compromised, the evidence integrity records remain secure and verifiable across the entire network.
        </p>
      </>
    ),
  },
  {
    question: "What types of evidence can be verified?",
    answer: (
      <>
        <p className="mb-3">
          Currently, our platform supports comprehensive verification for image-based evidence including JPEG, PNG, TIFF, and RAW formats. This covers photographs, screenshots, scanned documents, and digital images from various sources. Our system can analyze images up to 50MB in size with resolutions up to 4K.
        </p>
        <p className="mb-3">
          We&apos;re actively developing support for video files (MP4, MOV, AVI) with frame-by-frame analysis capabilities, and document verification (PDF, DOCX) with metadata and content integrity checks.
        </p>
        <p>
          Future updates will include support for audio files, 3D models, and real-time verification for live evidence capture. Each file type undergoes format-specific analysis to detect type-appropriate manipulation techniques.
        </p>
      </>
    ),
  },
  {
    question: "How secure is the evidence data?",
    answer: (
      <>
        <p className="mb-3">
          Security is our top priority. All evidence files are encrypted using AES-256 encryption before upload and remain encrypted at rest. We implement end-to-end encryption for data in transit using TLS 1.3.
        </p>
        <p className="mb-3">
          Access control is managed through multi-factor authentication (MFA) and role-based permissions, ensuring only authorized personnel can access sensitive evidence. Our infrastructure follows SOC 2 Type II compliance standards and undergoes regular security audits.
        </p>
        <p>
          The blockchain ledger adds an additional layer of security by distributing evidence hashes across multiple nodes, making it virtually impossible to tamper with records. We also maintain encrypted backups in geographically distributed data centers with 99.9% uptime guarantees. All access attempts are logged and monitored for suspicious activity.
        </p>
      </>
    ),
  },
  {
    question: "Who can access and verify evidence?",
    answer: (
      <>
        <p className="mb-3">
          Access is strictly controlled through a comprehensive role-based access control (RBAC) system. Authorized roles include Forensic Analysts (full verification and analysis capabilities), Investigators (upload and view verified evidence), Legal Authorities (view-only access with court case linking), and Administrators (system management).
        </p>
        <p className="mb-3">
          Each user must complete identity verification and receive approval from an organization administrator. Evidence can only be uploaded by verified users, and verification results are cryptographically signed to prove authenticity.
        </p>
        <p>
          Organizations can set custom permission levels, restrict access to specific cases, and maintain detailed audit logs of all user activities. This ensures that sensitive evidence remains protected while allowing appropriate collaboration between authorized parties.
        </p>
      </>
    ),
  },
];

const FAQ = () => {
  return (
    <div
      id="faq"
      className="w-full max-w-(--breakpoint-xl) mx-auto py-12 xs:py-20 px-6"
    >
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl xs:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 xs:text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about our AI and Blockchain-based evidence verification system.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Accordion
          type="single"
          collapsible
          className="space-y-4"
        >
          {faq.map(({ question, answer }, index) => (
            <AccordionItem
              key={question}
              value={`question-${index}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger
                    className={cn(
                      "flex flex-1 items-center justify-between gap-4 px-6 py-5 text-left font-semibold transition-all",
                      "text-base xs:text-lg text-foreground group-hover:text-primary",
                      "[&[data-state=open]]:text-primary [&[data-state=open]]:bg-gradient-to-r [&[data-state=open]]:from-primary/5 [&[data-state=open]]:to-secondary/5"
                    )}
                  >
                    <span className="flex-1 pr-4 leading-snug">{question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-primary [&[data-state=open]]:rotate-180 [&[data-state=open]]:text-primary" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <div className="pt-2 pb-2 text-[15px] xs:text-base leading-relaxed text-muted-foreground">
                    {answer}
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
