/* eslint-disable no-console */
import mongoose from "mongoose";
import type { Server } from "http";
import "dotenv/config";
import app from "./app";

let server: Server;
const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log("Connecting to database....");
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log("Connected to Database.");

    server = app.listen(port, () => {
      console.log(
        `Skill workshop management system backend is running on port: ${port}`
      );
    });
  } catch (error) {
    console.error("Failed to connect to database or start server:", error);
    process.exit(1);
  }
};

(async () => {
  await startServer();
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
