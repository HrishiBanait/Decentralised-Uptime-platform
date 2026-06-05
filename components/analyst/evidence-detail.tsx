"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Calendar,
    FileText,
    User,
    Hash,
    Shield,
    FileJson,
    Download,
    Share2,
    Maximize2,
    ZoomIn,
    ZoomOut,
    Eye,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card"; // Keep Card for non-embedded parts if needed, but mainly for consistent style
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/custom-tabs";
import { getEvidenceByCase, getAllEvidence, type StoredEvidence } from "@/lib/evidence-storage";
import TamperingDetection from "./tampering-detection";
import MetadataAnalysis from "./metadata-analysis";
import FaceAnalysis from "./face-analysis";
import { motion } from "framer-motion";
import { uploadToIPFS } from "@/lib/ipfs-service";
import { connectWallet, storeHashOnBlockchain } from "@/lib/web3-service";
import { saveEvidence } from "@/lib/evidence-storage";
import { Loader2, ShieldCheck, Link as LinkIcon } from "lucide-react";

interface EvidenceDetailProps {
    evidenceId: string;
    onBack: () => void;
    onAction: (action: 'detect' | 'metadata' | 'face' | 'report', evidenceId: string) => void;
}

export default function EvidenceDetail({ evidenceId, onBack, onAction }: EvidenceDetailProps) {
    const [evidence, setEvidence] = useState<StoredEvidence | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isPreserving, setIsPreserving] = useState(false);

    // Helper to convert base64 to File
    const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    };

    const handlePreserve = async () => {
        if (!evidence) return;
        setIsPreserving(true);
        try {
            // 1. Connect Wallet
            const account = await connectWallet();
            if (!account) throw new Error("Wallet connection failed or rejected");

            // 2. Upload image to local IPFS daemon
            const file = await dataURLtoFile(evidence.imageData, evidence.fileName);
            const ipfsHash = await uploadToIPFS(file);

            // 3. Store IPFS CID on ImageStorage contract
            const receipt = await storeHashOnBlockchain(ipfsHash);

            // 4. Save to local evidence record
            const updatedEvidence = {
                ...evidence,
                ipfsHash,
                blockchainHash: receipt.hash,
            };
            setEvidence(updatedEvidence);
            await saveEvidence(updatedEvidence);

            alert(
                `Evidence preserved on blockchain!\nIPFS CID: ${ipfsHash}\nTransaction Hash: ${receipt.hash}`
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Preservation Error:", error);
            alert("Preservation failed: " + (error.message || error));
        } finally {
            setIsPreserving(false);
        }
    };

    useEffect(() => {
        const loadEvidence = async () => {
            const all = await getAllEvidence();
            const found = all.find(e => (e.id || (e as any)._id) === evidenceId);
            if (found) setEvidence(found);
        };
        loadEvidence();
    }, [evidenceId]);

    if (!evidence) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground animate-pulse">
                <p>Loading evidence details...</p>
                <Button variant="link" onClick={onBack} className="mt-2 text-primary">Return to Records</Button>
            </div>
        );
    }

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = evidence.imageData;
        link.download = evidence.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 animate-in fade-in duration-500">
            {/* --- Top Navigation Bar --- */}
            <header className="flex items-center justify-between px-1 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted/60 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            {evidence.evidenceName || evidence.fileName}
                            {evidence.caseNumber && <Badge variant="outline" className="font-mono text-xs">{evidence.caseNumber}</Badge>}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(evidence.uploadDate).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {evidence.size}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-2">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" disabled className="h-8 gap-2">
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button size="sm" onClick={() => onAction('report', (evidence.id || (evidence as any)._id) as string)} className="h-8 gap-2 ml-2">
                        <FileText className="h-3.5 w-3.5" />
                        Generate Report
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreserve}
                        disabled={isPreserving || !!evidence.blockchainHash}
                        className={`h-8 gap-2 ml-2 ${evidence.blockchainHash ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100" : ""}`}
                    >
                        {isPreserving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {evidence.blockchainHash ? "Preserved On-Chain" : "Preserve"}
                    </Button>
                </div>
            </header>

            {/* --- Main Transformation Workspace --- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* Left Panel: Image Visualization (8 Columns) */}
                <div className="lg:col-span-8 flex flex-col bg-muted/10 rounded-xl border border-border/50 overflow-hidden relative group">
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(z => Math.min(z + 0.1, 3))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(1)}>
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('/grid-pattern.svg')] bg-center">
                        {/* Placeholder for grid pattern if missing, fallback to nice gray */}
                        <div className="relative shadow-2xl shadow-black/5 rounded-lg overflow-hidden transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                            <img
                                src={evidence.imageData}
                                alt={evidence.fileName}
                                className="max-h-[70vh] w-auto object-contain"
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-3 left-4 text-xs font-mono text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded border">
                        {evidence.fileName} • {Math.round(zoom * 100)}%
                    </div>
                </div>

                {/* Right Panel: Analysis Tools (4 Columns) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0 bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
                    <Tabs defaultValue="details" className="flex flex-col h-full">
                        <div className="px-4 pt-4 pb-2 border-b border-border/40 bg-muted/5">
                            <TabsList className="w-full grid grid-cols-4 bg-muted/50 p-1">
                                <TabsTrigger value="details">Info</TabsTrigger>
                                <TabsTrigger value="detect">Tamper</TabsTrigger>
                                <TabsTrigger value="metadata">Meta</TabsTrigger>
                                <TabsTrigger value="face">Face</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {/* Tab Content: Details */}
                            <TabsContent value="details" className="mt-0 h-full">
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">File Metadata</h3>
                                        <div className="grid gap-3">
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Full Name</span>
                                                <span className="text-sm font-medium">{evidence.fileName}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><User className="h-3.5 w-3.5" /> Investigating Case</span>
                                                <span className="text-sm font-medium">{evidence.caseName || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Date Added</span>
                                                <span className="text-sm font-medium">{new Date(evidence.uploadDate).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {evidence.blockchainHash && (
                                        <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 space-y-2">
                                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-1">
                                                <ShieldCheck className="h-4 w-4" /> Blockchain Verified
                                            </div>
                                            <div className="text-xs text-muted-foreground break-all">
                                                <span className="font-medium text-foreground">Tx:</span> {evidence.blockchainHash}
                                            </div>
                                            {evidence.ipfsHash && (
                                                <div className="text-xs text-muted-foreground break-all">
                                                    <span className="font-medium text-foreground">IPFS:</span> {evidence.ipfsHash}
                                                </div>
                                            )}
                                            <a
                                                href={`http://127.0.0.1:8545`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
                                            >
                                                View on Local Hardhat Node <LinkIcon className="h-3 w-3" />
                                            </a>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Analysis Status</h3>
                                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Global Status</span>
                                                <Badge variant={evidence.status === 'complete' ? 'default' : 'secondary'}>
                                                    {evidence.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            {evidence.result && (
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
                                                    <span className="text-sm font-medium">Verdict</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={evidence.result === 'authentic' ? 'outline' : 'destructive'}
                                                            className={evidence.result === 'authentic' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 bg-red-50 border-red-200'}>
                                                            {evidence.result?.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                            {evidence.confidence && (
                                                <div className="mt-2 text-xs text-muted-foreground text-right">
                                                    Confidence Score: {(evidence.confidence * 100).toFixed(1)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                                        <p className="flex items-start gap-2">
                                            <Eye className="h-4 w-4 mt-0.5 shrink-0" />
                                            Active analysis requested. Use the tabs above to switch between different forensic tools.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab Content: Tampering */}
                            <TabsContent value="detect" className="mt-0 h-full">
                                <div className="p-4">
                                    <TamperingDetection preselectedEvidenceId={evidenceId} isEmbedded={true} />
                                </div>
                            </TabsContent>

                            {/* Tab Content: Metadata */}
                            <TabsContent value="metadata" className="mt-0 h-full">
                                <div className="p-4">
                                    <MetadataAnalysis preselectedEvidenceId={evidenceId} isEmbedded={true} />
                                </div>
                            </TabsContent>

                            {/* Tab Content: Face */}
                            <TabsContent value="face" className="mt-0 h-full">
                                <div className="p-4">
                                    <FaceAnalysis preselectedEvidenceId={evidenceId} isEmbedded={true} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
