import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QRCode } from "@/models/QRCode";
import { generateQRCode, generateQRWithLogo } from "@/utils/qr-generator";
import { validateSlug, validateUrl, validateName, validateLogoFile, validateHexColor } from "@/utils/validation";

export const maxDuration = 30;

export async function GET() {
  try {
    await connectDB();
    const qrCodes = await QRCode.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const destination = formData.get("destination") as string;
    const qrColor = (formData.get("qrColor") as string) || "#000000";
    const logoFile = formData.get("logo") as File | null;

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json({ error: slugValidation.error }, { status: 400 });
    }

    const urlValidation = validateUrl(destination);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    const colorValidation = validateHexColor(qrColor);
    if (!colorValidation.valid) {
      return NextResponse.json({ error: colorValidation.error }, { status: 400 });
    }

    if (logoFile) {
      const logoValidation = validateLogoFile(logoFile);
      if (!logoValidation.valid) {
        return NextResponse.json({ error: logoValidation.error }, { status: 400 });
      }
    }

    const existingQR = await QRCode.findOne({ slug });
    if (existingQR) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const qrUrl = `${appUrl}/r/${slug}`;

    let logoBuffer: Buffer | undefined;
    if (logoFile) {
      const arrayBuffer = await logoFile.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
    }

    const { pngUrl, svgUrl, logoUrl } = logoBuffer
      ? await generateQRWithLogo(qrUrl, slug, logoBuffer, qrColor)
      : await generateQRCode(qrUrl, slug, qrColor);

    const qrCode = await QRCode.create({
      name,
      slug,
      destination,
      qrPngUrl: pngUrl,
      qrSvgUrl: svgUrl,
      logoUrl,
      qrColor,
    });

    return NextResponse.json({
      id: qrCode._id.toString(),
      slug: qrCode.slug,
      qrUrl,
      pngUrl: qrCode.qrPngUrl,
      svgUrl: qrCode.qrSvgUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating QR code:", error);
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 });
  }
}