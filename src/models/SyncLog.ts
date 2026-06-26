import mongoose, { Schema, type Document as MongoDocument, type Model, type Types } from 'mongoose';

export interface ISyncLogDocument extends MongoDocument {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  clientId: string;
  operation: 'update' | 'sync' | 'restore';
  payloadSizeBytes: number;
  appliedAt: Date;
  status: 'success' | 'failed';
}

const SyncLogSchema = new Schema<ISyncLogDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      enum: ['update', 'sync', 'restore'],
      required: true,
    },
    payloadSizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
  },
  {
    timestamps: false,
  },
);

SyncLogSchema.index({ documentId: 1, appliedAt: -1 });

const SyncLog: Model<ISyncLogDocument> =
  mongoose.models.SyncLog || mongoose.model<ISyncLogDocument>('SyncLog', SyncLogSchema);

export default SyncLog;
