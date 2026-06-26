import mongoose, { Schema, type Document as MongoDocument, type Model, type Types } from 'mongoose';

export interface IDocumentVersionDocument extends MongoDocument {
  documentId: Types.ObjectId;
  createdBy: Types.ObjectId;
  label: string;
  yjsSnapshot: Buffer;
  contentSnapshot: string;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersionDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    label: {
      type: String,
      required: [true, 'Version label is required'],
      trim: true,
      maxlength: 100,
    },
    yjsSnapshot: {
      type: Buffer,
      required: [true, 'Yjs snapshot is required'],
    },
    contentSnapshot: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

DocumentVersionSchema.index({ documentId: 1, createdAt: -1 });

DocumentVersionSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete (ret as { __v?: unknown }).__v;
    delete (ret as { yjsSnapshot?: unknown }).yjsSnapshot; 
    return ret;
  },
});

const DocumentVersion: Model<IDocumentVersionDocument> =
  mongoose.models.DocumentVersion ||
  mongoose.model<IDocumentVersionDocument>('DocumentVersion', DocumentVersionSchema);

export default DocumentVersion;
