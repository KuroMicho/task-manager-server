import User from "../models/User.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

export const clearDatabase = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403);
    throw new Error("Operación no permitida en producción");
  }

  await Comment.deleteMany({});
  await Task.deleteMany({});
  await User.deleteMany({});

  res.status(200).json({ message: "Base de datos limpiada con éxito" });
});