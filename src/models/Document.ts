import mongoose, { Schema, type Document as MongoDocument, type Model, type Types } from 'mongoose';

export interface IDocDocument extends MongoDocument {
  title: string;
  ownerId: Types.ObjectId;
  yjsState: Buffer;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    yjsState: {
      type: Buffer,
      default: Buffer.from([]),
    },
    content: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

DocumentSchema.index({ ownerId: 1, isDeleted: 1 });
DocumentSchema.index({ updatedAt: -1 });

DocumentSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete (ret as { __v?: unknown }).__v;
    
    delete (ret as { yjsState?: unknown }).yjsState;
    return ret;
  },
});

const DocumentModel: Model<IDocDocument> =
  mongoose.models.Document || mongoose.model<IDocDocument>('Document', DocumentSchema);

export default DocumentModel;
