import { Aggregate, Query, Schema } from "mongoose";

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

  queryMethods.forEach((method) => {
    schema.pre(method as "find", function (this: Query<unknown, unknown>) {
      this.where({ isDeleted: { $ne: true } });
    });
  });

  // Handle Aggregate
  schema.pre("aggregate", function (this: Aggregate<unknown[]>) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  });

  // Add a softDelete method to the schema
  schema.methods.softDelete = async function (
    this: Record<string, unknown> & {
      save: () => Promise<unknown>;
    },
  ) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };
};

export default softDeletePlugin;
