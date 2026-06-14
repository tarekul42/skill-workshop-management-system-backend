import { Types } from "mongoose";

interface IContact {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export { IContact };
