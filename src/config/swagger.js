import swaggerJSDoc from "swagger-jsdoc";

/**
 * Configuración de la especificación OpenAPI (Swagger)
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API 🚀",
      version: "1.0.0",
      description:
        "API para la gestión de tareas con autenticación JWT y persistencia en MongoDB.",
      contact: {
        name: "Soporte Técnico - Electiva Profesional 3",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Servidor de Desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        // Configuración para permitir el envío de Tokens vía Header
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Rutas donde Swagger buscará los comentarios para generar la documentación
  apis: ["./src/docs/*.yaml", "./src/routes/*.js"],
};

export const swaggerDocs = swaggerJSDoc(swaggerOptions);
