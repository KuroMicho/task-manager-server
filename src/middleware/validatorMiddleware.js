import { validationResult } from "express-validator";

/**
 * Middleware de validación de resultados.
 * Este middleware se coloca después de las reglas de validación en las rutas.
 * Si express-validator encuentra errores, detiene la petición y devuelve un 400.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors
    .array()
    .map((err) => ({ [err.path]: err.msg }));

  return res
    .status(400)
    .json({ message: "Error de validación", errors: extractedErrors });
};
