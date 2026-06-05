"use client";

/**
 * blockchain-upload.tsx
 *
 * Self-contained page that:
 *  1. Connects to MetaMask (ethers v6 BrowserProvider)
 *  2. Uploads a file to a local IPFS daemon (IpfsHttpClient UMD / kubo-rpc-client)
 *  3. Stores the resulting CID on the ImageStorage / HashStorage smart contract
 *
 * Logic merged from:
 *  - config.js   → CONTRACT_ADDRESS, network constants, ABI
 *  - main.js     → connectWallet(), ensureIpfsClient(), uploadAndStore()
 *
 * Environment variables (add to .env.local):
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
 *   NEXT_PUBLIC_NETWORK=localhost
 *   NEXT_PUBLIC_IPFS_API_URL=http://127.0.0.1:5001/api/v0
 */

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Upload,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Copy,
  Image as ImageIcon,
  Wallet,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & Declarations
// ---------------------------------------------------------------------------

/**
 * Augment Window with globals that are NOT already declared elsewhere.
 *
 * NOTE: web3-service.ts declares `Window.ethereum` as `any`.
 * We must mirror that exact type here – TypeScript requires all interface
 * augmentations of the same property to agree on the type (TS2687 / TS2717).
 * We therefore keep `ethereum?: any` and use explicit `as` casts at the call
 * sites rather than narrowing it here.
 */
declare global {
  interface Window {
    // Must stay `any` to match web3-service.ts's existing declaration.
    ethereum: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /** Populated by ethers CDN build (not declared in web3-service.ts). */
    ethers?: {
      BrowserProvider: new (provider: any) => EthersProvider; // eslint-disable-line @typescript-eslint/no-explicit-any
      Contract: new (
        address: string,
        abi: ContractABI[],
        signerOrProvider: EthersSigner
      ) => EthersContract;
    };
    /** Populated by ipfs-http-client / kubo-rpc-client UMD build. */
    IpfsHttpClient?: {
      create: (options: { url: string }) => IpfsClient;
    };
    /** Written by the Hardhat deploy script for backwards-compat. */
    APP_CONFIG?: {
      contractAddress?: string;
      network?: string;
    };
  }
}

// Lightweight structural types so we don't need the full ethers type package
interface EthersProvider {
  getSigner: () => Promise<EthersSigner>;
}
interface EthersSigner {
  getAddress: () => Promise<string>;
}
interface EthersContract {
  storeHash: (cid: string) => Promise<EthersTx>;
}
interface EthersTx {
  wait: () => Promise<EthersReceipt>;
}
interface EthersReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
}
interface IpfsClient {
  add: (
    data: ArrayBuffer
  ) => Promise<{ path?: string; cid?: { toString(): string }; toString(): string }>;
}
type ContractABI = Record<string, unknown>;

// ---------------------------------------------------------------------------
// ── Config (merged from config.js) ─────────────────────────────────────────
// ---------------------------------------------------------------------------

/**
 * Contract address resolution order:
 *  1. NEXT_PUBLIC_CONTRACT_ADDRESS env var  (recommended for Next.js)
 *  2. window.APP_CONFIG.contractAddress     (legacy deploy-script injection)
 *  3. Hard-coded fallback matching config.js default
 */
const RESOLVED_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const IPFS_API_URL =
  process.env.NEXT_PUBLIC_IPFS_API_URL ?? "http://127.0.0.1:5001/api/v0";

// ---------------------------------------------------------------------------
// ── ABI (merged from main.js – CONTRACT_ABI) ───────────────────────────────
// ---------------------------------------------------------------------------

const CONTRACT_ABI: ContractABI[] = [
  {
    inputs: [{ internalType: "string", name: "_hash", type: "string" }],
    name: "storeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "hash", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "HashStored",
    type: "event",
  },
];

// ---------------------------------------------------------------------------
// ── IPFS helper (merged from main.js – ensureIpfsClient / uploadAndStore) ──
// ---------------------------------------------------------------------------

