"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalScans: number;
  todayScans: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  dailyScans: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  locations: Array<{
    city: string;
    country: string;
    region?: string;
    count: number;
    latitude?: number;
    longitude?: number;
  }>;
}

interface QRCodeData {
  _id: string;
  name: string;
  slug: string;
  destination: string;
}

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug: selectedSlug } = use(searchParams);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState(selectedSlug || "");

  useEffect(() => {
    fetch("/api/qr")
      .then((res) => res.json())
      .then((data) => setQrCodes(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/analytics/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleQRChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSlug(e.target.value);
    setAnalytics(null);
  }

  const total = analytics
    ? Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0)
    : 0;

  const maxDailyScan = analytics
    ? Math.max(...Object.values(analytics.dailyScans), 1)
    : 1;

  const dailyEntries = analytics
    ? Object.entries(analytics.dailyScans).sort(([a], [b]) => a.localeCompare(b))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track scan performance of your QR codes</p>
      </div>

      <div className="max-w-sm">
        <select
          value={slug}
          onChange={handleQRChange}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a QR code...</option>
          {qrCodes.map((qr) => (
            <option key={qr._id} value={qr.slug}>
              {qr.name} ({qr.slug})
            </option>
          ))}
        </select>
      </div>

      {!slug && (
        <div className="flex flex-col items-center justify-center min-h-75 text-muted-foreground">
          <ChartIcon className="w-16 h-16 mb-4 opacity-30" />
          <p>Select a QR code to view its analytics</p>
        </div>
      )}

      {loading && slug && (
        <div className="flex items-center justify-center min-h-75">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {analytics && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground font-medium">Total Scans</p>
              <p className="text-4xl font-bold mt-2 font-mono">{analytics.totalScans}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground font-medium">Today</p>
              <p className="text-4xl font-bold mt-2 font-mono">{analytics.todayScans}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground font-medium">Scans (Device)</p>
              <p className="text-4xl font-bold mt-2 font-mono">{total}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">Device</h2>
              <div className="space-y-4">
                {[
                  { label: "Mobile", value: analytics.deviceBreakdown.mobile, color: "bg-blue-500" },
                  { label: "Desktop", value: analytics.deviceBreakdown.desktop, color: "bg-green-500" },
                  { label: "Tablet", value: analytics.deviceBreakdown.tablet, color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-mono text-muted-foreground">{item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">Browser</h2>
              {Object.keys(analytics.browserBreakdown).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(analytics.browserBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([browser, count]) => (
                      <div key={browser}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{browser}</span>
                          <span className="font-mono text-muted-foreground shrink-0 ml-2">{count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No browser data yet</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">OS</h2>
              {Object.keys(analytics.osBreakdown).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(analytics.osBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([os, count]) => (
                      <div key={os}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{os}</span>
                          <span className="font-mono text-muted-foreground shrink-0 ml-2">{count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No OS data yet</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Scans (30 days)</h2>
              {dailyEntries.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {dailyEntries.map(([date, count]) => (
                    <div
                      key={date}
                      className="flex-1 bg-primary/80 hover:bg-primary transition-colors rounded-t relative group"
                      style={{ height: `${(count / maxDailyScan) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                      title={`${date}: ${count} scans`}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No scan data for the past 30 days</p>
              )}
              {dailyEntries.length > 0 && (
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{dailyEntries[0]?.[0]}</span>
                  <span>{dailyEntries[dailyEntries.length - 1]?.[0]}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">Locations</h2>
              {analytics.locations.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.locations.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">📍</span>
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">
                            {[loc.city, loc.region, loc.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground shrink-0 ml-2">{loc.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No location data yet</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Scan Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Scans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dailyEntries.slice(-14).map(([date, count]) => (
                    <tr key={date} className="hover:bg-muted/50">
                      <td className="px-4 py-2">{date}</td>
                      <td className="px-4 py-2 text-right font-mono">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}