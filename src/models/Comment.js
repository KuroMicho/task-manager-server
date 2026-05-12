import mongoose from "mongoose";

/**
 * Esquema para los Comentarios.
 * Este modelo demuestra la relación "Muchos a Muchos" indirecta,
 * vinculando a un usuario con una tarea específica.
 */
const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "La tarea de referencia es obligatoria"],
      ref: "Task", // Debe coincidir con el nombre del modelo Task
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "El autor del comentario es obligatorio"],
      ref: "User", // Debe coincidir con el nombre del modelo User
    },
    content: {
      type: String,
      required: [true, "El contenido del comentario no puede estar vacío"],
      trim: true,
    },
  },
  {
    // Genera automáticamente los campos createdAt y updatedAt
    timestamps: true,
    // Forzamos el nombre de la colección en minúsculas (opcional pero recomendado)
    collection: "comments",
  },
);

/**
 * El campo 'ref' permite usar la función .populate() en los controladores
 * para traer los datos del usuario o la tarea en lugar de solo ver el ID.
 */

export default mongoose.model("Comment", commentSchema);
