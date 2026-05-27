import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async (options) => {
  if (process.env.NODE_ENV === "test") {
    console.log("Modo Test: Simulando envío con Resend a:", options.email);
    return { id: "test-123" };
  }

  if (!resend) {
    console.error("Resend no ha sido inicializado. Falta RESEND_API_KEY.");
    throw new Error("Servicio de mensajería no configurado");
  }

  try {
    const data = await resend.emails.send({
      from: "Tablero Colaborativo <onboarding@resend.dev>",
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    console.log(
      `¡Correo gestionado por Resend enviado con éxito a ${options.email}! ID: ${data.id}`,
    );
    return data;
  } catch (error) {
    console.error("❌ Error en la pasarela de Resend:", error.message);
    throw error;
  }
};

export default sendEmail;
