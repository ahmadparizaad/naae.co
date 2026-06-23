export type DeviceType = "mobile" | "desktop" | "tablet";

export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  if (/tablet|ipad|playbook|silk|kindle|android(?!.*mobile)/i.test(ua)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|opera mini|blackberry|webos|iemobile/i.test(ua)
  ) {
    return "mobile";
  }

  return "desktop";
}