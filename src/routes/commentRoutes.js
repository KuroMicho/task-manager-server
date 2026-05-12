import express from "express";
import { body } from "express-validator";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validatorMiddleware.js";

// mergeParams: true es NECESARIO para acceder al :taskId desde el router de tareas
const router = express.Router({ mergeParams: true });

/**
 * REGLAS DE VALIDACIÓN
 */
const commentRules = [
  body("content")
    .notEmpty()
    .withMessage("El contenido del comentario es obligatorio.")
    .trim()
    .isLength({ min: 2 })
    .withMessage("El comentario es demasiado corto."),
];

/**
 * DEFINICIÓN DE RUTAS
 * Estas rutas se montarán en app.js como: /api/v1/tasks/:taskId/comments
 */

// Obtener y Crear comentarios para una tarea específica
router
  .route("/")
  .get(protect, getComments)
  .post(protect, commentRules, validate, createComment);

// Editar y Eliminar un comentario específico por su ID
router
  .route("/:id")
  .put(protect, commentRules, validate, updateComment)
  .delete(protect, deleteComment);

export default router;
