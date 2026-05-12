import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    Obtener todos los comentarios de una tarea (Dueño o Colaborador)
 * @route   GET /api/v1/tasks/:taskId/comments
 * @access  Private
 */
export const getComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    res.status(404);
    throw new Error("Tarea no encontrada");
  }

  // 🛡️ VALIDACIÓN DE PERMISOS: ¿Es el dueño O es parte del equipo?
  const isOwner = task.user.toString() === req.user._id.toString();
  const isMember = task.team.some(
    (memberId) => memberId.toString() === req.user._id.toString(),
  );

  if (!isOwner && !isMember) {
    res.status(401);
    throw new Error("No tienes permiso para ver los comentarios de esta tarea");
  }

  const comments = await Comment.find({ task: req.params.taskId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json(comments);
});

/**
 * @desc    Crear un comentario en una tarea (Dueño o Colaborador)
 * @route   POST /api/v1/tasks/:taskId/comments
 * @access  Private
 */
export const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    res.status(404);
    throw new Error("Tarea no encontrada");
  }

  // 🛡️ VALIDACIÓN DE PERMISOS: ¿Es el dueño O es parte del equipo?
  const isOwner = task.user.toString() === req.user._id.toString();
  const isMember = task.team.some(
    (memberId) => memberId.toString() === req.user._id.toString(),
  );

  if (!isOwner && !isMember) {
    res.status(401);
    throw new Error("No tienes permiso para comentar en esta tarea");
  }

  if (!content) {
    res.status(400);
    throw new Error("El contenido del comentario es obligatorio");
  }

  const comment = await Comment.create({
    task: req.params.taskId,
    user: req.user._id,
    content,
  });

  const populatedComment = await comment.populate("user", "name email");

  // 📡 NOTIFICACIÓN POR SOCKET
  const io = req.app.get("socketio");
  const roomID = req.params.taskId.toString();

  console.log(`📢 Nuevo comentario de ${req.user.name} en sala: ${roomID}`);
  io.to(roomID).emit("receive_comment", populatedComment);

  res.status(201).json(populatedComment);
});

/**
 * @desc    Actualizar un comentario propio
 * @route   PUT /api/v1/tasks/:taskId/comments/:id
 * @access  Private
 */
export const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("Comentario no encontrado");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("No autorizado para editar este comentario");
  }

  if (!content) {
    res.status(400);
    throw new Error("El contenido del comentario es obligatorio");
  }

  comment.content = content;
  const updatedComment = await comment.save();
  await updatedComment.populate("user", "name email");

  res.status(200).json(updatedComment);
});

/**
 * @desc    Eliminar un comentario propio
 * @route   DELETE /api/v1/tasks/:taskId/comments/:id
 * @access  Private
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("Comentario no encontrado");
  }

  // 🛡️ Seguridad: Solo el autor puede borrar su comentario
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("No autorizado para borrar este comentario");
  }

  const commentId = comment._id;
  const taskId = req.params.taskId;

  await comment.deleteOne();

  // 📡 NOTIFICACIÓN POR SOCKET
  const io = req.app.get("socketio");
  if (io) {
    const roomID = taskId.toString();
    console.log(
      `🗑️ Notificando eliminación de comentario ${commentId} en sala: ${roomID}`,
    );

    // Emitimos el ID del comentario eliminado para que el front lo filtre del array
    io.to(roomID).emit("comment_deleted", commentId);
  }

  res.status(200).json({
    message: "Comentario eliminado correctamente",
    id: commentId,
  });
});
