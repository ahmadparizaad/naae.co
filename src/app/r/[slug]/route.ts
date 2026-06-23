import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QRCode } from "@/models/QRCode";
import { ScanEvent } from "@/models/ScanEvent";
import { detectDeviceType } from "@/utils/device-detector";
import { UAParser } from "ua-parser-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const qrCode = await QRCode.findOne({ slug, isActive: true });
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found or inactive" }, { status: 404 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";
    const deviceType = detectDeviceType(userAgent);

    const ua = new UAParser(userAgent);
    const browser = `${ua.getBrowser().name || "Unknown"}${ua.getBrowser().version ? ` ${ua.getBrowser().version}` : ""}`;
    const os = `${ua.getOS().name || "Unknown"}${ua.getOS().version ? ` ${ua.getOS().version}` : ""}`;

    const city = request.headers.get("x-vercel-ip-city") || undefined;
    const country = request.headers.get("x-vercel-ip-country") || undefined;
    const region = request.headers.get("x-vercel-ip-country-region") || undefined;
    const lat = request.headers.get("x-vercel-ip-latitude");
    const lon = request.headers.get("x-vercel-ip-longitude");

    await Promise.all([
      QRCode.updateOne({ _id: qrCode._id }, { $inc: { scanCount: 1 } }),
      ScanEvent.create({
        slug,
        timestamp: new Date(),
        deviceType,
        browser,
        os,
        city,
        country,
        region,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lon ? parseFloat(lon) : undefined,
        userAgent,
        referrer,
      }),
    ]);

    return NextResponse.redirect(qrCode.destination, 302);
  } catch (error) {
    console.error("Error processing redirect:", error);
    return NextResponse.json({ error: "Failed to process redirect" }, { status: 500 });
  }
}