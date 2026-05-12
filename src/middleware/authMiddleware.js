import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "./errorMiddleware.js";

/**
 * Middleware de protección de rutas.
 * Verifica la identidad del usuario mediante JWT antes de permitir el acceso.
 * Soporta tokens vía Cookies (Frontend) y via Bearer Header (Swagger/Postman).
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      // Verificamos que el token sea auténtico y no haya expirado
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos al usuario en la BD usando el ID del token
      // Excluimos el password del objeto req.user por seguridad
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401);
      throw new Error("No autorizado, token fallido");
    }
  } else {
    res.status(401);
    throw new Error("No autorizado, no se proporcionó un token");
  }
});
