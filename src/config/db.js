import mongoose from "mongoose";

/**
 * Función para establecer la conexión con MongoDB.
 * Se utiliza async/await ya que la conexión es una operación asíncrona.
 */
export const connectDB = async () => {
  try {
    // Se conecta a MongoDB usando la URI adecuada según el entorno (producción o desarrollo)
    const conn = await mongoose.connect(
      process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI
        : process.env.MONGO_URI_TEST,
    );
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    // Si hay un error (ej: IP no autorizada en Atlas o contraseña incorrecta)
    console.error(`❌ Error de conexión: ${error.message}`);
    process.exit(1);
  }
};
