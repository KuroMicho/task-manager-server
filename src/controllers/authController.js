import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * Función auxiliar (Helper) para generar el JWT y enviarlo en una Cookie.
 * Se configura como httpOnly por seguridad, evitando acceso desde JavaScript.
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("jwt", token, {
    httpOnly: true, // No accesible por scripts del cliente (Previene XSS)
    secure: process.env.NODE_ENV !== "development", // Solo HTTPS en producción
    sameSite: "none", // Se desabilita para permitir cookies en contextos de terceros (CORS)
    maxAge: 30 * 24 * 60 * 60 * 1000, // Vida útil de 30 días
  });
};

/**
 * @desc    Obtener datos del usuario actual
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  //req.user viene del middleware 'protect'
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

/**
 * @desc    Registrar nuevo usuario (Sin inicio de sesión automático)
 * @route   POST /api/v1/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("El usuario ya existe");
  }

  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      message: "Usuario registrado con éxito. Por favor, inicia sesión.",
    });
  } else {
    res.status(400);
    throw new Error("Datos de usuario inválidos");
  }
});

/**
 * @desc    Autenticar usuario y obtener cookie de sesión
 * @route   POST /api/v1/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateTokenAndSetCookie(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401);
    throw new Error("Email o contraseña incorrectos");
  }
});

/**
 * @desc    Cerrar sesión y limpiar la Cookie de seguridad
 * @route   POST /api/v1/auth/logout
 */
export const logoutUser = (req, res) => {
  // Limpiamos la cookie 'jwt' enviando un valor vacío y expirándola de inmediato
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Sesión cerrada correctamente" });
};

/**
 * @desc    Eliminar usuario (Solo el propio usuario puede eliminar su cuenta)
 * @route   DELETE /api/v1/auth/delete
 * @access  Private
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }

  // IMPORTANTE: Usar .deleteOne() sobre la instancia del documento
  // Esto es lo que dispara el middleware que acabamos de escribir
  await user.deleteOne();

  res.status(200).json({ message: "Usuario y todos sus datos eliminados" });
});
