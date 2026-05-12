/**
 * Utility: asyncHandler
 * Envuelve las funciones asíncronas de los controladores para capturar errores
 * sin necesidad de escribir bloques try/catch repetitivos.
 * Si ocurre un error, lo envía automáticamente al manejador de errores global.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware: notFound
 * Se ejecuta si la petición llega a este punto sin haber coincidido con ninguna ruta.
 * Captura errores 404 (Recurso no encontrado).
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error); // Enviamos el error al errorHandler
};

/**
 * Middleware: errorHandler
 * Centraliza todos los errores de la aplicación.
 * Garantiza que las respuestas de error siempre tengan un formato JSON consistente.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "" : err.stack,
  });
};
