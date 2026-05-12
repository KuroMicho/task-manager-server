import express from "express";
import { body } from "express-validator";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  inviteByEmail,
  getTaskById,
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

// Obtener todas las tareas y Crear una nueva
router
  .route("/")
  .get(protect, getTasks)
  .post(protect, taskRules, validate, createTask);

// Actualizar y Eliminar por ID
router
  .route("/:id")
  .get(protect, getTaskById) // NUEVO: Obtener detalles de una tarea específica
  .put(protect, taskRules, validate, updateTask)
  .delete(protect, deleteTask);

// NUEVA RUTA: /api/v1/tasks/:id/invite
// La ponemos como POST porque estamos "enviando" una invitación
router.post('/:id/invite', protect, inviteByEmail);

export default router;
