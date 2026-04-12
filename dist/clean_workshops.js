"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const workshop_model_1 = require("./app/modules/workshop/workshop.model");
const env_1 = __importDefault(require("./app/config/env"));
async function clean() {
    await mongoose_1.default.connect(env_1.default.DATABASE_URL);
    const result = await workshop_model_1.WorkShop.deleteMany({ slug: null });
    console.log(`Deleted ${result.deletedCount} workshops with slug: null`);
    await mongoose_1.default.connection.close();
}
clean();
