"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  saveEvidence,
  saveCase,
  getAllCases,
  getEvidenceByCase,
  deleteCase,
  deleteEvidence,
  renameEvidence,
  type StoredEvidence,
  type StoredCase,
} from "@/lib/evidence-storage";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/custom-tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  CloudUpload,
  Plus,
  FolderOpen,
  Briefcase,
  Hash,
  FileText,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Download,
} from "lucide-react";

interface UploadedFile {
  id: string;
  dbId?: string; // ID from database
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  progress: number;
  size: string;
  type: string;
  evidenceName: string;
}

interface ImageUploadProps {
  onNavigateToDetect?: (evidenceId?: string) => void;
  preselectedCaseId?: string | null;
}

export default function ImageUpload({ onNavigateToDetect, preselectedCaseId }: ImageUploadProps) {
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<StoredCase | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [evidenceNameInput, setEvidenceNameInput] = useState("");
  const [existingEvidence, setExistingEvidence] = useState<StoredEvidence[]>([]);
  const [isInstantAnalysis, setIsInstantAnalysis] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<StoredEvidence | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null); // evidence ID being renamed
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCases = async () => {
      const allCases = await getAllCases();
      setCases(allCases);
    };
    loadCases();
  }, []);

  useEffect(() => {
    if (preselectedCaseId && cases.length > 0) {
      const foundCase = cases.find((c) => c.id === preselectedCaseId);
      if (foundCase) {
        setSelectedCase(foundCase);
        setUploadedFiles([]); // Clear previous uploads when switching
      }
    }
  }, [preselectedCaseId, cases]);

  useEffect(() => {
    const loadEvidence = async () => {
      if (selectedCase) {
        const evidence = await getEvidenceByCase(selectedCase.id || (selectedCase as any)._id);
        setExistingEvidence(evidence);
      } else {
        setExistingEvidence([]);
      }
    };
    loadEvidence();
  }, [selectedCase]);

  const refreshCases = async () => {
    const allCases = await getAllCases();
    setCases(allCases);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleCreateCase = async () => {
    if (!newCaseNumber.trim() || !newCaseName.trim()) return;
    const newCase: StoredCase = {
      caseNumber: newCaseNumber.trim(),
      caseName: newCaseName.trim(),
      createdDate: new Date().toISOString(),
    };
    await saveCase(newCase);
    await refreshCases();
    
    // Find the newly created case in the updated list to select it
    // Note: saveCase now works with MongoDB, but the UI might need the ID
    // Our backend returns the new case including _id.
    // However, saveCase in lib/evidence-storage.ts doesn't return anything.
    // I should probably update it to return the saved object.
    // For now, I'll just refresh and the user can select it or I can try to find it.
    setIsCreatingCase(false);
    setNewCaseNumber("");
    setNewCaseName("");
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Delete this case and all its evidence?")) return;
    await deleteCase(caseId);
    await refreshCases();
    if (selectedCase?.id === caseId || (selectedCase as any)?._id === caseId) setSelectedCase(null);
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return;
    await deleteEvidence(evidenceId);
    if (selectedCase) {
      const evidence = await getEvidenceByCase(selectedCase.id || (selectedCase as any)._id);
      setExistingEvidence(evidence);
    }
    if (viewingEvidence?.id === evidenceId || (viewingEvidence as any)?._id === evidenceId) {
      setViewingEvidence(null);
    }
  };

  const handleRenameEvidence = async (evidenceId: string) => {
    if (!renameValue.trim()) {
      setIsRenaming(null);
      return;
    }
    const success = await renameEvidence(evidenceId, renameValue.trim());
    if (success) {
      if (selectedCase) {
        const evidence = await getEvidenceByCase(selectedCase.id || (selectedCase as any)._id);
        setExistingEvidence(evidence);
      }
    }
    setIsRenaming(null);
    setRenameValue("");
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || !selectedCase) return;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file`);
          return;
        }

        const reader = new FileReader();
        const fileId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const eName = evidenceNameInput.trim() || file.name.replace(/\.[^/.]+$/, "");

        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const newFile: UploadedFile = {
            id: fileId,
            file,
            preview,
            status: "uploading",
            progress: 0,
            size: formatFileSize(file.size),
            type: file.type,
            evidenceName: eName,
          };

          setUploadedFiles((prev) => [...prev, newFile]);

          const evidenceData: StoredEvidence = {
            fileName: file.name,
            imageData: preview,
            uploadDate: new Date().toISOString(),
            status: "pending",
            size: formatFileSize(file.size),
            type: file.type,
            caseId: selectedCase.id || (selectedCase as any)._id,
            caseNumber: selectedCase.caseNumber,
            caseName: selectedCase.caseName,
            evidenceName: eName,
          };
          
          saveEvidence(evidenceData).then((saved) => {
            if (saved) {
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, dbId: saved.id || saved._id } : f
                )
              );
            }
          });

          const interval = setInterval(() => {
            setUploadedFiles((prev) =>
              prev.map((f) => {
                if (f.id === fileId) {
                  const newProgress = Math.min(f.progress + 15, 100);
                  if (newProgress === 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                      setUploadedFiles((prev) =>
                        prev.map((f) =>
                          f.id === fileId
                            ? { ...f, status: "success" as const }
                            : f
                        )
                      );
                    }, 400);
                  }
                  return { ...f, progress: newProgress };
                }
                return f;
              })
            );
          }, 150);
        };

        reader.readAsDataURL(file);
      });

      setEvidenceNameInput("");
    },
    [selectedCase, evidenceNameInput]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ──────── PHASE 1: CASE SELECTION ────────
  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Evidence</h2>
          <p className="text-muted-foreground">
            Select or create a case to begin uploading evidence.
          </p>
        </div>

        {/* New Case Form */}
        <AnimatePresence>
          {isCreatingCase && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-base">Create New Case</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="caseNumber" className="text-xs font-medium flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" /> Case Number
                      </Label>
                      <Input
                        id="caseNumber"
                        placeholder="e.g. CASE-2026-001"
                        value={newCaseNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCaseNumber(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreateCase()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caseName" className="text-xs font-medium flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Case Name
                      </Label>
                      <Input
                        id="caseName"
                        placeholder="e.g. Bank Fraud Investigation"
                        value={newCaseName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCaseName(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreateCase()}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingCase(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateCase}
                      disabled={!newCaseNumber.trim() || !newCaseName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Create Case
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Case Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add Case Card */}
          {!isCreatingCase && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreatingCase(true)}
              className="flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">New Case</span>
            </motion.button>
          )}

          {/* Existing Cases */}
          {cases.map((c) => {
            // Note: Since getEvidenceByCase is now async, we'd ideally load counts 
            // separately or include them in the cases API. 
            // For now, I'll keep the UI simple or just show a '-'
            return (
              <motion.div
                key={c.id || (c as any)._id}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <button
                  onClick={() => {
                    setSelectedCase(c);
                    setUploadedFiles([]);
                  }}
                  className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{c.caseNumber}</p>
                    <p className="text-sm font-semibold truncate mt-0.5">{c.caseName}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Created {new Date(c.createdDate).toLocaleDateString()}
                  </p>
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCase(c.id || (c as any)._id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {cases.length === 0 && !isCreatingCase && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No cases yet. Create one to start uploading evidence.</p>
          </div>
        )}
      </div>
    );
  }

  // ──────── PHASE 2: EVIDENCE UPLOAD ────────
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => { setSelectedCase(null); setUploadedFiles([]); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Upload Evidence</h2>
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedCase.caseNumber}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {selectedCase.caseName}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Name Input + Upload Area */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evidenceName" className="text-xs font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Evidence Label
            <span className="text-muted-foreground font-normal">(optional — defaults to file name)</span>
          </Label>
          <Input
            id="evidenceName"
            placeholder="e.g. Crime Scene Photo 1, CCTV Footage Capture"
            value={evidenceNameInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvidenceNameInput(e.target.value)}
          />
        </div>

        <Card className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors bg-muted/5 overflow-hidden">
          <CardContent className="p-0">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center min-h-[240px] text-center transition-all duration-300 ${isDragging ? "bg-primary/5 scale-[1.01]" : ""
                }`}
            >
              <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className={`p-4 rounded-full bg-primary/10 mb-4 mx-auto w-fit ${isDragging ? "ring-4 ring-primary/20" : ""}`}>
                  <CloudUpload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Drag and drop evidence files
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                  JPEG, PNG, TIFF, RAW — max 50MB
                </p>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </div>
              </motion.div>

              {isDragging && (
                <div className="absolute inset-0 pointer-events-none border-4 border-primary/20 rounded-lg animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files Grid */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Uploaded Evidence ({uploadedFiles.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {file.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                        <span className="text-white text-xs font-medium mb-2">
                          Uploading...
                        </span>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full mb-3 shadow-lg flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          UPLOADED
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-primary hover:bg-primary/90 text-white gap-1.5 h-8 text-[11px]"
                          onClick={() => onNavigateToDetect?.(file.dbId)}
                        >
                          <Search className="h-3.5 w-3.5" />
                          Instant Detect
                        </Button>
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="absolute top-2 right-2 group-hover:hidden">
                        <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground truncate" title={file.evidenceName}>
                      {file.evidenceName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" title={file.file.name}>
                      {file.file.name} • {file.size}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            {uploadedFiles.some((f) => f.status === "success") &&
              onNavigateToDetect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 rounded-xl bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Search className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Ready for Analysis
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {uploadedFiles.filter((f) => f.status === "success").length}{" "}
                          file(s) ready for deepfake detection & metadata analysis.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const lastSuccessfulFile = [...uploadedFiles].reverse().find(f => f.status === 'success' && f.dbId);
                        onNavigateToDetect?.(lastSuccessfulFile?.dbId);
                      }}
                      className="w-full sm:w-auto gap-2 shadow-md"
                    >
                      Proceed to Detection
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Evidence Section */}
      {selectedCase && existingEvidence.length > 0 && (
        <div className="pt-8 border-t border-border mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Existing Evidence in this Case</h3>
            <Badge variant="outline">{existingEvidence.length}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {existingEvidence.map((ev) => (
              <Card 
                key={ev.id} 
                className="overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer relative"
                onClick={() => setViewingEvidence(ev)}
              >
                <div className="aspect-square relative bg-muted">
                  {ev.imageData ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.imageData} alt={ev.fileName} className="w-full h-full object-cover" />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {ev.status === 'complete' && (
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-sm z-10">
                      {ev.result === 'authentic' ?
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                        <AlertCircle className="h-4 w-4 text-rose-500" />}
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingEvidence(ev);
                      }}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRenaming(ev.id!);
                        setRenameValue(ev.evidenceName || ev.fileName);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvidence(ev.id!);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isRenaming === ev.id ? (
                  <div className="p-2 bg-background border-t" onClick={(e) => e.stopPropagation()}>
                    <Input 
                      value={renameValue} 
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameEvidence(ev.id!);
                        if (e.key === 'Escape') setIsRenaming(null);
                      }}
                      className="h-8 text-xs focus-visible:ring-primary"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1 mt-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsRenaming(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => handleRenameEvidence(ev.id!)}>
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate" title={ev.evidenceName || ev.fileName}>
                      {ev.evidenceName || ev.fileName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {new Date(ev.uploadDate).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase font-mono">
                        {ev.type.split('/')[1] || 'FILE'}
                      </Badge>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Detail Sheet */}
      <Sheet open={!!viewingEvidence} onOpenChange={(open) => !open && setViewingEvidence(null)}>
        <SheetContent side="right" className="sm:max-w-xl w-full p-0 border-l border-border/50 bg-background/95 backdrop-blur-md">
          {viewingEvidence && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                    Evidence ID: {viewingEvidence.id || (viewingEvidence as any)._id}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => {
                      setIsRenaming(viewingEvidence.id!);
                      setRenameValue(viewingEvidence.evidenceName || viewingEvidence.fileName);
                      setViewingEvidence(null);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvidence(viewingEvidence.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  {viewingEvidence.evidenceName || viewingEvidence.fileName}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  Uploaded on {new Date(viewingEvidence.uploadDate).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  {/* Image Preview */}
                  <div className="relative group rounded-2xl overflow-hidden bg-black/5 border border-border/50 shadow-inner aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={viewingEvidence.imageData} 
                      alt={viewingEvidence.fileName} 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <Button variant="secondary" size="sm" className="gap-2 backdrop-blur-sm bg-background/20 text-white border-white/20 hover:bg-background/40">
                        <Download className="h-4 w-4" /> Save Original
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="forensics" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="forensics" className="gap-2">
                        <ShieldCheck className="h-4 w-4" /> Forensic Results
                      </TabsTrigger>
                      <TabsTrigger value="metadata" className="gap-2">
                        <Info className="h-4 w-4" /> File Metadata
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="forensics" className="space-y-6">
                      {viewingEvidence.status === 'complete' ? (
                        <div className="space-y-4">
                          <div className={cn(
                            "p-5 rounded-2xl border flex items-center justify-between",
                            viewingEvidence.result === 'tampered' 
                              ? "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400" 
                              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center",
                                viewingEvidence.result === 'tampered' ? "bg-rose-500/20" : "bg-emerald-500/20"
                              )}>
                                {viewingEvidence.result === 'tampered' ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Verdict</p>
                                <p className="text-xl font-black capitalize tracking-tight h-7">{viewingEvidence.result}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold uppercase tracking-wider opacity-60">Confidence</p>
                              <p className="text-xl font-black tracking-tight h-7">{(viewingEvidence.confidence || 0).toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 px-1">
                              <AlertCircle className="h-4 w-4 text-primary" /> Forensic Anomalies
                            </h4>
                            {viewingEvidence.anomalies && viewingEvidence.anomalies.length > 0 ? (
                              <div className="grid gap-2">
                                {viewingEvidence.anomalies.map((anomaly, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    {anomaly}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 rounded-2xl bg-muted/20 border border-dashed border-border/50 text-muted-foreground italic text-sm">
                                No forensic anomalies detected in the image structure.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-12 rounded-3xl bg-muted/10 border border-dashed border-border/50">
                          <div className="h-16 w-16 bg-muted/40 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-muted-foreground animate-pulse" />
                          </div>
                          <h4 className="font-bold text-foreground mb-2">No Forensic Data</h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            This evidence has not been analyzed for tampering yet.
                          </p>
                          <Button 
                            className="w-full gap-2 py-6 rounded-2xl shadow-lg"
                            onClick={() => onNavigateToDetect?.(viewingEvidence.id || (viewingEvidence as any)._id)}
                          >
                            <Search className="h-4 w-4" /> Start Forensic Analysis
                          </Button>
                        </div>
                      )}

                      {/* AI Detection Visualization */}
                      {viewingEvidence.aiDetection && (
                         <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Verification Metrics</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground">Deepfake</p>
                                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                     <div className="h-full bg-primary" style={{ width: `${(viewingEvidence.aiDetection.deepfake || 0) * 100}%` }} />
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground">AI-Generated</p>
                                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                     <div className="h-full bg-amber-500" style={{ width: `${(viewingEvidence.aiDetection.aiGenerated || 0) * 100}%` }} />
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}
                    </TabsContent>

                    <TabsContent value="metadata" className="space-y-6">
                       <div className="grid gap-4">
                          {[
                            { label: "Filename", value: viewingEvidence.fileName, icon: FileText },
                            { label: "File Format", value: viewingEvidence.type.toUpperCase(), icon: ImageIcon },
                            { label: "File Size", value: viewingEvidence.size, icon: Info },
                            { label: "Blockchain Verification", value: viewingEvidence.blockchainHash ? "Registered" : "Pending Registry", icon: ShieldCheck },
                            { label: "IPFS Storage", value: viewingEvidence.ipfsHash || "Not stored on IPFS", icon: CloudUpload },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                               <div className="flex items-center gap-3">
                                  <item.icon className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                               </div>
                               <p className="text-xs font-bold font-mono tracking-tight max-w-[200px] truncate">{item.value}</p>
                            </div>
                          ))}
                       </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-border/50 bg-background">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button variant="outline" className="gap-2 rounded-xl py-6" onClick={() => {
                    // Navigate to face matching with this ID
                    // Need to implement this in page.tsx if desired
                  }}>
                    <Search className="h-4 w-4" /> Match Faces
                  </Button>
                  <Button className="gap-2 rounded-xl py-6" onClick={() => onNavigateToDetect?.(viewingEvidence.id || (viewingEvidence as any)._id)}>
                    <Search className="h-4 w-4" /> Analysis
                  </Button>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
