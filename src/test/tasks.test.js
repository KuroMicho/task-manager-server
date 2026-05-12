import { jest } from "@jest/globals";

import mongoose from "mongoose";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import dotenv from "dotenv";

dotenv.config();

// 💡 EL MOCK DEBE IR AQUÍ, ANTES DE IMPORTAR 'app'
jest.mock("../utils/sendEmail.js", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      console.log("✅ Mock de correo ejecutado exitosamente");
      return Promise.resolve({ messageId: "test-id" });
    }),
  };
});

import request from "supertest";
import { app } from "../app.js";

describe("Pruebas de Tareas e Invitaciones", () => {
  let ownerCookie = "";
  let collaboratorCookie = "";
  let ownerId = "";
  let collabId = "";
  let taskId = "";

  // Mock para Socket.io
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeAll(async () => {
    // Inyectamos el mock de socket en el app
    app.set("socketio", mockIo);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }

    // Limpieza total antes de empezar
    await User.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});

    // 1. Crear Dueño
    const owner = await User.create({
      name: "Owner User",
      email: "owner@test.com",
      password: "password123",
    });
    ownerId = owner._id;

    // 2. Crear Colaborador
    const collab = await User.create({
      name: "Collab User",
      email: "collab@test.com",
      password: "password123",
    });
    collabId = collab._id;

    // Logins para obtener Cookies de sesión
    const resOwner = await request(app).post("/api/v1/auth/login").send({
      email: "owner@test.com",
      password: "password123",
    });
    ownerCookie = resOwner.header["set-cookie"][0].split(";")[0];

    const resCollab = await request(app).post("/api/v1/auth/login").send({
      email: "collab@test.com",
      password: "password123",
    });
    collaboratorCookie = resCollab.header["set-cookie"][0].split(";")[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/v1/tasks", () => {
    it("Debería crear una tarea correctamente", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .set("Cookie", [ownerCookie])
        .send({
          title: "Tarea de Test",
          description: "Usando Jest",
          priority: "high",
        });

      expect(res.statusCode).toBe(201);
      taskId = res.body._id;
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("Debería incluir el conteo de comentarios (Virtual)", async () => {
      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Cookie", [ownerCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toHaveProperty("commentCount");
    });
  });

  describe("POST /api/v1/tasks/:id/invite", () => {
    jest.setTimeout(10000);
    it("Debería invitar al colaborador y actualizar el equipo en la DB", async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/invite`)
        .set("Cookie", [ownerCookie])
        .send({ email: "collab@test.com" });

      expect(res.statusCode).toBe(200);

      const taskInDb = await Task.findById(taskId);
      // Usamos map para comparar solo los IDs como strings
      const teamIds = taskInDb.team.map((id) => id.toString());
      expect(teamIds).toContain(collabId.toString());
    });
  });

  describe("Control de Acceso (Seguridad)", () => {
    it("No debería dejar que el colaborador borre la tarea", async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set("Cookie", [collaboratorCookie]);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/No tienes permiso/i);
    });

    it("Debería permitir al dueño borrar la tarea", async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set("Cookie", [ownerCookie]);

      expect(res.statusCode).toBe(200);

      const taskInDb = await Task.findById(taskId);
      expect(taskInDb).toBeNull();
    });
  });
});
