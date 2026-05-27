import nodemailer from "nodemailer";

let transporter;

if (process.env.NODE_ENV !== "test") {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    pool: true,
    connectionTimeout: 10000,
    dnsLookup: (hostname, options, callback) => {
      return dns.lookup(hostname, { family: 4 }, callback);
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });
}

const sendEmail = async (options) => {
  if (process.env.NODE_ENV === "test") {
    console.log("🧪 Modo Test: Simulando envío de correo a:", options.email);
    return { messageId: "test-123" };
  }

  const mailOptions = {
    from: `"Tablero Colaborativo" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ ¡Correo enviado a ${options.email} con éxito!`);
    return info;
  } catch (error) {
    console.error("❌ Error en el servicio de mensajería:", error.message);
    throw error;
  }
};

export default sendEmail;
