/* eslint-disable @typescript-eslint/no-explicit-any */
import { Aggregate, Schema } from "mongoose";

const softDeletePlugin = (schema: Schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  // Filter out deleted documents for common query methods
  const queryMethods = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "update",
    "updateOne",
    "updateMany",
    "countDocuments",
  ];

  queryMethods.forEach((method: any) => {
    schema.pre(method, function (this: any) {
      this.where({ isDeleted: { $ne: true } });
    });
  });

  // Handle Aggregate
  schema.pre("aggregate" as any, function (this: Aggregate<any>) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  });

  // Add a softDelete method to the schema
  schema.methods.softDelete = async function (this: any) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };
};

export default softDeletePlugin;
