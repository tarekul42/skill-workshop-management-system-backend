import { Query } from "mongoose";
import { excludeFields } from "../constants.js";

// Fields that must never be settable as a filter nor projectable via ?fields=
const FORBIDDEN_FIELDS = new Set([
  "password",
  "__v",
  "_id",
  "isDeleted",
  "deletedAt",
]);

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(allowedFilterFields?: string[]): this {
    const sanitizedFilter: Record<string, string> = {};
    const allowed = allowedFilterFields
      ? new Set(allowedFilterFields)
      : undefined;

    for (const [key, value] of Object.entries(this.query)) {
      if (!excludeFields.includes(key) && typeof value === "string" && !key.startsWith("$")) {
        if (FORBIDDEN_FIELDS.has(key)) continue;
        if (allowed && !allowed.has(key)) continue;
        sanitizedFilter[key] = value;
      }
    }

    this.modelQuery = this.modelQuery.find(sanitizedFilter);

    return this;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm || "";

    if (!searchTerm) {
      return this;
    }

    // Escape regex special characters
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchQuery = {
      $or: searchableFields.map((field) => ({
        [field]: { $regex: escapedSearchTerm, $options: "i" },
      })),
    };

    this.modelQuery = this.modelQuery.find(searchQuery);

    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";

    // Validate: reject sort values starting with $ or containing dots (nested field attacks)
    const sortFields = sort.split(",").map((s) => s.trim());
    const sanitizedSort = sortFields
      .filter((s) => !s.startsWith("$") && !s.includes("."))
      .join(" ");

    this.modelQuery = this.modelQuery.sort(sanitizedSort || "-createdAt");

    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    // Strip any characters that aren't valid MongoDB field name characters
    // (alphanumeric, underscore, space, minus). This prevents NoSQL injection
    // via projection operators like { $gt: "" } or { field: 0 }.
    const sanitized = fields.replace(/[^a-zA-Z0-9_ -]/g, "");

    // Drop sensitive/internal fields even if explicitly requested,
    // e.g. ?fields=name,password must never re-include the password hash.
    const safeFields = sanitized
      .split(" ")
      .filter((f) => {
        const bare = f.replace(/^-/, "");
        return bare.length > 0 && !FORBIDDEN_FIELDS.has(bare);
      })
      .join(" ");

    this.modelQuery = this.modelQuery.select(safeFields);

    return this;
  }

  paginate(): this {
    const page = Math.max(1, Number(this.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(this.query.limit) || 10));
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  lean(): this {
    this.modelQuery = this.modelQuery.lean() as Query<T[], T>;
    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    const totalDocuments = await this.modelQuery.model.countDocuments(
      this.modelQuery.getFilter(),
    );

    const page = Number(this.query.page) || 1;
    const limit = Math.max(1, Number(this.query.limit) || 10);

    const totalPage = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };
  }
}

export default QueryBuilder;
