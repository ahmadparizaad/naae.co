import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QRCode } from "@/models/QRCode";
import { ScanEvent } from "@/models/ScanEvent";
import { detectDeviceType } from "@/utils/device-detector";

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

    await Promise.all([
      QRCode.updateOne({ _id: qrCode._id }, { $inc: { scanCount: 1 } }),
      ScanEvent.create({
        slug,
        timestamp: new Date(),
        deviceType,
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