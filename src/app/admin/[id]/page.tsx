"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QRCodeData {
  _id: string;
  name: string;
  slug: string;
  destination: string;
  isActive: boolean;
  scanCount: number;
  qrPngUrl: string;
  qrSvgUrl: string;
  qrColor?: string;
  createdAt: string;
  updatedAt: string;
}

export default function QRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [qr, setQr] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [destination, setDestination] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [qrColor, setQrColor] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/qr/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setQr(data);
        setDestination(data.destination);
        setIsActive(data.isActive);
        setQrColor(data.qrColor || "#000000");
      })
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function downloadFile(url: string, filename: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Failed to download file");
    }
  }

  async function handleSave() {
    setError(null);
    try {
      new URL(destination);
    } catch {
      setError("Invalid URL");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/qr/${qr!._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, isActive, qrColor }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setQr(updated);
      setEditing(false);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!qr) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block">
            ← Back to QR Codes
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{qr.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile(qr.qrPngUrl, `${qr.slug}.png`)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={() => downloadFile(qr.qrSvgUrl, `${qr.slug}.svg`)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            <SvgIcon className="w-4 h-4" />
            SVG
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-background p-6 space-y-4">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QR URL</label>
                <p className="mt-1 font-mono text-sm break-all">{appUrl}/r/{qr.slug}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug</label>
                <p className="mt-1 font-mono text-sm">{qr.slug}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QR Color</label>
                <p className="mt-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 rounded border border-border" style={{ backgroundColor: qr.qrColor || "#000000" }} />
                  <span className="font-mono text-sm">{qr.qrColor || "#000000"}</span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${qr.isActive ? "bg-green-200 text-green-800 dark:bg-green-800/50 dark:text-green-300" : "bg-destructive/10 text-destructive"}`}>
                    {qr.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</label>
                <p className="mt-1 text-sm">{new Date(qr.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</label>
                <p className="mt-1 text-sm">{new Date(qr.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Destination</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="text-sm text-primary hover:underline"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>
            {editing ? (
              <div className="space-y-3">
                <input
                  type="url"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-input"
                    />
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Color:</label>
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-8 h-8 p-0.5 rounded border border-input cursor-pointer"
                  />
                  <input
                    type="text"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="px-2 py-1 border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm w-28"
                    maxLength={7}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <a
                href={qr.destination}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all flex items-center gap-1"
              >
                {qr.destination}
                <ExternalLinkIcon className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">QR Code Preview</h2>
            <div className="flex flex-col items-center gap-4">
              <img
                src={qr.qrPngUrl}
                alt={`QR Code for ${qr.name}`}
                className="w-48 h-48 rounded-lg border border-border"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile(qr.qrPngUrl, `${qr.slug}.png`)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download PNG
                </button>
                <button
                  onClick={() => downloadFile(qr.qrSvgUrl, `${qr.slug}.svg`)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <SvgIcon className="w-4 h-4" />
                  Download SVG
                </button>
              </div>
            </div>
          </div>

          <Link
            href={`/admin/analytics?slug=${qr.slug}`}
            className="block rounded-lg border border-border bg-background p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Analytics</h2>
                <p className="text-3xl font-bold mt-2 font-mono">{qr.scanCount || 0}</p>
                <p className="text-sm text-muted-foreground">total scans</p>
              </div>
              <ChartIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function SvgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}