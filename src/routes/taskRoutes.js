import express from "express";
import { body } from "express-validator";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  inviteByEmail,
  getTaskById,
  reorderTasks,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validatorMiddleware.js";

const router = express.Router();

/**
 * REGLAS DE VALIDACIÓN PARA TAREAS
 * Se aplican tanto al crear como al actualizar.
 */
const taskRules = [
  body("title")
    .notEmpty()
    .withMessage("El título es requerido.")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Mínimo 3 caracteres."),

  // Validamos opcionalmente la prioridad si viene en el cuerpo
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Prioridad no válida (debe ser: low, medium o high)"),
];

/**
 * DEFINICIÓN DE RUTAS
 * Prefijo global definido en app.js: /api/v1/tasks
 * Nota: Todas las rutas requieren el middleware 'protect'.
 */
router
  .route("/")
  .get(protect, getTasks)
  .post(protect, taskRules, validate, createTask);
router
  .route("/:id")
  .get(protect, getTaskById)
  .put(protect, taskRules, validate, updateTask)
  .delete(protect, deleteTask);
router.post("/:id/invite", protect, inviteByEmail);
router.route("/reorder").post(protect, reorderTasks);

export default router;
