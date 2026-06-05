"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Database } from "lucide-react";
import FaceDetection from "./face-detection";
import FaceDatabase from "./face-database";

type SubTab = "detection" | "database";

interface FaceAnalysisProps {
    preselectedEvidenceId?: string | null;
    isEmbedded?: boolean;
}

export default function FaceAnalysis({ preselectedEvidenceId, isEmbedded = false }: FaceAnalysisProps) {
    const [subTab, setSubTab] = useState<SubTab>("detection");

    const subTabs: { id: SubTab; label: string; icon: React.ElementType; description: string }[] = [
        { id: "detection", label: "Face Detection", icon: Scan, description: "Detect & match faces in evidence images" },
        { id: "database", label: "Face Database", icon: Database, description: "Manage known persons for matching" },
    ];

    return (
        <div className="space-y-6">
            {!isEmbedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Face Analysis</h2>
                        <p className="text-muted-foreground">
                            Detect faces in evidence and match against your database.
                        </p>
                    </div>

                    {/* Sub-tab header / Segmented Control */}
                    <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border self-start md:self-auto">
                        {subTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = subTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSubTab(tab.id)}
                                    className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                        ? "text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground/80 hover:bg-background/50"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="face-analysis-tab"
                                            className="absolute inset-0 bg-background border border-border rounded-md shadow-sm"
                                            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-2 z-10">
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active sub-component */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={subTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {subTab === "detection" && <FaceDetection preselectedEvidenceId={preselectedEvidenceId} isEmbedded={isEmbedded} />}
                    {subTab === "database" && <FaceDatabase />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
