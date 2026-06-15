import { model, Schema } from "mongoose";
import { IContact } from "./contact.interface.js";

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1, createdAt: -1 });

const Contact = model<IContact>("Contact", contactSchema);

export default Contact;
