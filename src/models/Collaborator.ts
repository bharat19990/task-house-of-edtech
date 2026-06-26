import mongoose, { Schema, type Document as MongoDocument, type Model, type Types } from 'mongoose';
import type { CollaboratorRole } from '@/types/collaborator';

export interface ICollaboratorDocument extends MongoDocument {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  role: CollaboratorRole;
  addedAt: Date;
}

const CollaboratorSchema = new Schema<ICollaboratorDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: [true, 'Role is required'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

CollaboratorSchema.index({ documentId: 1, userId: 1 }, { unique: true });

CollaboratorSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

const Collaborator: Model<ICollaboratorDocument> =
  mongoose.models.Collaborator ||
  mongoose.model<ICollaboratorDocument>('Collaborator', CollaboratorSchema);

export default Collaborator;
