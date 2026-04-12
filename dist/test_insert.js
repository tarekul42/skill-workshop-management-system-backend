"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const workshop_model_1 = require("./app/modules/workshop/workshop.model");
const env_1 = __importDefault(require("./app/config/env"));
async function test() {
    await mongoose_1.default.connect(env_1.default.DATABASE_URL);
    try {
        const workshop = new workshop_model_1.WorkShop({
            title: "Test Workshop",
            slug: "test-workshop-" + Date.now(),
            category: new mongoose_1.default.Types.ObjectId("69a3b702554b47b8019cdc9a"),
            level: new mongoose_1.default.Types.ObjectId("69a3b78dcfcd75d8a84c33c5"),
        });
        await workshop.save();
        console.log("Saved workshop:", workshop.slug);
    }
    catch (err) {
        console.error("Error saving workshop:", err);
    }
    finally {
        await mongoose_1.default.connection.close();
    }
}
test();
