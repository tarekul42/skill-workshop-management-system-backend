"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    filter() {
        const filter = { ...this.query };
        for (const field of constants_1.excludeFields) {
            // eslint-disable-next-line  @typescript-eslint/no-dynamic-delete
            delete filter[field];
        }
        // Sanitize filter values to prevent NoSQL injection
        const sanitizedFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            // Reject keys starting with $ to prevent operator injection
            if (typeof value === "string" && !key.startsWith("$")) {
                sanitizedFilter[key] = value;
            }
        }
        this.modelQuery = this.modelQuery.find(sanitizedFilter);
        return this;
    }
    search(searchableFields) {
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
    sort() {
        const sort = this.query.sort || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    fields() {
        const fields = this.query.fields?.split(",").join(" ") || "";
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    paginate() {
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
        const totalDocuments = await this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
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
exports.default = QueryBuilder;
