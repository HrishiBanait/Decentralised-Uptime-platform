"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllEvidence, getAllCases, deleteEvidence, renameEvidence } from "@/lib/evidence-storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Search,
  Eye,
  Trash2,
  Calendar,
  Image as ImageIcon,
  FileText,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  X,
  Check,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
} from "lucide-react";

interface EvidenceRecord {
  id: string;
  fileName: string;
  evidenceName?: string;
  uploadDate: string;
  analyzedDate: string;
  status: "pending" | "analyzing" | "complete";
  result: "authentic" | "tampered" | null;
  confidence: number | null;
  size: string;
  type: string;
  blockchainHash: string | null;
  reportGenerated: boolean;
  caseId?: string;
  caseNumber?: string;
  caseName?: string;
}

interface CaseGroup {
  caseId: string;
  caseNumber: string;
  caseName: string;
  records: EvidenceRecord[];
}

interface EvidenceRecordsProps {
  onQuickAdd?: (caseId: string) => void;
  onView?: (evidenceId: string) => void;
}

export default function EvidenceRecords({ onQuickAdd, onView }: EvidenceRecordsProps) {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [collapsedCases, setCollapsedCases] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const storedEvidence = await getAllEvidence();

    const evidenceRecords: EvidenceRecord[] = storedEvidence.map((evidence) => {
      return {
        id: evidence.id || (evidence as any)._id,
        fileName: evidence.fileName,
        evidenceName: evidence.evidenceName,
        uploadDate: new Date(evidence.uploadDate).toLocaleString(),
        analyzedDate: evidence.analyzedDate ? new Date(evidence.analyzedDate).toLocaleString() : "",
        status: evidence.status,
        result: evidence.result ?? null,
        confidence: evidence.confidence ?? null,
        size: evidence.size,
        type: evidence.type,
        blockchainHash: evidence.blockchainHash || null,
        reportGenerated: !!evidence.reportGenerated,
        caseId: evidence.caseId,
        caseNumber: evidence.caseNumber,
        caseName: evidence.caseName,
      };
    });

    evidenceRecords.sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return dateB - dateA;
    });

    setRecords(evidenceRecords);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this evidence record?')) {
      await deleteEvidence(id);
      await loadRecords();
    }
  };

  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleRenameSave = async (id: string) => {
    if (editValue.trim() && editValue.trim() !== "") {
      const success = await renameEvidence(id, editValue.trim());
      if (success) {
        await loadRecords();
        setEditingId(null);
        setEditValue("");
      } else {
        alert('Failed to rename evidence. Please try again.');
      }
    } else {
      alert('Evidence name cannot be empty.');
    }
  };

  const toggleCase = (caseId: string) => {
    setCollapsedCases((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const filteredRecords = records.filter((record) => {
    const searchTarget = record.evidenceName || record.fileName;
    const matchesSearch =
      searchTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.caseName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.caseNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesResult = filterResult === "all" || record.result === filterResult;
    return matchesSearch && matchesStatus && matchesResult;
  });

  // Group records by case
  const caseGroups: CaseGroup[] = [];
  const uncased: EvidenceRecord[] = [];

  filteredRecords.forEach((r) => {
    if (r.caseId) {
      let group = caseGroups.find((g) => g.caseId === r.caseId);
      if (!group) {
        group = { caseId: r.caseId, caseNumber: r.caseNumber || "", caseName: r.caseName || "Unnamed Case", records: [] };
        caseGroups.push(group);
      }
      group.records.push(r);
    } else {
      uncased.push(r);
    }
  });

  const renderRecord = (record: EvidenceRecord) => (
    <motion.div
      key={record.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />
                {editingId === record.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSave(record.id);
                        else if (e.key === 'Escape') handleRenameCancel();
                      }}
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRenameSave(record.id)} className="h-8 w-8">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRenameCancel} className="h-8 w-8">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {record.evidenceName || record.fileName}
                    </h3>
                    {record.evidenceName && (
                      <p className="text-[11px] text-muted-foreground">
                        {record.fileName}
                      </p>
                    )}
                  </div>
                )}
                {record.status === "complete" && record.result && (
                  <>
                    {record.result === "authentic" ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Authentic
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Tampered
                      </Badge>
                    )}
                  </>
                )}
                {record.status === "analyzing" && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing
                  </Badge>
                )}
                {record.status === "pending" && (
                  <Badge variant="outline">Pending</Badge>
                )}
                {record.reportGenerated && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="h-3 w-3 mr-1" />
                    Report
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Uploaded</p>
                    <p className="text-foreground">{record.uploadDate}</p>
                  </div>
                </div>
                {record.analyzedDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p className="text-xs">Analyzed</p>
                      <p className="text-foreground">{record.analyzedDate}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Size</p>
                    <p className="text-foreground">{record.size}</p>
                  </div>
                </div>
                {record.confidence && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <div>
                      <p className="text-xs">Confidence</p>
                      <p className="text-foreground">{record.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>

              {record.blockchainHash && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Blockchain Hash:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {record.blockchainHash}
                    </code>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {editingId !== record.id && (
                <>
                  <Button variant="outline" size="icon" title="View" onClick={() => onView && onView(record.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRenameStart(record.id, record.evidenceName || record.fileName)}
                    title="Rename"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(record.id)}
                    title="Delete"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Records</CardTitle>
          <CardDescription>
            View and manage all uploaded evidence files grouped by case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search evidence, case name, or case number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="analyzing">Analyzing</option>
              <option value="complete">Complete</option>
            </select>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Results</option>
              <option value="authentic">Authentic</option>
              <option value="tampered">Tampered</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Case-grouped Records */}
      <div className="space-y-5">
        {caseGroups.length === 0 && uncased.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No evidence records found</p>
            </CardContent>
          </Card>
        )}

        {caseGroups.map((group) => (
          <div key={group.caseId} className="space-y-3">
            {/* Case Header */}
            <div className="flex items-center gap-2 w-full bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors pr-2 group/header">
              <button
                onClick={() => toggleCase(group.caseId)}
                className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
              >
                {collapsedCases.has(group.caseId) ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">{group.caseNumber}</span>
                <span className="font-semibold text-sm">{group.caseName}</span>
              </button>

              <div className="flex items-center gap-3 pr-2">
                <Badge variant="secondary" className="text-[10px]">
                  {group.records.length} item{group.records.length !== 1 ? "s" : ""}
                </Badge>

                {onQuickAdd && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover/header:opacity-100 transition-opacity hover:bg-primary/20 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(group.caseId);
                    }}
                    title="Add Evidence to Case"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Case Evidence */}
            <AnimatePresence>
              {!collapsedCases.has(group.caseId) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pl-4 border-l-2 border-primary/20 ml-4"
                >
                  {group.records.map(renderRecord)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Uncased Evidence */}
        {uncased.length > 0 && (
          <div className="space-y-3">
            {caseGroups.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground">Uncategorized Evidence</span>
                <Badge variant="secondary" className="text-[10px]">
                  {uncased.length} item{uncased.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
            <div className="space-y-3">
              {uncased.map(renderRecord)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
