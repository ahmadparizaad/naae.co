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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalScans,
      todayScans,
      deviceBreakdown,
      dailyScans,
      browserBreakdown,
      osBreakdown,
      recentLocations,
    ] = await Promise.all([
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
        { $match: { slug, timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ScanEvent.aggregate([
        { $match: { slug, browser: { $exists: true, $ne: null } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ScanEvent.aggregate([
        { $match: { slug, os: { $exists: true, $ne: null } } },
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ScanEvent.aggregate([
        { $match: { slug, city: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { city: "$city", country: "$country", region: "$region" },
            count: { $sum: 1 },
            latitude: { $first: "$latitude" },
            longitude: { $first: "$longitude" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const deviceStats = { mobile: 0, desktop: 0, tablet: 0 };
    deviceBreakdown.forEach((item) => {
      if (item._id in deviceStats) {
        deviceStats[item._id as keyof typeof deviceStats] = item.count;
      }
    });

    const dailyScanData: Record<string, number> = {};
    dailyScans.forEach((item) => {
      dailyScanData[item._id] = item.count;
    });

    const browserStats: Record<string, number> = {};
    browserBreakdown.forEach((item) => {
      browserStats[item._id] = item.count;
    });

    const osStats: Record<string, number> = {};
    osBreakdown.forEach((item) => {
      osStats[item._id] = item.count;
    });

    const locations = recentLocations.map((item) => ({
      city: item._id.city,
      country: item._id.country,
      region: item._id.region,
      count: item.count,
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    return NextResponse.json({
      totalScans,
      todayScans,
      deviceBreakdown: deviceStats,
      dailyScans: dailyScanData,
      browserBreakdown: browserStats,
      osBreakdown: osStats,
      locations,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}