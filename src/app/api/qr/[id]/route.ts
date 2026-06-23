import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QRCode } from "@/models/QRCode";
import { ScanEvent } from "@/models/ScanEvent";
import { generateQRCode } from "@/utils/qr-generator";
import { validateUrl, validateHexColor } from "@/utils/validation";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const qrCode = await QRCode.findById(id).lean();
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json(qrCode);
  } catch (error) {
    console.error("Error fetching QR code:", error);
    return NextResponse.json({ error: "Failed to fetch QR code" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const qrCode = await QRCode.findById(id).lean();
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const body = await request.json();
    const { destination, isActive, qrColor } = body;

    const updateFields: Record<string, unknown> = {};

    if (destination !== undefined) {
      const urlValidation = validateUrl(destination);
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error }, { status: 400 });
      }
      updateFields.destination = destination;
    }

    if (isActive !== undefined) {
      updateFields.isActive = isActive;
    }

    if (qrColor !== undefined) {
      const colorValidation = validateHexColor(qrColor);
      if (!colorValidation.valid) {
        return NextResponse.json({ error: colorValidation.error }, { status: 400 });
      }
      updateFields.qrColor = qrColor;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const qrUrl = `${appUrl}/r/${qrCode.slug}`;
      const { pngUrl, svgUrl } = await generateQRCode(qrUrl, qrCode.slug, qrColor);
      updateFields.qrPngUrl = pngUrl;
      updateFields.qrSvgUrl = svgUrl;
    }

    const updated = await QRCode.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating QR code:", error);
    return NextResponse.json({ error: "Failed to update QR code" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const qrCode = await QRCode.findByIdAndDelete(id);
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    await ScanEvent.deleteMany({ slug: qrCode.slug });

    return NextResponse.json({ message: "QR code deleted successfully" });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 });
  }
}