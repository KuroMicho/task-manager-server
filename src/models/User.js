import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Esquema de Usuario.
 * Define la estructura de las cuentas y centraliza la lógica de seguridad.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true, // Evita duplicados a nivel de base de datos
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

/**
 * Middleware 'pre-save' (Hook).
 * Se ejecuta automáticamente ANTES de guardar el documento en la base de datos.
 * Aquí realizamos el Hashing de la contraseña.
 */
userSchema.pre("save", async function (next) {
  // IMPORTANTE: Si no se modificó la contraseña (ej: cambiamos solo el nombre),
  // no volvemos a encriptar lo que ya está encriptado.
  if (!this.isModified("password")) {
    return next();
  }

  // Generamos un 'salt' (semilla de seguridad) y hasheamos la contraseña
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Método personalizado para comparar contraseñas.
 * Compara la contraseña ingresada en el login con el hash guardado en la DB.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Middleware 'pre-deleteOne'.
 * Se activa cuando ejecutas user.deleteOne().
 * Elimina todas las tareas y comentarios asociados al usuario.
 */
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const userId = this._id;

    try {
      // 1. Eliminar todas las tareas donde este usuario es el dueño
      await mongoose.model("Task").deleteMany({ user: userId });

      // 2. Eliminar todos los comentarios escritos por este usuario
      await mongoose.model("Comment").deleteMany({ user: userId });

      // 3. Quitar al usuario de los equipos de otras tareas
      await mongoose
        .model("Task")
        .updateMany({ team: userId }, { $pull: { team: userId } });

      console.log(`🗑️ Limpieza completada para el usuario: ${userId}`);
    } catch (error) {
      console.error("❌ Error en la limpieza en cascada:", error);
      throw error;
    }
  },
);

export default mongoose.model("User", userSchema);
