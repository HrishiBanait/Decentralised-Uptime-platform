"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Printer,
  Mail,
  FileCheck,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { downloadReport, type ReportData } from "@/lib/report-generator";
import { getAllEvidence, type StoredEvidence } from "@/lib/evidence-storage";

interface Report {
  id: string;
  fileName: string;
  evidenceName: string;
  generatedDate: string;
  status: "authentic" | "tampered";
  confidence: number;
  format: "PDF" | "DOCX" | "HTML";
  imageData?: string;

  metadata?: {
    camera?: string;
    date?: string;
    location?: string;
    software?: string;
  };
  anomalies?: string[];
  aiDetection?: {
    deepfake: number;
    aiGenerated: number;
    quality: number;
    scamProb: number;
  };
  faceDetection?: {
    faces_detected: number;
    matches: Array<{
      face_number: number;
      match_found: boolean;
      match_info: {
        person_name: string;
        distance: number;
        original_image_base64?: string;
        metadata?: {
          name?: string;
          age?: number;
          email?: string;
          phone?: string;
          notes?: string;
          added_by?: {
            name: string;
            email: string;
          };
        };
      } | null;
      face_image_base64: string;
    }>;
  };
  generatedBy?: {
    name: string;
    email: string;
  };
  sentToAdmin?: boolean;
}

