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
router.get("/me", protect, getMe);
router.post("/register", registerRules, validate, registerUser);
router.post("/login", loginRules, validate, loginUser);
router.post("/logout", logoutUser);
router.delete("/user/:id", deleteUser);

export default router;
