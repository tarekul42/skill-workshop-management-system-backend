import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
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
      schemas: {
        BaseResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errorSources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
            stack: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            picture: { type: "string" },
            age: { type: "number" },
            address: { type: "string" },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"],
            },
            isActive: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
            },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            thumbnail: { type: "string" },
            description: { type: "string" },
          },
        },
        Level: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
          },
        },
        Workshop: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            images: { type: "array", items: { type: "string" } },
            location: { type: "string" },
            price: { type: "number" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            whatYouLearn: { type: "array", items: { type: "string" } },
            prerequisites: { type: "array", items: { type: "string" } },
            benefits: { type: "array", items: { type: "string" } },
            syllabus: { type: "array", items: { type: "string" } },
            maxSeats: { type: "number" },
            minAge: { type: "number" },
            category: { $ref: "#/components/schemas/Category" },
            level: { $ref: "#/components/schemas/Level" },
          },
        },
        Enrollment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            workshop: { $ref: "#/components/schemas/Workshop" },
            studentCount: { type: "number" },
            status: {
              type: "string",
              enum: ["PENDING", "CANCEL", "COMPLETE", "FAILED"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            enrollment: { type: "string" },
            transactionId: { type: "string" },
            amount: { type: "number" },
            invoiceUrl: { type: "string" },
            status: {
              type: "string",
              enum: ["PAID", "UNPAID", "CANCELLED", "FAILED", "REFUNDED"],
            },
          },
        },
      },
      responses: {
        BadRequestError: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        UnauthorizedError: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ForbiddenError: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFoundError: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
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
