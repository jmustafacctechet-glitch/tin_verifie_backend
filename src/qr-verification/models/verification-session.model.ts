import mongoose, { Schema, Document, Model } from 'mongoose';
import { VerificationStatus } from '../types';
import { IVerificationSession } from './types';

export interface VerificationSessionDocument
  extends IVerificationSession,
    Document {}

const VerificationSessionSchema = new Schema<VerificationSessionDocument>(
  {
    tin: {
      type: String,
      required: [true, 'TIN is required'],
      trim: true,
      maxlength: [50, 'TIN must be at most 50 characters'],
    },
    licenseNo: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      maxlength: [200, 'License number must be at most 200 characters'],
    },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.QR_RECEIVED,
    },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpVerified: { type: Boolean, default: false },
    failureReason: { type: String },
    verificationData: {
      businessName: { type: String },
      licenseStatus: { type: String },
      phone: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

VerificationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
VerificationSessionSchema.index({ status: 1 });
VerificationSessionSchema.index({ createdAt: -1 });

export const VerificationSession: Model<VerificationSessionDocument> =
  mongoose.model<VerificationSessionDocument>(
    'VerificationSession',
    VerificationSessionSchema,
  );
