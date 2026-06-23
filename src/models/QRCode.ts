import mongoose, { Document, Schema } from "mongoose";

export interface IQRCode extends Document {
  name: string;
  slug: string;
  destination: string;
  isActive: boolean;
  scanCount: number;
  qrPngUrl: string;
  qrSvgUrl: string;
  logoUrl?: string;
  qrColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
      maxlength: 50,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    qrPngUrl: {
      type: String,
      required: true,
    },
    qrSvgUrl: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    qrColor: {
      type: String,
      default: "#000000",
      match: /^#[0-9A-Fa-f]{6}$/,
    },
  },
  {
    timestamps: true,
  }
);

QRCodeSchema.index({ slug: 1 }, { unique: true });

export const QRCode = mongoose.models.QRCode || mongoose.model<IQRCode>("QRCode", QRCodeSchema);