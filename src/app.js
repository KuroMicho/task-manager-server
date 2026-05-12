import dotenv from "dotenv";
import http from "http";
import express from "express";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { swaggerDocs } from "./config/swagger.js";
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { Server } from "socket.io";

dotenv.config();

const app = express();
// Crear el servidor HTTP compatible con Sockets
const server = http.createServer(app);

// Configurar Socket.io con CORS (importante para que tu React lo vea)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

// Hacer que 'io' sea accesible en tus controladores
app.set("socketio", io);

// Lógica de conexión de Sockets
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  // Unirse a una "Sala" específica (ID de la tarea)
  socket.on("join_task", (taskId) => {
    socket.join(taskId);
    console.log(`👤 Usuario se unió a la tarea: ${taskId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado");
  });
});

// MiDLEWARES DE SEGURIDAD Y LOGS
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message:
    "Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos.",
});

app.use("/api/", limiter);

// CORS: Comunicacion con el Frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Parsers: Lectura de JSON y Cookies
app.use(express.json());
app.use(cookieParser());

// Documentacion (SIEMPRE antes de los errores)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas

// Ruta de salud para verificar que el servidor está activo
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.use("/api/v1/test", testRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks/:taskId/comments", commentRoutes);

// Middleware Manejo de errores
app.use(notFound);
app.use(errorHandler);

export { app, server };