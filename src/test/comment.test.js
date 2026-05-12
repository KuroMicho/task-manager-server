import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import dotenv from "dotenv";

dotenv.config();

describe("Pruebas de Comentarios (Nested Routes + Sockets)", () => {
  let authCookie = "";
  let taskId = "";
  let testUserId = "";

  // Simulación del objeto Socket.io (Mock)
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }

    // 💡 INYECCIÓN DEL MOCK: Evita que el controlador falle al usar sockets
    app.set("socketio", mockIo);

    // 1. Limpieza usando deleteOne para disparar middlewares si fuera necesario
    await User.deleteMany({ email: "commenter@test.com" });
    await Task.deleteMany({});
    await Comment.deleteMany({});

    // 2. Crear usuario
    const user = await User.create({
      name: "Commenter User",
      email: "commenter@test.com",
      password: "password123",
    });
    testUserId = user._id;

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "commenter@test.com",
      password: "password123",
    });
    authCookie = loginRes.header["set-cookie"][0].split(";")[0];

    // 3. Crear tarea previa
    const task = await Task.create({
      title: "Tarea para comentar",
      description: "Prueba de integración",
      user: testUserId,
    });
    taskId = task._id;
  });

  afterAll(async () => {
    // Usamos el método que activa nuestra eliminación en cascada
    const user = await User.findOne({ email: "commenter@test.com" });
    if (user) await user.deleteOne();

    await mongoose.connection.close();
  });

  describe("POST /api/v1/tasks/:taskId/comments", () => {
    it("Debería crear un comentario y emitir evento por Socket.io", async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Cookie", [authCookie])
        .send({
          content: "Este es un comentario de prueba con sockets",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.content).toBe(
        "Este es un comentario de prueba con sockets",
      );

      // ✅ VERIFICACIÓN DE SOCKET: Comprobamos que el controlador intentó avisar al equipo
      expect(mockIo.to).toHaveBeenCalledWith(taskId.toString());
      expect(mockIo.emit).toHaveBeenCalledWith(
        "receive_comment",
        expect.any(Object),
      );
    });

    it("Debería fallar si el contenido está vacío", async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Cookie", [authCookie])
        .send({ content: "" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/tasks/:taskId/comments", () => {
    it("Debería obtener la lista de comentarios de la tarea", async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set("Cookie", [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("DELETE /api/v1/tasks/:taskId/comments/:id", () => {
    it("Debería eliminar un comentario propio", async () => {
      const comment = await Comment.create({
        content: "Borrar esto",
        task: taskId,
        user: testUserId,
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${comment._id}`)
        .set("Cookie", [authCookie]);

      expect(res.statusCode).toBe(200);

      // Verificamos que ya no exista en la DB
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });
  });
});
