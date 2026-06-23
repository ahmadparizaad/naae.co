import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ScanEvent } from "@/models/ScanEvent";
import { QRCode } from "@/models/QRCode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const qrCode = await QRCode.findOne({ slug }).lean();
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalScans, todayScans, deviceBreakdown, dailyScans] = await Promise.all([
      ScanEvent.countDocuments({ slug }),
      ScanEvent.countDocuments({
        slug,
        timestamp: { $gte: today, $lt: tomorrow },
      }),
      ScanEvent.aggregate([
        { $match: { slug } },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      ]),
      ScanEvent.aggregate([
        {
          $match: {
            slug,
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const deviceStats = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };

    deviceBreakdown.forEach((item) => {
      if (item._id in deviceStats) {
        deviceStats[item._id as keyof typeof deviceStats] = item.count;
      }
    });

    const dailyScanData: Record<string, number> = {};
    dailyScans.forEach((item) => {
      dailyScanData[item._id] = item.count;
    });

    return NextResponse.json({
      totalScans,
      todayScans,
      deviceBreakdown: deviceStats,
      dailyScans: dailyScanData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}