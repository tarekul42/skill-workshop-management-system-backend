import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { IAuthProvider, IsActive, IUser, UserRole } from "./user.interface.js";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    phone: { type: String },
    picture: { type: String },
    age: { type: Number },
    address: { type: String },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    auths: {
      type: [authProviderSchema],
      validate: {
        validator: function (auths: IAuthProvider[]) {
          const providers = auths.map((a) => a.provider);
          return new Set(providers).size === providers.length;
        },
        message: "Duplicate auth providers are not allowed.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.plugin(softDeletePlugin);
userSchema.plugin(auditPlugin);

userSchema.index({ isDeleted: 1, isActive: 1, role: 1 });
userSchema.index({ isDeleted: 1, isVerified: 1 });
userSchema.index({ name: "text", email: "text", address: "text" });

const User = model<IUser>("User", userSchema);

export default User;
