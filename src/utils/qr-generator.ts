import QRCode from "qrcode";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const QR_SIZE = 1000;
const LOGO_SIZE_RATIO = 0.2;
const QUIET_ZONE = 4;
const ERROR_CORRECTION_LEVEL: "H" = "H";

export interface QRGenerationResult {
  pngUrl: string;
  svgUrl: string;
  logoUrl?: string;
}

async function uploadToCloudinary(buffer: Buffer, folder: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error("Failed to upload to Cloudinary"));
          }
        }
      )
      .end(buffer);
  });
}

async function uploadSvgToCloudinary(svgString: string, folder: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          format: "svg",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error("Failed to upload SVG to Cloudinary"));
          }
        }
      )
      .end(Buffer.from(svgString));
  });
}

export async function generateQRWithLogo(
  data: string,
  slug: string,
  logoBuffer?: Buffer,
  darkColor: string = "#000000"
): Promise<QRGenerationResult> {
  const qrOptions = {
    errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
    margin: QUIET_ZONE,
    width: QR_SIZE,
    color: {
      dark: darkColor,
      light: "#FFFFFF",
    },
  };

  const svgString = await QRCode.toString(data, {
    ...qrOptions,
    type: "svg",
  });

  let pngBuffer = await QRCode.toBuffer(data, {
    ...qrOptions,
    type: "png",
  });

  if (logoBuffer) {
    const logoSize = Math.round(QR_SIZE * LOGO_SIZE_RATIO);
    const padding = Math.round(logoSize * 0.15);

    const processedLogo = await sharp(logoBuffer)
      .resize(logoSize - padding * 2, logoSize - padding * 2, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const logoWithPadding = await sharp({
      create: {
        width: logoSize,
        height: logoSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: processedLogo,
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    const qrImage = sharp(pngBuffer);
    const qrMetadata = await qrImage.metadata();

    const compositeResult = await qrImage
      .composite([
        {
          input: logoWithPadding,
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    pngBuffer = compositeResult;
  }

  const timestamp = Date.now();
  const pngPublicId = `qr/${slug}/${slug}-${timestamp}`;
  const svgPublicId = `qr/${slug}/${slug}-${timestamp}`;
  const logoPublicId = logoBuffer ? `logos/${slug}/${slug}-${timestamp}` : undefined;

  const uploads: Promise<string>[] = [
    uploadToCloudinary(pngBuffer, "naae-qr", pngPublicId),
    uploadSvgToCloudinary(svgString, "naae-qr", svgPublicId),
  ];

  if (logoBuffer && logoPublicId) {
    uploads.push(uploadToCloudinary(logoBuffer, "naae-qr", logoPublicId));
  }

  const [pngUrl, svgUrl, logoUrl] = await Promise.all(uploads);

  return { pngUrl, svgUrl, logoUrl };
}

export async function generateQRCode(
  data: string,
  slug: string,
  darkColor: string = "#000000"
): Promise<QRGenerationResult> {
  return generateQRWithLogo(data, slug, undefined, darkColor);
}