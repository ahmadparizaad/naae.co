"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CreateQRPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrColor, setQrColor] = useState("#000000");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Name is required"); return; }
    if (!slug.trim()) { setError("Slug is required"); return; }
    if (!destination.trim()) { setError("Destination URL is required"); return; }

    try {
      new URL(destination);
    } catch {
      setError("Invalid destination URL");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("destination", destination);
      formData.append("qrColor", qrColor);
      if (logo) {
        formData.append("logo", logo);
      }

      const response = await fetch("/api/qr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create QR code");
        setIsGenerating(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Failed to create QR code. Please try again.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create QR Code</h1>
        <p className="text-muted-foreground mt-1">Generate a new dynamic QR code for your product</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Ingredients Page"
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium">Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/r/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ingredients"
              className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors font-mono text-sm"
              maxLength={50}
              pattern="^[a-z0-9-]+$"
            />
          </div>
          <p className="text-xs text-muted-foreground">QR URL: {process.env.NEXT_PUBLIC_APP_URL || "https://qr.naae.co"}/r/{slug || "..."}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="block text-sm font-medium">Destination URL</label>
          <input
            id="destination"
            type="url"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="https://naae.co/pages/ingredients"
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="qrColor" className="block text-sm font-medium">QR Code Color</label>
          <div className="flex items-center gap-3">
            <input
              id="qrColor"
              type="color"
              value={qrColor}
              onChange={(e) => setQrColor(e.target.value)}
              className="w-10 h-10 p-0.5 rounded border border-input cursor-pointer"
            />
            <input
              type="text"
              value={qrColor}
              onChange={(e) => setQrColor(e.target.value)}
              placeholder="#000000"
              className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors font-mono text-sm w-32"
              maxLength={7}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="logo" className="block text-sm font-medium">Center Logo (optional)</label>
          <div className="mt-1 flex items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent transition-colors">
              <UploadIcon className="w-4 h-4" />
              Choose Logo
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            {logo && (
              <button
                type="button"
                onClick={() => { setLogo(null); setLogoPreview(null); }}
                className="text-sm text-destructive hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {logoPreview && (
            <div className="mt-3 p-3 bg-secondary rounded-lg inline-block">
              <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Recommended: PNG with transparent background. Max 2MB.</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <GenerateIcon className="w-4 h-4" />
                Generate QR Code
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function GenerateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}