export default function ReportGeneration() {
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<"PDF" | "DOCX" | "HTML">("HTML");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [availableEvidence, setAvailableEvidence] = useState<StoredEvidence[]>([]);

  const loadAvailableEvidence = async () => {
    const evidence = await getAllEvidence();
    // Only show evidence that has been analyzed (status: complete)
    const analyzedEvidence = evidence.filter(e => e.status === "complete");
    setAvailableEvidence(analyzedEvidence);
  };

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({ name: user.name, email: user.email });
    }

    // Load saved reports from localStorage (filtered by current user)
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      try {
        const allReports = JSON.parse(savedReports);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          // Filter reports by current user
          const userReports = allReports.filter((r: Report) => {
            return r.generatedBy?.email === user.email;
          });
          setReports(userReports);
        } else {
          setReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        setReports([]);
      }
    }

    // Load available evidence from storage
    loadAvailableEvidence();

    // Listen for storage changes to refresh evidence list
    const handleStorageChange = () => {
      loadAvailableEvidence();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for changes (for same-window updates)
    const interval = setInterval(() => {
      loadAvailableEvidence();
    }, 5000); // Increased interval to avoid spamming API too much

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const saveReports = (newReports: Report[]) => {
    setReports(newReports);

    // Get all existing reports from localStorage
    const savedReports = localStorage.getItem('generatedReports');
    let allReports: Report[] = [];

    if (savedReports) {
      try {
        allReports = JSON.parse(savedReports);
      } catch {
        allReports = [];
      }
    }

    // Get current user email
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Remove old reports from this user
        allReports = allReports.filter((r: Report) => r.generatedBy?.email !== user.email);
        // Add new reports from this user
        allReports = [...allReports, ...newReports];
        // Save all reports back
        localStorage.setItem('generatedReports', JSON.stringify(allReports));
      } catch {
        // If error, just save the new reports
        localStorage.setItem('generatedReports', JSON.stringify(newReports));
      }
    } else {
      localStorage.setItem('generatedReports', JSON.stringify(newReports));
    }
  };

  const handleGenerateReport = () => {
    if (!selectedEvidence || !currentUser) return;

    setIsGenerating(true);

    // Find the selected evidence from storage
    const evidenceData = availableEvidence.find(e => e.id === selectedEvidence);

    if (!evidenceData || !evidenceData.result) {
      setIsGenerating(false);
      return;
    }

    // Generate report
    setTimeout(() => {
      const status: "authentic" | "tampered" = evidenceData.result === "tampered" ? "tampered" : "authentic";
      const confidence = evidenceData.confidence || 0;

      const newReport: Report = {
        id: Date.now().toString(),
        fileName: `report_${evidenceData.fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.${reportFormat.toLowerCase()}`,
        evidenceName: evidenceData.fileName,
        generatedDate: new Date().toISOString(),
        status,
        confidence,
        format: reportFormat,
        imageData: evidenceData.imageData,
        metadata: evidenceData.metadata,
        anomalies: evidenceData.anomalies,
        aiDetection: evidenceData.aiDetection,
        faceDetection: evidenceData.faceDetection,
        generatedBy: {
          name: currentUser.name,
          email: currentUser.email,
        },
        sentToAdmin: false,
      };

      const updatedReports = [newReport, ...reports];
      saveReports(updatedReports);
      setIsGenerating(false);
      setSelectedEvidence("");
    }, 2000);
  };

  const handleDownload = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    const reportData: ReportData = {
      id: report.id,
      fileName: report.fileName,
      evidenceName: report.evidenceName,
      imageData: report.imageData || "",
      generatedDate: report.generatedDate,
      generatedBy: {
        name: currentUser.name,
        email: currentUser.email,
      },
      status: report.status,
      confidence: report.confidence,
      metadata: report.metadata,
      anomalies: report.anomalies,
      aiDetection: report.aiDetection,
    };

    downloadReport(reportData, report.format === "PDF" ? "PDF" : "HTML");
  };

  const handlePrint = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    const reportData: ReportData = {
      id: report.id,
      fileName: report.fileName,
      evidenceName: report.evidenceName,
      imageData: report.imageData || "",
      generatedDate: report.generatedDate,
      generatedBy: {
        name: currentUser.name,
        email: currentUser.email,
      },
      status: report.status,
      confidence: report.confidence,
      metadata: report.metadata,
      anomalies: report.anomalies,
      aiDetection: report.aiDetection,
    };

    downloadReport(reportData, "PDF");
  };

  const handleSendToAdmin = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    setIsSending(reportId);

    try {
      // Get existing notifications
      const existingNotifications = JSON.parse(
        localStorage.getItem('adminNotifications') || '[]'
      );

      // Prepare full report data for admin
      const fullReportData: ReportData = {
        id: report.id,
        fileName: report.fileName,
        evidenceName: report.evidenceName,
        imageData: report.imageData || "",
        generatedDate: report.generatedDate,
        generatedBy: {
          name: currentUser.name,
          email: currentUser.email,
        },
        status: report.status,
        confidence: report.confidence,
        metadata: report.metadata,
        anomalies: report.anomalies,
      };

      const notification = {
        id: `notif_${Date.now()}`,
        type: 'report',
        title: `New Report: ${report.evidenceName}`,
        message: `Analyst ${currentUser.name} has generated a new verification report for ${report.evidenceName}. Status: ${report.status} (${report.confidence.toFixed(1)}% confidence)`,
        reportId: report.id,
        reportData: {
          fileName: report.fileName,
          evidenceName: report.evidenceName,
          status: report.status,
          confidence: report.confidence,
          generatedDate: report.generatedDate,
          generatedBy: currentUser,
          format: report.format,
        },
        fullReport: fullReportData, // Include complete report data
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

      // Update report to mark as sent
      const updatedReports = reports.map((r) =>
        r.id === reportId ? { ...r, sentToAdmin: true } : r
      );
      saveReports(updatedReports);

      // Trigger storage event for admin portal
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'adminNotifications',
        newValue: JSON.stringify(updatedNotifications),
      }));

      setTimeout(() => {
        setIsSending(null);
      }, 1000);
    } catch (error) {
      console.error('Error sending report to admin:', error);
      setIsSending(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Create a comprehensive verification report for analyzed evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Evidence
              </label>
              <select
                value={selectedEvidence}
                onChange={(e) => setSelectedEvidence(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose evidence file...</option>
                {availableEvidence.length === 0 ? (
                  <option value="" disabled>No analyzed evidence available. Please analyze evidence first.</option>
                ) : (
                  availableEvidence.map((evidence) => (
                    <option key={evidence.id} value={evidence.id}>
                      {evidence.fileName} - {evidence.result === "tampered" ? "Tampered" : "Authentic"} ({evidence.confidence?.toFixed(1)}%)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Format
              </label>
              <div className="flex gap-4">
                {(["PDF", "HTML"] as const).map((format) => (
                  <label
                    key={format}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={reportFormat === format}
                      onChange={() => setReportFormat(format)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!selectedEvidence || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and manage your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet. Create your first report above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{report.fileName}</h3>
                        <Badge variant="outline">{report.format}</Badge>
                        {report.status === "authentic" ? (
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
                        {report.sentToAdmin && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            <Mail className="h-3 w-3 mr-1" />
                            Sent to Admin
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <span>{report.evidenceName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          <span>{report.confidence.toFixed(1)}% confidence</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(report.id)}
                        title="Download"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePrint(report.id)}
                        title="Print"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSendToAdmin(report.id)}
                        title="Send to Admin"
                        disabled={report.sentToAdmin || isSending === report.id}
                        className="hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        {isSending === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
