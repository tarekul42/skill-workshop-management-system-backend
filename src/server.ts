import mongoose from "mongoose";
import type { Server } from "http";
import "dotenv/config";
import app from "./app";

let server: Server;
const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log("Connecting to database....");
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER_URL}/skill-workshop-management-system-backend?retryWrites=true&w=majority`,
    );
    console.log("Connected to Database.");

    server = app.listen(port, () => {
      console.log(
        `Skill workshop management system backend is running on port: ${port}`,
      );
    });
  } catch (error) {
    console.error("Failed to connect to database or start server:", error);
    process.exit(1);
  }
};

startServer();
