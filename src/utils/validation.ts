export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: "Slug is required" };
  }

  if (slug.length > 50) {
    return { valid: false, error: "Slug must be 50 characters or less" };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: "Slug can only contain lowercase letters, numbers, and hyphens" };
  }

  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { valid: false, error: "Slug cannot start or end with a hyphen" };
  }

  return { valid: true };
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL is required" };
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }
    if (url.length > 500) {
      return { valid: false, error: "URL must be 500 characters or less" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }

  if (name.length > 100) {
    return { valid: false, error: "Name must be 100 characters or less" };
  }

  return { valid: true };
}

export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024;
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

  if (!file) {
    return { valid: true };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "Logo file must be less than 2MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Logo must be PNG, JPEG, SVG, or WebP format" };
  }

  return { valid: true };
}