/** Module-level singleton so the client is reused across renders (mirrors the
 *  `let ipfsClient` variable in main.js). */
let ipfsClient: IpfsClient | null = null;

async function ensureIpfsClient(): Promise<IpfsClient> {
  if (!ipfsClient) {
    const IpfsHttpClient = window.IpfsHttpClient;
    if (!IpfsHttpClient) {
      throw new Error(
        "IpfsHttpClient is not available. " +
          "Add the kubo-rpc-client (or ipfs-http-client) UMD script to your page, " +
          "or install it as an npm package and import it at the top of this file."
      );
    }
    ipfsClient = IpfsHttpClient.create({ url: IPFS_API_URL });
  }
  return ipfsClient;
}

/** Upload a File to the local IPFS daemon and return its CID string.
 *  Replaces the inline upload logic inside uploadAndStore() in main.js. */
async function uploadToIPFS(file: File): Promise<string> {
  const client = await ensureIpfsClient();
  const arrayBuffer = await file.arrayBuffer();
  const result = await client.add(arrayBuffer);
  // Normalise across different kubo-rpc-client / ipfs-http-client versions
  const cid =
    result.path ?? result.cid?.toString() ?? result.toString();
  return cid;
}

// ---------------------------------------------------------------------------
// ── Wallet & contract helpers (merged from main.js – connectWallet()) ──────
// ---------------------------------------------------------------------------

/** Mirrors main.js connectWallet() but returns the address instead of
 *  writing to DOM elements, and resolves the contract address from env /
 *  APP_CONFIG / fallback. */
async function connectWallet(): Promise<{
  address: string;
  signer: EthersSigner;
  contract: EthersContract;
}> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask not detected. Please install MetaMask and refresh the page."
    );
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const ethers = window.ethers;
  if (!ethers) {
    throw new Error(
      "ethers.js is not available. " +
        "Add the ethers UMD script to your page or install it as an npm package."
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Prefer env var, fall back to deploy-script injection, then hard-coded default
  const contractAddress =
    RESOLVED_CONTRACT_ADDRESS ||
    window.APP_CONFIG?.contractAddress;

  if (!contractAddress) {
    throw new Error(
      "Contract address not found. " +
        "Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local or run `npm run hardhat:deploy` and refresh."
    );
  }

  const contract = new ethers.Contract(
    contractAddress,
    CONTRACT_ABI,
    signer
  );

  const address = await signer.getAddress();
  return { address, signer, contract };
}

/** Store evidence metadata + CID on-chain.
 *  The base contract only exposes storeHash(string), so the CID is the
 *  primary on-chain payload; analyst metadata lives off-chain / in the record. */
async function storeEvidenceOnBlockchain(
  cid: string,
  contract: EthersContract
): Promise<EthersReceipt> {
  const tx = await contract.storeHash(cid);
  const receipt = await tx.wait();
  return receipt;
}

// ---------------------------------------------------------------------------
// ── Component types ─────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

interface BlockchainRecord {
  id: string;
  fileName: string;
  ipfsCid: string;
  txHash: string;
  blockNumber: number;
  walletAddress: string;
  uploadDate: string;
  status: "confirmed" | "uploading" | "failed";
  analystId?: string;
  confidenceScore?: number;
  evidenceStatus?: string;
}

interface BlockchainUploadProps {
  currentUser?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    userType: string;
  };
}

// ---------------------------------------------------------------------------
// ── Component ────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

