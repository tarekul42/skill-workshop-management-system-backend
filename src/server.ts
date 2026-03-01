/* eslint-disable no-console */
import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import envVariables from "./app/config/env";
import seedSuperAdmin from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";

let server: Server;

const startServer = async () => {
  try {
    console.log("Connecting to database....");
    await mongoose.connect(envVariables.DATABASE_URL);
    console.log("Connected to Database.");

    server = app.listen(envVariables.PORT, () => {
      console.log(
        `Skill workshop management system backend is running on port: ${envVariables.PORT}`,
      );
    });
  } catch (error) {
    console.error("Failed to connect to database or start server:", error);
    process.exit(1);
  }
};

(async () => {
  await connectRedis();
  await startServer();
  await seedSuperAdmin();
})();

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection Detected. Server shutting down.\n", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception Detected. Server shutting down.\n", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Server shutting down.");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Server shutting down.");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
