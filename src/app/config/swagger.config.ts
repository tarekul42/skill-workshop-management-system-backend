import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import envVariables from "./env";

// Use the runtime working directory as the project root.
// - In local dev/tests: cwd is the repo root
// - In Docker: WORKDIR is /app (repo root in image)
const projectRoot = process.cwd();

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Skill Workshop Management System API",
      version: "1.0.0",
      description:
        "Backend API for managing workshops, enrollments, users, payments, and more.",
    },
    servers: [
      {
        url: `${envVariables.BACKEND_URL.BACKEND_DEV_URL}/api/v1`,
        description: "Development server",
      },
      {
        url: `${envVariables.BACKEND_URL.BACKEND_PROD_URL}/api/v1`,
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    // Dev / Bun runtime (TypeScript source)
    path.join(projectRoot, "src/app.ts"),
    path.join(projectRoot, "src/app/route/**/*.ts"),
    path.join(projectRoot, "src/app/modules/**/*.route.ts"),

    // Production / Docker runtime (compiled JavaScript)
    path.join(projectRoot, "dist/app.js"),
    path.join(projectRoot, "dist/app/route/**/*.js"),
    path.join(projectRoot, "dist/app/modules/**/*.route.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions) as {
  openapi: string;
  info: object;
  servers: object[];
  components: object;
  paths: object;
  tags: object[];
};
