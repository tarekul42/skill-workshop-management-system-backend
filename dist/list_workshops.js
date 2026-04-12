"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const workshop_model_1 = require("./app/modules/workshop/workshop.model");
const env_1 = __importDefault(require("./app/config/env"));
async function list() {
    await mongoose_1.default.connect(env_1.default.DATABASE_URL);
    const workshops = await workshop_model_1.WorkShop.find({}, { title: 1, slug: 1 });
    console.log(JSON.stringify(workshops, null, 2));
    await mongoose_1.default.connection.close();
}
list();
