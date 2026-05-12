import mongoose from "mongoose";

/**
 * Esquema para las Tareas (Tasks).
 * Este modelo representa el recurso principal de la aplicación.
 */
const taskSchema = new mongoose.Schema(
  {
    // 🔑 Clave de Propiedad: Vincula la tarea con un usuario específico.
    // Sin esto, no podríamos implementar la seguridad de "solo mis tareas".
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Referencia al modelo User
    },
    // 👥 NUEVO: Array de colaboradores invitados
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
      required: [true, "El título de la tarea es obligatorio"],
      trim: true,
      maxlength: [100, "El título no puede exceder los 100 caracteres"],
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // Integridad de datos: Solo permite valores específicos.
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "{VALUE} no es una prioridad válida",
      },
      default: "medium",
    },
  },
  {
    // Gestiona automáticamente la creación y actualización de fechas
    timestamps: true,
    collection: "tasks",
    // 💡 IMPORTANTE: Esto permite que los campos virtuales se incluyan en el JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Relación virtual para obtener comentarios sin guardarlos físicamente en la tarea
taskSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "task",
});

taskSchema.virtual("commentCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "task",
  count: true, // solo cuenta registros
});

export default mongoose.model("Task", taskSchema);