export default function BlockchainUpload({ currentUser }: BlockchainUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [records, setRecords] = useState<BlockchainRecord[]>([]);

  // Metadata for blockchain storage
  const [confidence, setConfidence] = useState<number>(100);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  // Keep a reference to the connected contract so reconnection is not needed
  // on every upload (mirrors the module-level `contract` / `signer` in main.js)
  const contractRef = useRef<EthersContract | null>(null);
  const signerRef = useRef<EthersSigner | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function setStatus(msg: string | null): void {
    setStatusMsg(msg);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  // ── Wallet connection (mirrors main.js connectWallet + connectBtn listener)

  const handleConnectWallet = async () => {
    try {
      setStatus("Connecting to MetaMask…");
      const { address, signer, contract } = await connectWallet();
      signerRef.current = signer;
      contractRef.current = contract;
      setWalletAddress(address);
      setStatus(`Connected as ${address}`);
      // Clear the status after a short delay so the address badge takes over
      setTimeout(() => setStatus(null), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`❌ Wallet error: ${msg}`);
    }
  };

  // ── Main upload flow (mirrors main.js uploadAndStore + uploadBtn listener) ─

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Optimistic record while uploading
    const tempId = Date.now().toString();
    const optimistic: BlockchainRecord = {
      id: tempId,
      fileName: selectedFile.name,
      ipfsCid: "—",
      txHash: "—",
      blockNumber: 0,
      walletAddress: walletAddress ?? "—",
      uploadDate: new Date().toLocaleString(),
      status: "uploading",
    };
    setRecords((prev) => [optimistic, ...prev]);

    try {
      // 1. Ensure wallet connected (mirrors main.js guard at top of uploadAndStore)
      let address = walletAddress;
      if (!address || !contractRef.current) {
        setStatus("Connecting wallet…");
        const result = await connectWallet();
        address = result.address;
        signerRef.current = result.signer;
        contractRef.current = result.contract;
        setWalletAddress(address);
      }

      // 2. Upload to local IPFS (mirrors main.js ensureIpfsClient + client.add)
      setStatus("Uploading image to IPFS via local daemon…");
      const cid = await uploadToIPFS(selectedFile);

      setStatus(
        `Image uploaded to IPFS.\nCID: ${cid}\nSending transaction to store CID on blockchain…`
      );

      // 3. Store CID on ImageStorage contract (mirrors main.js contract.storeHash)
      const evStatus = isTampered ? "Tampered" : "Authentic";
      const analystId =
        currentUser?._id || currentUser?.id || "unknown_analyst";

      const receipt = await storeEvidenceOnBlockchain(
        cid,
        contractRef.current!
      );

      // 4. Update record with real data (mirrors main.js receipt handling)
      const confirmed: BlockchainRecord = {
        id: tempId,
        fileName: selectedFile.name,
        ipfsCid: cid,
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        walletAddress: address!,
        uploadDate: new Date().toLocaleString(),
        status: "confirmed",
        analystId,
        confidenceScore: confidence,
        evidenceStatus: evStatus,
      };
      setRecords((prev) =>
        prev.map((r) => (r.id === tempId ? confirmed : r))
      );
      setStatus("✅ Successfully stored on blockchain!");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === tempId ? { ...r, status: "failed" as const } : r
        )
      );
      setStatus(`❌ Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Wallet + Upload Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image to IPFS &amp; Blockchain</CardTitle>
          <CardDescription>
            Uploads your image to a local IPFS node, then stores the CID on the
            ImageStorage smart contract via MetaMask.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet */}
          <div className="flex items-center gap-3">
            {walletAddress ? (
              <Badge variant="outline" className="gap-1 py-1 px-3 font-mono text-xs">
                <Wallet className="h-3 w-3" />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnectWallet}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
            )}
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Image File
            </label>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-40 rounded object-contain mb-2"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {selectedFile
                  ? selectedFile.name
                  : "Click to browse or drop an image here"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confidence Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-sm font-mono w-8">{confidence}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verification Status
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant={isTampered ? "outline" : "default"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setIsTampered(false)}
                >
                  Authentic
                </Button>
                <Button
                  variant={isTampered ? "destructive" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setIsTampered(true)}
                >
                  Tampered
                </Button>
              </div>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              {statusMsg.startsWith("❌") ? (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <Clock className="h-4 w-4 animate-spin shrink-0" />
              )}
              {statusMsg}
            </motion.p>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload &amp; Store on Blockchain
              </>
            )}
          </Button>

          {/* Prerequisites note */}
          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            <strong>Prerequisites:</strong> Run{" "}
            <code className="bg-muted px-1 rounded">ipfs daemon</code> and{" "}
            <code className="bg-muted px-1 rounded">npx hardhat node</code> in
            separate terminals, deploy the contract with{" "}
            <code className="bg-muted px-1 rounded">
              npx hardhat run scripts/deploy.js --network localhost
            </code>
            , and connect MetaMask to Localhost 8545. Set{" "}
            <code className="bg-muted px-1 rounded">
              NEXT_PUBLIC_CONTRACT_ADDRESS
            </code>{" "}
            in <code className="bg-muted px-1 rounded">.env.local</code>.
          </p>
        </CardContent>
      </Card>

      {/* Transaction Records */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>On-Chain Records</CardTitle>
            <CardDescription>
              Real transactions stored on the local Hardhat node via ImageStorage
              contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate flex-1">
                      {record.fileName}
                    </span>
                    {record.status === "confirmed" && (
                      <Badge className="bg-green-500 text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed
                      </Badge>
                    )}
                    {record.status === "uploading" && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {record.status === "failed" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  {record.status === "confirmed" && (
                    <div className="space-y-2 text-sm">
                      {/* IPFS CID */}
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">IPFS CID:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                          {record.ipfsCid}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.ipfsCid)}
                          title="Copy CID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://ipfs.io/ipfs/${record.ipfsCid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          View
                        </a>
                      </div>

                      {/* Tx Hash */}
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Tx Hash:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                          {record.txHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.txHash)}
                          title="Copy tx hash"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Evidence metadata */}
                      {(record.analystId || record.confidenceScore !== undefined || record.evidenceStatus) && (
                        <div className="grid grid-cols-3 gap-4 pt-1 text-xs bg-muted/30 rounded-lg p-3">
                          {record.analystId && (
                            <div>
                              <p className="text-muted-foreground">Analyst ID</p>
                              <p className="font-medium font-mono truncate">{record.analystId}</p>
                            </div>
                          )}
                          {record.confidenceScore !== undefined && (
                            <div>
                              <p className="text-muted-foreground">Confidence</p>
                              <p className="font-medium">{record.confidenceScore}%</p>
                            </div>
                          )}
                          {record.evidenceStatus && (
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className={`font-medium ${record.evidenceStatus === "Tampered" ? "text-destructive" : "text-green-600"}`}>
                                {record.evidenceStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata row */}
                      <div className="grid grid-cols-3 gap-4 pt-1 text-xs">
                        <div>
                          <p className="text-muted-foreground">Block</p>
                          <p className="font-medium">
                            {record.blockNumber.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wallet</p>
                          <p className="font-medium font-mono">
                            {record.walletAddress.slice(0, 8)}…
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{record.uploadDate}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. IPFS Upload:</strong> The
              image file is uploaded to your local IPFS node via the HTTP API
              at{" "}
              <code className="bg-muted px-1 rounded">
                http://127.0.0.1:5001
              </code>
              . IPFS returns a unique content-addressed CID.
            </p>
            <p>
              <strong className="text-foreground">2. On-Chain Storage:</strong>{" "}
              The CID is sent to the{" "}
              <code className="bg-muted px-1 rounded">storeHash()</code>{" "}
              function of the{" "}
              <code className="bg-muted px-1 rounded">ImageStorage</code>{" "}
              Solidity contract running on the local Hardhat blockchain node.
            </p>
            <p>
              <strong className="text-foreground">
                3. Immutable Reference:
              </strong>{" "}
              The transaction is mined and produces a cryptographic hash linking
              the file to the wallet address — providing tamper-proof proof of
              the image at that point in time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}