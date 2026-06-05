"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import {
  Shield, ShieldAlert, ShieldCheck,
  Loader2, Crosshair, AlertTriangle, CheckCircle2,
  Target, Info, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────
interface WeaponDetection {
  class:      string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}
interface WeaponResult {
  weaponsFound:     boolean;
  weaponsDetected:  string[];
  detections:       WeaponDetection[];
  anomalies:        string[];
  totalDetections:  number;
  rawResult:        object | null;
}

// ── Per-class styling ─────────────────────────────────────────
const WEAPON_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Pistol:  { emoji: "🔫", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  Knife:   { emoji: "🔪", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30"   },
  Rifle:   { emoji: "💥", color: "text-red-600",    bg: "bg-red-700/10",    border: "border-red-700/30"   },
  Grenade: { emoji: "💣", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30"},
  Missile: { emoji: "🚀", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30"},
  Unknown: { emoji: "⚠️",  color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30"  },
};
const getMeta = (cls: string) => WEAPON_META[cls] ?? WEAPON_META.Unknown;

// ── Confidence bar ────────────────────────────────────────────
function ConfBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-red-500" : value >= 50 ? "bg-orange-500" : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono w-12 text-right text-muted-foreground">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  Main Component
// ════════════════════════════════════════════════════════════
export default function WeaponDetection() {
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [scanning,   setScanning]   = useState(false);
  const [result,     setResult]     = useState<WeaponResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [showRaw,    setShowRaw]    = useState(false);

  // ── pick file ───────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const clearFile = () => { setFile(null); setPreview(null); setResult(null); setError(null); };

  // ── run scan ─────────────────────────────────────────────
  const runScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/weapon-detection", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.details || data.error || "Detection failed");
      setResult({
        weaponsFound:    data.weaponsFound    ?? false,
        weaponsDetected: data.weaponsDetected ?? [],
        detections:      data.detections      ?? [],
        anomalies:       data.anomalies       ?? [],
        totalDetections: data.totalDetections ?? 0,
        rawResult:       data.rawResult       ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setScanning(false);
    }
  };

  const verdictCls = result
    ? result.weaponsFound
      ? "bg-gradient-to-br from-red-900/30 to-red-950/10 border-red-700/40"
      : "bg-gradient-to-br from-green-900/30 to-green-950/10 border-green-700/40"
    : "";

  // ════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ── Upload card ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-base">Weapon Detection</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                AI-powered detection · Pistol · Knife · Rifle · Grenade · Missile
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* file picker / preview */}
          {file ? (
            <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg border border-border">
              {preview && (
                <img src={preview} alt="preview"
                  className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>Change</Button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center
                              hover:border-red-500/40 hover:bg-red-500/5 transition-all">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center
                                justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-foreground">Click to upload image</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG · PNG · WebP up to 10 MB</p>
              </div>
            </label>
          )}

          {/* scan button */}
          <Button
            id="weapon-scan-btn"
            onClick={runScan}
            disabled={!file || scanning}
            className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white py-5 text-sm
                       font-semibold shadow-lg disabled:opacity-50"
          >
            {scanning
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning for weapons…</>
              : <><Crosshair className="h-4 w-4" /> Run Weapon Detection</>}
          </Button>

          {/* info strip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5
                          border border-blue-500/20 text-xs text-blue-400">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Powered by Roboflow&nbsp;
              <code className="font-mono">general-segmentation-api</code>
              &nbsp;— workspace&nbsp;<code className="font-mono">shreyas-deshmukh</code>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Scanning spinner ──────────────────────────── */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="py-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                    <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30
                                    flex items-center justify-center">
                      <Crosshair className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Scanning image…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Roboflow AI is analysing for weapons — this may take a few seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Detection failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results ──────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* verdict banner */}
            <Card className={`border ${verdictCls}`}>
              <CardContent className="py-5">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center
                                   flex-shrink-0 border ${
                    result.weaponsFound
                      ? "bg-red-500/20 border-red-500/30"
                      : "bg-green-500/20 border-green-500/30"
                  }`}>
                    {result.weaponsFound
                      ? <ShieldAlert className="h-7 w-7 text-red-400" />
                      : <ShieldCheck  className="h-7 w-7 text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-lg font-bold ${
                        result.weaponsFound ? "text-red-300" : "text-green-300"
                      }`}>
                        {result.weaponsFound ? "Weapon(s) Detected" : "No Weapons Found"}
                      </h3>
                      <Badge variant="outline"
                        className={result.weaponsFound
                          ? "border-red-500/40 text-red-400 bg-red-500/10"
                          : "border-green-500/40 text-green-400 bg-green-500/10"}
                      >
                        {result.totalDetections} detection{result.totalDetections !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.weaponsFound
                        ? `Found: ${result.weaponsDetected.join(", ")}`
                        : "Image is clear of all tracked weapon classes"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* detection list */}
            {result.detections.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-red-500" />
                    Detected Objects ({result.totalDetections})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.detections.map((det, i) => {
                    const meta = getMeta(det.class);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border
                                    ${meta.bg} ${meta.border}`}
                      >
                        <span className="text-2xl">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`font-semibold text-sm ${meta.color}`}>{det.class}</span>
                          <ConfBar value={det.confidence} />
                        </div>
                        <Badge variant="outline"
                          className={`text-xs ${meta.border} ${meta.color} ${meta.bg}`}>
                          {det.confidence.toFixed(1)}%
                        </Badge>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* anomaly list / clean message */}
            {result.anomalies.length > 0 ? (
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" /> Forensic Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.anomalies.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-500/20">
                <CardContent className="py-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-400 font-medium">
                    No weapon-related anomalies flagged.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* weapon class coverage badges */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Scanned Weapon Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(WEAPON_META)
                    .filter(([k]) => k !== "Unknown")
                    .map(([cls, meta]) => {
                      const found = result.weaponsDetected.includes(cls);
                      return (
                        <Badge key={cls} variant="outline"
                          className={`gap-1.5 text-xs px-3 py-1 ${
                            found
                              ? `${meta.bg} ${meta.border} ${meta.color}`
                              : "text-muted-foreground border-border/50"
                          }`}
                        >
                          <span>{meta.emoji}</span>
                          {cls}
                          {found && (
                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-current inline-block" />
                          )}
                        </Badge>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* raw JSON collapsible */}
            {result.rawResult && (
              <Card className="border-border/40">
                <button
                  onClick={() => setShowRaw(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs
                             text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">Raw Roboflow Response</span>
                  {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {showRaw && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 pb-4">
                        <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3
                                        overflow-x-auto text-muted-foreground max-h-64">
                          {JSON.stringify(result.rawResult, null, 2)}
                        </pre>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
