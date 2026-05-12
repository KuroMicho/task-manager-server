import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendEmail = async (options) => {
  // SI ESTAMOS EN TEST, NO HACEMOS NADA REAL
  if (process.env.NODE_ENV === 'test') {
    console.log("🧪 Modo Test: Simulando envío de correo a:", options.email);
    return { messageId: 'test-123' };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Esto es vital para que la conexión no se cuelgue en redes locales
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    console.log("⏳ Verificando conexión con Gmail...");
    await transporter.verify();

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ ¡Correo enviado con éxito!");
    return info;
  } catch (error) {
    console.error("❌ Error en localhost:", error.message);
    throw error;
  }
};

export default sendEmail;
