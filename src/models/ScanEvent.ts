import mongoose, { Document, Schema } from "mongoose";

export interface IScanEvent extends Document {
  slug: string;
  timestamp: Date;
  deviceType: "mobile" | "desktop" | "tablet";
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  userAgent: string;
  referrer?: string;
}

const ScanEventSchema = new Schema<IScanEvent>(
  {
    slug: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet"],
      required: true,
    },
    browser: { type: String, trim: true },
    os: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    region: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    userAgent: {
      type: String,
      required: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

ScanEventSchema.index({ slug: 1, timestamp: -1 });

export const ScanEvent = mongoose.models.ScanEvent || mongoose.model<IScanEvent>("ScanEvent", ScanEventSchema);