import { Query } from "mongoose";
import { excludeFields } from "../constants";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };

    for (const field of excludeFields) {
      // eslint-disable-next-line  @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    // Sanitize filter values to prevent NoSQL injection
    const sanitizedFilter: Record<string, string> = {};
    for (const [key, value] of Object.entries(filter)) {
      // Reject keys starting with $ to prevent operator injection
      if (typeof value === "string" && !key.startsWith("$")) {
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

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

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
