# 📝 Task Manager

REST API colaborativa para la gestión de tareas diseñada bajo arquitectura limpia, modular y despliegue automatizado.

---

## 🚀 Stack & Configuración

* **Core:** Node.js, Express, MongoDB & Mongoose.
* **DevOps:** Docker, Docker Compose & Render Blueprint (`render.yaml`).

### Variables de Entorno (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=tu_secreto_jwt
FRONTEND_URL=http://localhost:5173
```

```bash
# Levantar entorno local con Docker
docker-compose up -d
```

---

## 🔌 Endpoints de la API (`/api/v1`)

Rutas privadas requieren `Cookies` o encabezado `Authorization: Bearer <JWT_TOKEN>`.

| Módulo | Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- | --- |
| **Auth** | `POST` | `/auth/register` | Público | Registro de un nuevo usuario. |
|  | `POST` | `/auth/login` | Público | Autenticación, inicio de sesión y retorno de JWT. |
|  | `GET` | `/auth/me` | Privado | Obtiene el perfil del usuario autenticado en sesión. |
| **Tasks** | `GET` | `/tasks` | Privado | Obtiene tareas propias y colaboraciones (Ordenadas). |
|  | `GET` | `/tasks/:id` | Privado | Detalle de una tarea específica con sus datos. |
|  | `POST` | `/tasks` | Privado | Crea una nueva tarea asignada al usuario. |
|  | `PUT` | `/tasks/:id` | Privado | Modifica los datos de una tarea (Solo dueño). |
|  | `DELETE` | `/tasks/:id` | Privado | Elimina de forma permanente una tarea (Solo dueño). |
|  | `POST` | `/tasks/reorder` | Privado | **[Drag & Drop]** Reordenamiento masivo (`bulkWrite`). |
|  | `POST` | `/tasks/:id/invite` | Privado | Invita a colaborar por correo electrónico (Solo dueño). |
| **Comments** | `POST` | `/tasks/:id/comments` | Privado | Agrega un nuevo comentario dentro de una tarea. |
|  | `DELETE` | `/comments/:id` | Privado | Elimina un comentario específico (Solo el autor). |

---

## 🏗️ Estructura del Directorio

```text
src/
├── config/       # Base de datos
├── controllers/  # Lógica de negocio (getTasks, reorderTasks...)
├── middleware/   # Auth y errores globales
├── models/       # Esquemas Mongoose (User, Task)
├── routes/       # Rutas de Express
└── utils/        # Envío de correos y helpers