"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Info,
    Camera,
    Calendar,
    MapPin,
    Cpu,
    FileWarning,
    Eye,
    Zap,
    BarChart3,
    Fingerprint,
    Grid3X3,
} from "lucide-react";
import { getAllEvidence } from "@/lib/evidence-storage";

interface MetadataAnalysisProps {
    preselectedEvidenceId?: string | null;
    isEmbedded?: boolean;
}

interface MetadataFlag {
    text: string;
    severity: "high" | "medium" | "low" | "info";
    points: number;
}

interface ELAResult {
    performed: boolean;
    meanIntensity: number;
    elaImage: string | null;
    interpretation: string;
}

interface PRNUResult {
    performed: boolean;
    noiseMap: string | null;
    uniformityScore: number;
    suspiciousBlocks: number;
    totalBlocks: number;
    suspiciousRatio: number;
    meanVariance: number;
    interpretation: string;
}

interface AnalysisResult {
    metadata: Record<string, string | number>;
    metadataSource: string;
    hasMetadata: boolean;
    metadataFlags: MetadataFlag[];
    ela: ELAResult;
    prnu: PRNUResult;
    score: number;
    maxScore: number;
    risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    verdict: string;
    reasons: string[];
}

export default function MetadataAnalysis({ preselectedEvidenceId, isEmbedded = false }: MetadataAnalysisProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadPreselected = async () => {
            if (preselectedEvidenceId) {
                const all = await getAllEvidence();
                const found = all.find(e => (e.id || (e as any)._id) === preselectedEvidenceId);
                if (found && found.imageData) {
                    setSelectedImage(found.imageData);
                    setFileName(found.fileName);
                    setResult(null);
                    setError(null);
                }
            }
        };
        loadPreselected();
    }, [preselectedEvidenceId]);

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }
        setFileName(file.name);
        setError(null);
        setResult(null);
        const reader = new FileReader();
        reader.onload = (e) => setSelectedImage(e.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const analyzeMetadata = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("imageBase64", selectedImage);
            const response = await fetch("/api/metadata-analysis", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Analysis failed");
            }
            const data: AnalysisResult = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const riskStyles: Record<string, { text: string; bg: string; border: string; badge: string; gradient: string }> = {
        LOW: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", badge: "bg-emerald-500 text-white", gradient: "from-emerald-500/20 to-emerald-500/5" },
        MEDIUM: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", badge: "bg-amber-500 text-white", gradient: "from-amber-500/20 to-amber-500/5" },
        HIGH: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", badge: "bg-red-500 text-white", gradient: "from-red-500/20 to-red-500/5" },
        CRITICAL: { text: "text-red-600", bg: "bg-red-600/10", border: "border-red-600/40", badge: "bg-red-600 text-white", gradient: "from-red-600/20 to-red-600/5" },
    };

    const getRiskIcon = (risk: string) => {
        switch (risk) {
            case "CRITICAL": return <ShieldOff className="h-7 w-7" />;
            case "HIGH": return <ShieldAlert className="h-7 w-7" />;
            case "MEDIUM": return <AlertTriangle className="h-7 w-7" />;
            default: return <ShieldCheck className="h-7 w-7" />;
        }
    };

    const severityStyles = {
        high: { bg: "bg-red-500/10", text: "text-red-500", icon: <ShieldAlert className="h-4 w-4" /> },
        medium: { bg: "bg-amber-500/10", text: "text-amber-500", icon: <AlertTriangle className="h-4 w-4" /> },
        low: { bg: "bg-yellow-500/10", text: "text-yellow-600", icon: <Info className="h-4 w-4" /> },
        info: { bg: "bg-blue-500/10", text: "text-blue-500", icon: <Info className="h-4 w-4" /> },
    };

    const categorizeMetadata = (metadata: Record<string, string | number>) => {
        const categories: { label: string; icon: React.ReactNode; fields: [string, string | number][] }[] = [
            { label: "Camera Info", icon: <Camera className="h-4 w-4" />, fields: [] },
            { label: "Date & Time", icon: <Calendar className="h-4 w-4" />, fields: [] },
            { label: "Location (GPS)", icon: <MapPin className="h-4 w-4" />, fields: [] },
            { label: "Technical", icon: <Cpu className="h-4 w-4" />, fields: [] },
            { label: "Other", icon: <Info className="h-4 w-4" />, fields: [] },
        ];
        const cameraKeys = ["Make", "Model", "LensModel", "LensMake", "BodySerialNumber", "Camera Make", "Camera Model"];
        const dateKeys = ["DateTime", "DateTimeOriginal", "DateTimeDigitized", "OffsetTime", "Date/Time Original", "Create Date", "Modify Date"];
        const gpsKeys = ["GPSInfo", "GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef", "GPS Position"];
        const techKeys = ["ExposureTime", "FNumber", "ISOSpeedRatings", "FocalLength", "Flash", "WhiteBalance",
            "ExposureMode", "MeteringMode", "ShutterSpeedValue", "ApertureValue", "BrightnessValue",
            "ImageWidth", "ImageLength", "XResolution", "YResolution", "Software", "ColorSpace",
            "ExifImageWidth", "ExifImageHeight", "ExifVersion", "Orientation", "FileSize", "FileType",
            "MIMEType", "ImageSize", "Megapixels", "BitDepth", "ColorType", "Compression",
            "Image Width", "Image Height", "File Size", "File Type", "Creator Tool"];
        const skipKeys = ["FileName", "SourceFile", "ExifToolVersion", "Directory"];

        Object.entries(metadata).forEach(([key, value]) => {
            if (skipKeys.some(s => key.includes(s))) return;
            if (key.includes("MakerNote") || key.includes("UserComment") || key.includes("Thumbnail")) return;
            if (cameraKeys.some(k => key.includes(k))) categories[0].fields.push([key, value]);
            else if (dateKeys.some(k => key.includes(k)) || key.toLowerCase().includes("date")) categories[1].fields.push([key, value]);
            else if (gpsKeys.some(k => key.includes(k)) || key.includes("GPS")) categories[2].fields.push([key, value]);
            else if (techKeys.some(k => key.includes(k))) categories[3].fields.push([key, value]);
            else categories[4].fields.push([key, value]);
        });
        return categories.filter(c => c.fields.length > 0);
    };

    const rs = result ? (riskStyles[result.risk] || riskStyles.LOW) : riskStyles.LOW;

    return (
        <div className="space-y-5">
            {/* Upload + Analyze */}
            <Card>
                {!isEmbedded && (
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Hybrid Forensic Analysis</CardTitle>
                        <CardDescription className="text-xs">
                            Upload an image for combined Metadata + ELA + PRNU noise analysis
                        </CardDescription>
                    </CardHeader>
                )}
                <CardContent>
                    {isEmbedded && selectedImage ? (
                        <div className="mb-4">
                            {!result && (
                                <Button onClick={analyzeMetadata} disabled={isAnalyzing} className="w-full gap-2">
                                    {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing Metadata...</> : <><Eye className="h-4 w-4" /> Run Forensic Analysis</>}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5" : selectedImage ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/40"
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" ref={fileInputRef} />
                                    {selectedImage ? (
                                        <div className="flex items-center gap-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                                            <div className="text-left min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Click or drop to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, TIFF — up to 50MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex lg:flex-col items-center justify-center gap-3">
                                <Button onClick={analyzeMetadata} disabled={!selectedImage || isAnalyzing} className="min-w-[140px] gap-2" size="lg">
                                    {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Eye className="h-4 w-4" /> Run Analysis</>}
                                </Button>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ════════ RESULTS ════════ */}
            {result && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                    {/* Verdict Banner */}
                    <Card className={`border ${rs.border} overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${rs.gradient} pointer-events-none`} />
                        <CardContent className="py-5 px-5 relative">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className={`p-3 rounded-xl ${rs.bg} ${rs.text}`}>
                                    {getRiskIcon(result.risk)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-foreground text-lg">{result.verdict}</h3>
                                        <Badge className={rs.badge}>{result.risk}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>Score: <strong className="text-foreground">{result.score}</strong>/{result.maxScore}</span>
                                        <span className="text-border">|</span>
                                        <span>Metadata via <strong className="text-foreground">{result.metadataSource}</strong></span>
                                    </div>
                                </div>
                                {/* Score bar */}
                                <div className="w-full sm:w-48">
                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${result.risk === "CRITICAL" ? "bg-red-600" :
                                                result.risk === "HIGH" ? "bg-red-500" :
                                                    result.risk === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                                                }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((result.score / result.maxScore) * 100, 100)}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ELA + PRNU side-by-side (Stacked if embedded) */}
                    <div className={isEmbedded ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 lg:grid-cols-2 gap-5"}>

                        {/* ELA Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-violet-500" />
                                    Error Level Analysis (ELA)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {result.ela.performed ? (
                                    <>
                                        {result.ela.elaImage && (
                                            <div className="relative rounded-lg overflow-hidden border border-border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={result.ela.elaImage} alt="ELA output" className="w-full h-auto" />
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                    <p className="text-white text-[11px] font-medium">
                                                        Mean Intensity: {result.ela.meanIntensity}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-lg border ${result.ela.meanIntensity > 40 ? "bg-red-500/10 border-red-500/20" :
                                            result.ela.meanIntensity > 25 ? "bg-amber-500/10 border-amber-500/20" :
                                                "bg-emerald-500/10 border-emerald-500/20"
                                            }`}>
                                            <div className="flex items-start gap-2">
                                                <BarChart3 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${result.ela.meanIntensity > 40 ? "text-red-500" :
                                                    result.ela.meanIntensity > 25 ? "text-amber-500" : "text-emerald-500"
                                                    }`} />
                                                <p className="text-sm text-foreground">{result.ela.interpretation}</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            ELA reveals areas saved at different compression levels. Bright spots may indicate spliced or edited regions.
                                        </p>
                                    </>
                                ) : (
                                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                                        <p className="text-sm text-muted-foreground">{result.ela.interpretation || "ELA analysis could not be performed"}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* PRNU Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-cyan-500" />
                                    PRNU Noise Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {result.prnu?.performed ? (
                                    <>
                                        {result.prnu.noiseMap && (
                                            <div className="relative rounded-lg overflow-hidden border border-border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={result.prnu.noiseMap} alt="PRNU noise heatmap" className="w-full h-auto" />
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                    <div className="flex items-center justify-between text-white text-[11px] font-medium">
                                                        <span>CV: {result.prnu.uniformityScore}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Grid3X3 className="h-3 w-3" />
                                                            {result.prnu.suspiciousBlocks}/{result.prnu.totalBlocks} anomalous
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-lg border ${result.prnu.suspiciousRatio > 0.25 ? "bg-red-500/10 border-red-500/20" :
                                            result.prnu.suspiciousRatio > 0.10 ? "bg-amber-500/10 border-amber-500/20" :
                                                "bg-emerald-500/10 border-emerald-500/20"
                                            }`}>
                                            <div className="flex items-start gap-2">
                                                <Fingerprint className={`h-4 w-4 flex-shrink-0 mt-0.5 ${result.prnu.suspiciousRatio > 0.25 ? "text-red-500" :
                                                    result.prnu.suspiciousRatio > 0.10 ? "text-amber-500" : "text-emerald-500"
                                                    }`} />
                                                <p className="text-sm text-foreground">{result.prnu.interpretation}</p>
                                            </div>
                                        </div>
                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-2 rounded-lg bg-muted/50 text-center">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uniformity</p>
                                                <p className="text-sm font-bold text-foreground mt-0.5">{result.prnu.uniformityScore}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-muted/50 text-center">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Anomalous</p>
                                                <p className="text-sm font-bold text-foreground mt-0.5">
                                                    {result.prnu.suspiciousBlocks}
                                                    <span className="text-[10px] font-normal text-muted-foreground">/{result.prnu.totalBlocks}</span>
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-muted/50 text-center">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ratio</p>
                                                <p className="text-sm font-bold text-foreground mt-0.5">{(result.prnu.suspiciousRatio * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            PRNU analyzes sensor noise patterns. Non-uniform blocks (hot spots) suggest spliced or composited regions.
                                        </p>
                                    </>
                                ) : (
                                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                                        <p className="text-sm text-muted-foreground">{result.prnu?.interpretation || "PRNU analysis could not be performed"}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Flags + Observations */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileWarning className="h-4 w-4 text-amber-500" />
                                Forensic Flags & Observations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Metadata flags */}
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata Flags ({result.metadataFlags.length})</p>
                                    {result.metadataFlags.length > 0 ? (
                                        <div className="space-y-2">
                                            {result.metadataFlags.map((flag, i) => {
                                                const sty = severityStyles[flag.severity] || severityStyles.info;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.06 }}
                                                        className={`flex items-start gap-3 p-2.5 rounded-lg ${sty.bg} border border-border`}
                                                    >
                                                        <span className={`flex-shrink-0 mt-0.5 ${sty.text}`}>{sty.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-foreground">{flag.text}</p>
                                                            {flag.points > 0 && (
                                                                <p className="text-[10px] text-muted-foreground mt-0.5">+{flag.points} risk points</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <p className="text-sm text-foreground">No suspicious metadata indicators.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scoring reasons */}
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analysis Observations ({result.reasons.length})</p>
                                    {result.reasons.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {result.reasons.map((r, i) => (
                                                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                                                    <BarChart3 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                                    <p className="text-xs text-foreground">{r}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-3">No additional observations.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata Details */}
                    {result.hasMetadata && Object.keys(result.metadata).length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    EXIF Metadata
                                    <Badge variant="outline" className="text-[10px] ml-1">
                                        {Object.keys(result.metadata).length} fields
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Extracted via {result.metadataSource}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {categorizeMetadata(result.metadata).map((category, catIdx) => (
                                        <div key={catIdx}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 rounded bg-muted">{category.icon}</div>
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category.label}</h4>
                                            </div>
                                            <div className="rounded-lg border border-border overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <tbody>
                                                        {category.fields.map(([key, value], idx) => (
                                                            <tr key={key} className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                                                                <td className="px-3 py-2 font-medium text-muted-foreground w-1/3 text-xs">{key}</td>
                                                                <td className="px-3 py-2 text-foreground text-xs break-all">{String(value)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            )}
        </div>
    );
}
