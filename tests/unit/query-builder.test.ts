import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { model, Schema } from "mongoose";
import QueryBuilder from "../../src/app/utils/queryBuilder";

interface ITestDoc {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

const testSchema = new Schema<ITestDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

const TestModel = model<ITestDoc>("TestDoc", testSchema);

describe("QueryBuilder", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await TestModel.create([
      { name: "Alice", email: "alice@test.com", age: 30, isActive: true },
      { name: "Bob", email: "bob@test.com", age: 25, isActive: true },
      { name: "Charlie", email: "charlie@test.com", age: 35, isActive: false },
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("should filter documents", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { isActive: "true" } as Record<string, string>,
    );
    const data = await qb.filter().lean().build();
    expect(data).toHaveLength(2);
  });

  it("should paginate documents", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { page: "1", limit: "2" } as Record<string, string>,
    );
    const data = await qb.paginate().lean().build();
    expect(data).toHaveLength(2);
  });

  it("should search documents by searchable fields", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { searchTerm: "Ali" } as Record<string, string>,
    );
    const data = await qb.search(["name"]).lean().build();
    expect(data).toHaveLength(1);
    expect((data[0] as ITestDoc).name).toBe("Alice");
  });

  it("should sort documents", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { sort: "age" } as Record<string, string>,
    );
    const data = await qb.sort().lean().build();
    expect((data[0] as ITestDoc).age).toBe(25);
    expect((data[2] as ITestDoc).age).toBe(35);
  });

  it("should return correct pagination metadata", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { page: "1", limit: "2" } as Record<string, string>,
    );
    await qb.paginate().build();
    const meta = await qb.getMeta();
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(2);
    expect(meta.total).toBe(3);
    expect(meta.totalPage).toBe(2);
  });

  it("should sanitize NoSQL injection attempts in filter", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { $where: "1=1", name: "Alice" } as Record<string, string>,
    );
    const data = await qb.filter().lean().build();
    expect(data).toHaveLength(1);
    expect((data[0] as ITestDoc).name).toBe("Alice");
  });

  it("should select only specified fields", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { fields: "name email" } as Record<string, string>,
    );
    const data = await qb.fields().lean().build();
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("email");
    expect(data[0]).not.toHaveProperty("age");
  });

  it("should reject sort fields with $ prefix", async () => {
    const qb = new QueryBuilder(
      TestModel.find(),
      { sort: "$where" } as Record<string, string>,
    );
    const data = await qb.sort().lean().build();
    expect(data).toHaveLength(3);
  });
});
