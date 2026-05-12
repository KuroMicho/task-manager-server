import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  logoutUser,
  deleteUser,
  getMe,
} from "../controllers/authController.js";
import { validate } from "../middleware/validatorMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * REGLAS DE VALIDACIÓN
 * Estas reglas interceptan la petición antes de que llegue al controlador.
 */

const registerRules = [
  body("name", "El nombre es obligatorio").notEmpty().trim(),
  body("email", "Email no válido").isEmail(),
  body("password", "La contraseña debe tener mínimo 6 caracteres").isLength({
    min: 6,
  }),
];

const loginRules = [
  body("email", "Email no válido").isEmail(),
  body("password", "La contraseña es obligatoria").exists(),
];

/**
 * DEFINICIÓN DE RUTAS
 * Prefijo global definido en app.js: /api/v1/auth
 */

// 🔍 GET /api/v1/auth/me
// Esta es la ruta para verificar sesión.
// Es PRIVADA (protect) porque lee la cookie y devuelve el usuario logueado.
router.get("/me", protect, getMe);

// POST /api/v1/auth/register
router.post("/register", registerRules, validate, registerUser);

// POST /api/v1/auth/login
router.post("/login", loginRules, validate, loginUser);

// POST /api/v1/auth/logout
// No requiere validaciones de cuerpo, solo limpia la cookie
router.post("/logout", logoutUser);

// DELETE /api/v1/auth/delete-account
router.delete("/user/:id", deleteUser);

export default router;
