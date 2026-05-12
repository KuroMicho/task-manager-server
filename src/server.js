import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
// Cambia la importación para traer el server
import { app, server } from "./app.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    // Usa 'server.listen', no 'app.listen'
    server.listen(PORT, () => {
      console.log(`🚀 Servidor y Sockets listos en http://localhost:${PORT}`);
      console.log(`📝 Documentación en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(`❌ Error al iniciar: ${error.message}`);
    process.exit(1);
  }
};

startServer();
