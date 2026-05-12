# 📝 Task Manager API

Sistema de gestión de tareas colaborativo diseñado bajo una arquitectura limpia y modular (**MVC**). Esta API permite la administración de tareas, autenticación de usuarios y está preparada para un entorno de despliegue continuo.

## 🚀 Tecnologías
*   **Backend:** Node.js & Express.
*   **Base de Datos:** MongoDB (vía Atlas) con Mongoose.
*   **DevOps:** Docker & Docker Compose.
*   **Despliegue:** Render Blueprint (`render.yaml`).

---

## ⚙️ Configuración e Instalación

### 1. Variables de Entorno
Crea un archivo `.env` basado en el archivo `.env.example` proporcionado. **Nunca subas el archivo `.env` al repositorio.**

### 2. Ejecución con Docker (Recomendado)
Para levantar el entorno local con la base de datos y la interfaz de Mongo Express:
```bash
docker-compose up -d
