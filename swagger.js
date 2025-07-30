import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tako.io API",
      version: "1.0.0",
      description: "API documentation for Tako.io",
    },
    servers: [
      {
        url: "http://localhost:5000", // Change to your base URL
      },
    ],
  },
  apis: [
    "./routes/user/userRoutes.js",
    "./routes/auth/authRoutes.js",
    "./routes/status/statusRoutes.js",
    "./routes/tags/tagsRoutes.js",
  ], // Path to the files with Swagger comments
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
