import request from "supertest";
import { app } from "../app.js";
import mongoose from "mongoose";
import User from "../models/User.js";

describe("Pruebas de Autenticación (Auth)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }
    // Limpieza inicial para evitar conflictos de correos duplicados
    await User.deleteMany({ email: /@test.com$/ });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test.com$/ });
    await mongoose.connection.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("Debería registrar un nuevo usuario (sin devolver token en el body)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: "nuevo@test.com",
        password: "Password123!",
      });

      expect(res.statusCode).toBe(201);
      // Verificamos datos, pero NO el token
      expect(res.body.name).toBe("Test User");
      expect(res.body).toHaveProperty(
        "message",
        "Usuario registrado con éxito. Por favor, inicia sesión.",
      );
      expect(res.body).not.toHaveProperty("token");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("Debería fallar con 401 si el usuario no existe", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "no-existe@test.com",
        password: "Password123!",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/incorrectos/);
    });

    it("Debería loguearse exitosamente y recibir una Cookie JWT", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nuevo@test.com",
        password: "Password123!",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("name", "Test User");

      // Verificamos que la cabecera 'set-cookie' contenga el JWT
      // Supertest devuelve las cookies en un array dentro de res.header['set-cookie']
      expect(res.header["set-cookie"]).toBeDefined();
      expect(res.header["set-cookie"][0]).toMatch(/^jwt=/);
    });
  });
});
