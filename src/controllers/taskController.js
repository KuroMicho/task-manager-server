import Task from "../models/Task.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/User.js";

/**
 * @desc    Obtener tareas propias y en las que se es colaborador
 * @route   GET /api/v1/tasks
 * @access  Private
 */
export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    $or: [{ user: req.user._id }, { team: req.user._id }],
  })
    .populate("user", "name email")
    .populate("commentCount") // Trae solo el número de comentarios
    .sort({ order: 1 });
  res.status(200).json(tasks);
});

/**
 * @desc    Obtener detalles de una tarea específica con sus comentarios
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "comments",
      populate: { path: "user", select: "name email" }, // Poblamos al autor del comentario
    })
    .populate("team", "name email"); // Trae nombre y correo de los INVITADOS

  if (!task) {
    res.status(404);
    throw new Error("Tarea no encontrada");
  }

  res.status(200).json(task);
});

/**
 * @desc    Crear una nueva tarea vinculada al usuario
 * @route   POST /api/v1/tasks
 * @access  Private
 */
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("El título de la tarea es obligatorio");
  }

  // Inyectamos automáticamente el ID del usuario autenticado
  const newTask = await Task.create({
    title,
    description,
    priority,
    user: req.user._id,
  });

  res.status(201).json(newTask);
});

/**
 * @desc    Actualizar una tarea (Solo si es el dueño)
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Tarea no encontrada");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("No tienes permiso para editar esta tarea");
  }

  // Actualizamos los campos recibidos o mantenemos los anteriores
  task.title = req.body.title || task.title;
  task.description = req.body.description || task.description;
  task.priority = req.body.priority || task.priority;
  task.completed =
    req.body.completed !== undefined ? req.body.completed : task.completed;

  const updatedTask = await task.save();
  res.status(200).json(updatedTask);
});

/**
 * @desc    Eliminar una tarea (Solo si es el dueño)
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Tarea no encontrada");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("No tienes permiso para borrar esta tarea");
  }

  await task.deleteOne();
  res.status(200).json({ message: "Tarea eliminada correctamente" });
});

/**
 * @desc    Reordenar la posición manual de las tareas
 * @route   POST /api/v1/tasks/reorder
 * @access  Private
 */
export const reorderTasks = asyncHandler(async (req, res) => {
  const { idsOrder } = req.body;

  if (!idsOrder || !Array.isArray(idsOrder)) {
    res.status(400);
    throw new Error(
      "Se requiere un array válido de IDs ('idsOrder') para reordenar",
    );
  }

  // Creamos un lote de operaciones concurrentes (bulk write) para maximizar el rendimiento
  const bulkOperations = idsOrder.map((id, index) => ({
    updateOne: {
      filter: {
        _id: id,
        // Garantizamos por seguridad que el usuario solo altere sus propias tareas o colaboraciones
        $or: [{ user: req.user._id }, { team: req.user._id }],
      },
      update: { $set: { order: index } },
    },
  }));

  // Ejecutamos de manera eficiente en la base de datos
  await Task.bulkWrite(bulkOperations);

  res
    .status(200)
    .json({ message: "Orden de las tareas actualizado correctamente" });
});

/**
 * @desc    Invitar a un usuario por correo a colaborar en una tarea (Solo si es el dueño)
 * @route   POST /api/v1/tasks/:id/invite
 * @access  Private
 */
export const inviteByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { id } = req.params; // ID de la tarea

  // 1. Buscar la tarea y verificar que quien invita sea el dueño
  const task = await Task.findById(id);
  if (!task || task.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Solo el dueño de la tarea puede invitar colaboradores");
  }

  // 2. Buscar al usuario invitado por su correo
  const invitedUser = await User.findOne({ email });

  if (!invitedUser) {
    res.status(404);
    throw new Error("El correo no coincide con ningún usuario registrado");
  }

  // Evitar que el dueño se invite a sí mismo
  if (invitedUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Ya eres el dueño de esta tarea");
  }

  // 3. Verificar si ya está en el equipo (Usamos .some para mayor seguridad con ObjectIds)
  const alreadyInTeam = task.team.some(
    (memberId) => memberId.toString() === invitedUser._id.toString(),
  );

  if (alreadyInTeam) {
    res.status(400);
    throw new Error("Este usuario ya forma parte del equipo");
  }

  // 4. Agregar al equipo
  task.team.push(invitedUser._id);
  await task.save();

  // 5. Enviar correo (Usando variables de entorno para la URL)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const message = `
    <div style="background-color: #0f172a; color: white; padding: 20px; font-family: sans-serif; border-radius: 10px;">
      <h2 style="color: #22d3ee;">¡Hola, ${invitedUser.name}!</h2>
      <p>Has sido invitado a colaborar en la tarea:</p>
      <div style="background: #1e293b; padding: 15px; border-left: 4px solid #22d3ee;">
        <strong>${task.title}</strong>
      </div>
      <p>Ya puedes verla y comentar en tu dashboard.</p>
      <a href="${frontendUrl}/tasks/${task._id}" 
         style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
         Ver Tarea en el Tablero
      </a>
    </div>
  `;

  try {
    await sendEmail({
      email: invitedUser.email,
      subject: `🚀 Invitación a colaborar: ${task.title}`,
      message,
    });
    res.status(200).json({ message: "Invitación enviada y correo notificado" });
  } catch (error) {
    res.status(500);
    throw new Error("Error al enviar el correo, pero el usuario fue agregado");
  }
});
