import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AuditLogDocument extends Document {
  sessionId?: string;
  tin?: string;
  licenseNo?: string;
  result: string;
  failureReason?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    sessionId: { type: String, index: true },
    tin: { type: String },
    licenseNo: { type: String },
    result: {
      type: String,
      required: [true, 'Audit result is required'],
    },
    failureReason: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  },
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ tin: 1, timestamp: -1 });

export const AuditLog: Model<AuditLogDocument> = mongoose.model<AuditLogDocument>(
  'AuditLog',
  AuditLogSchema,
);
