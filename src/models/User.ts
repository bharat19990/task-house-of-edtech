import mongoose, { Schema, type Document as MongoDocument, type Model } from 'mongoose';

export interface IUserDocument extends MongoDocument {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as { passwordHash?: unknown }).passwordHash;
    ret.id = ret._id.toString();
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
