import mongoose, { Document, Schema } from "mongoose";

export interface IScanEvent extends Document {
  slug: string;
  timestamp: Date;
  deviceType: "mobile" | "desktop" | "tablet";
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